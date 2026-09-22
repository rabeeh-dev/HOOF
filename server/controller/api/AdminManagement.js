const Order = require("../../model/Order");
const User = require("../../model/User");
const Wallet = require("../../model/Wallet");

const ORDER_SORT_FIELDS = new Set(["createdAt", "totalAmount", "status", "paymentStatus", "paymentMethod"]);
const USER_SORT_FIELDS = new Set(["createdAt", "fullName", "email", "totalOrders", "totalSpend"]);

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (query, fallbackLimit = 10) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || fallbackLimit, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const parseSort = (sortBy, sortOrder, allowed, fallback = "createdAt") => {
  const field = allowed.has(sortBy) ? sortBy : fallback;
  const direction = sortOrder === "ascend" || sortOrder === "asc" ? 1 : -1;
  return { [field]: direction };
};

const buildOrderQuery = async ({ status, payment, paymentStatus, search }) => {
  const query = {
    $nor: [{ paymentMethod: "upi", paymentStatus: "Pending" }]
  };

  if (status) query.status = status;
  if (payment) query.paymentMethod = { $regex: new RegExp(`^${escapeRegex(payment)}$`, "i") };
  if (paymentStatus) query.paymentStatus = paymentStatus;

  if (search) {
    const cleanSearch = search.replace("#", "").trim();
    const searchRegex = new RegExp(escapeRegex(cleanSearch), "i");
    const matchingUsers = await User.find({
      $or: [{ fullName: searchRegex }, { email: searchRegex }]
    }).select("_id");

    query.$or = [
      { "shippingAddress.fullName": searchRegex },
      { userId: { $in: matchingUsers.map((user) => user._id) } },
      { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: cleanSearch, options: "i" } } }
    ];
  }

  return query;
};

exports.listOrders = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 10);
    const sort = parseSort(req.query.sortBy, req.query.sortOrder, ORDER_SORT_FIELDS);
    const query = await buildOrderQuery(req.query);

    const [totalOrders, orders, statsAggregation] = await Promise.all([
      Order.countDocuments(query),
      Order.find(query)
        .populate("userId", "fullName email phone")
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Order.aggregate([
        { $match: { $nor: [{ paymentMethod: "upi", paymentStatus: "Pending" }] } },
        {
          $facet: {
            statusCounts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
            totals: [
              { $match: { status: { $nin: ["CANCELLED", "Returned"] } } },
              {
                $group: {
                  _id: null,
                  revenue: { $sum: "$totalAmount" },
                  discount: { $sum: { $ifNull: ["$discountAmount", 0] } },
                  count: { $sum: 1 }
                }
              }
            ]
          }
        }
      ])
    ]);

    const statusCounts = (statsAggregation[0]?.statusCounts || []).reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
    const totals = statsAggregation[0]?.totals?.[0] || {};

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalOrders,
        totalPages: Math.ceil(totalOrders / limit) || 1
      },
      stats: {
        total: totalOrders,
        pending: statusCounts.Pending || 0,
        processing: statusCounts.Processing || 0,
        delivered: statusCounts.DELIVERED || 0,
        totalRevenue: totals.revenue || 0,
        totalDiscount: totals.discount || 0,
        activeOrderCount: totals.count || 0
      }
    });
  } catch (error) {
    console.error("API listOrders error:", error);
    res.status(500).json({ success: false, message: "Failed to load orders" });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "fullName email phone")
      .populate("items.productId")
      .lean();

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const { paymentStatus } = req.body;
    const allowedStatuses = ["Pending", "SUCCESS", "Paid", "Failed", "Refunded", "Partially Refunded"];

    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({ success: false, message: "Invalid payment status" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    order.paymentStatus = paymentStatus;
    order.statusHistory.push({
      status: `Payment ${paymentStatus}`,
      note: `Payment status updated to ${paymentStatus} by admin`
    });

    await order.save();
    res.json({ success: true, message: "Payment status updated successfully", order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listCustomers = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query, 10);
    const { search, status } = req.query;
    const sort = parseSort(req.query.sortBy, req.query.sortOrder, USER_SORT_FIELDS);

    const query = {};
    if (status === "blocked") query.isBlocked = true;
    if (status === "active") query.isBlocked = false;
    if (search) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [{ fullName: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "userId",
          as: "orders"
        }
      },
      {
        $lookup: {
          from: "wallets",
          localField: "_id",
          foreignField: "userId",
          as: "wallet"
        }
      },
      {
        $addFields: {
          totalOrders: { $size: "$orders" },
          totalSpend: {
            $reduce: {
              input: "$orders",
              initialValue: 0,
              in: {
                $cond: [
                  { $not: [{ $in: ["$$this.status", ["CANCELLED", "Returned"]] }] },
                  { $add: ["$$value", { $ifNull: ["$$this.totalAmount", 0] }] },
                  "$$value"
                ]
              }
            }
          },
          walletBalance: { $ifNull: [{ $arrayElemAt: ["$wallet.balance", 0] }, 0] }
        }
      },
      { $project: { password: 0, orders: 0, wallet: 0 } }
    ];

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(query),
      User.aggregate([...pipeline, { $sort: sort }, { $skip: skip }, { $limit: limit }])
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalUsers,
        totalPages: Math.ceil(totalUsers / limit) || 1
      }
    });
  } catch (error) {
    console.error("API listCustomers error:", error);
    res.status(500).json({ success: false, message: "Failed to load customers" });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const [user, orders, wallet] = await Promise.all([
      User.findById(req.params.id).select("-password").lean(),
      Order.find({ userId: req.params.id }).sort({ createdAt: -1 }).limit(25).lean(),
      Wallet.findOne({ userId: req.params.id }).lean()
    ]);

    if (!user) return res.status(404).json({ success: false, message: "Customer not found" });

    res.json({
      success: true,
      user,
      orders,
      wallet: wallet || { balance: 0, transactions: [] }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
