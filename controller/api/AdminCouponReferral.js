const Coupon = require("../../model/Coupon");
const ReferralConfig = require("../../model/ReferralConfig");
const User = require("../../model/User");

const COUPON_SORT_FIELDS = new Set([
  "createdAt",
  "couponCode",
  "discountValue",
  "minPurchaseAmount",
  "expiryDate",
  "usageLimit",
  "usedCount"
]);

const escapeRegex = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

const parseSort = (sortBy, sortOrder) => {
  const field = COUPON_SORT_FIELDS.has(sortBy) ? sortBy : "createdAt";
  const direction = sortOrder === "ascend" || sortOrder === "asc" ? 1 : -1;
  return { [field]: direction };
};

const buildCouponQuery = ({ search, status, discountType }) => {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
    query.$or = [{ couponCode: searchRegex }, { description: searchRegex }];
  }

  if (discountType) query.discountType = discountType;

  if (status === "active") {
    query.isActive = true;
    query.isBlocked = false;
    query.expiryDate = { $gt: new Date() };
  }
  if (status === "disabled") query.isBlocked = true;
  if (status === "expired") query.expiryDate = { $lte: new Date() };

  return query;
};

exports.listCoupons = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const query = buildCouponQuery(req.query);
    const sort = parseSort(req.query.sortBy, req.query.sortOrder);

    const [totalCoupons, coupons] = await Promise.all([
      Coupon.countDocuments(query),
      Coupon.find(query).sort(sort).skip(skip).limit(limit).lean()
    ]);

    res.json({
      success: true,
      coupons,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalCoupons,
        totalPages: Math.ceil(totalCoupons / limit) || 1
      }
    });
  } catch (error) {
    console.error("API listCoupons error:", error);
    res.status(500).json({ success: false, message: "Failed to load coupons" });
  }
};

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    res.json({ success: true, message: "Coupon deleted successfully" });
  } catch (error) {
    console.error("API deleteCoupon error:", error);
    res.status(500).json({ success: false, message: "Failed to delete coupon" });
  }
};

exports.getReferralSettings = async (req, res) => {
  try {
    const config = await ReferralConfig.getConfig();

    const [totalReferrals, pointsResult, topReferrers] = await Promise.all([
      User.countDocuments({ referredBy: { $ne: null } }),
      User.aggregate([{ $group: { _id: null, total: { $sum: "$referralPoints" } } }]),
      User.aggregate([
        {
          $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "referredBy",
            as: "referrals"
          }
        },
        { $addFields: { referralCount: { $size: "$referrals" } } },
        { $match: { referralCount: { $gt: 0 } } },
        { $sort: { referralCount: -1 } },
        { $limit: 5 },
        { $project: { fullName: 1, email: 1, referralCode: 1, referralPoints: 1, referralCount: 1 } }
      ])
    ]);

    res.json({
      success: true,
      config,
      stats: {
        totalReferrals,
        totalPointsDistributed: pointsResult[0]?.total || 0,
        topReferrers
      }
    });
  } catch (error) {
    console.error("API getReferralSettings error:", error);
    res.status(500).json({ success: false, message: "Failed to load referral settings" });
  }
};
