const PDFDocument = require("pdfkit-table");
const exceljs = require("exceljs");
const User = require("../../model/User");
const Order = require("../../model/Order");
const Product = require("../../model/Product");
const Category = require("../../model/Category");

const currency = (value = 0) => Number(value || 0).toFixed(2);

const buildDateMatch = ({ filter, startDate, endDate }) => {
  const now = new Date();
  const createdAt = {};

  if (filter === "daily") {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    createdAt.$gte = startOfDay;
  } else if (filter === "weekly") {
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);
    createdAt.$gte = lastWeek;
  } else if (filter === "yearly") {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    createdAt.$gte = oneYearAgo;
  } else if (filter === "custom" && startDate && endDate) {
    createdAt.$gte = new Date(startDate);
    createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
  }

  return Object.keys(createdAt).length ? { createdAt } : {};
};

const calculateOrderFinancials = (orderDoc) => {
  const order = typeof orderDoc.toObject === "function" ? orderDoc.toObject() : orderDoc;
  const isPrepaid = ["Razorpay", "Wallet"].includes(order.paymentMethod) && order.paymentStatus !== "Failed";
  let gross = 0;
  let refund = 0;
  const discount = order.discountAmount || order.discount || 0;
  const shipping = order.shippingCharge || order.shippingFee || 0;

  (order.items || []).forEach((item) => {
    const itemTotal = (item.priceAtPurchase || item.price || 0) * (item.quantity || 0);
    gross += itemTotal;

    const isItemRefunded = ["Cancelled", "Returned"].includes(item.itemStatus);
    const isEntireOrderCancelled = order.status === "CANCELLED";

    if (isEntireOrderCancelled && isPrepaid) refund += itemTotal;
    else if (isItemRefunded && (isPrepaid || item.itemStatus === "Returned")) refund += itemTotal;
  });

  if (order.status === "CANCELLED" && isPrepaid) {
    refund += shipping - discount;
    if (refund < 0) refund = 0;
  }

  const grossWithShipping = gross + shipping;
  const net = Math.max(0, grossWithShipping - discount - refund);
  return { gross: grossWithShipping, discount, refund, net };
};

const getSalesRows = async (query) => {
  const match = buildDateMatch(query);
  const orders = await Order.find(match).populate("userId", "fullName email").sort({ createdAt: -1 }).lean();

  const rows = orders.map((order) => {
    const totals = calculateOrderFinancials(order);
    return {
      _id: order._id,
      date: order.createdAt,
      customer: order.userId?.fullName || order.shippingAddress?.fullName || "Guest",
      email: order.userId?.email || "",
      paymentMethod: order.paymentMethod,
      status: order.status,
      ...totals
    };
  });

  const summary = rows.reduce((acc, row) => {
    acc.totalSalesCount += 1;
    acc.totalGrossRevenue += row.gross;
    acc.totalDiscounts += row.discount;
    acc.totalRefunds += row.refund;
    acc.totalNetProfit += row.net;
    return acc;
  }, {
    totalSalesCount: 0,
    totalGrossRevenue: 0,
    totalDiscounts: 0,
    totalRefunds: 0,
    totalNetProfit: 0
  });

  return { rows, summary };
};

exports.getSalesReport = async (req, res) => {
  try {
    const { rows, summary } = await getSalesRows(req.query);
    res.json({ success: true, summary, rows });
  } catch (error) {
    console.error("API getSalesReport error:", error);
    res.status(500).json({ success: false, message: "Failed to load sales report" });
  }
};

exports.getProductReport = async (req, res) => {
  try {
    const dateMatch = buildDateMatch(req.query);
    const orderMatch = { status: { $nin: ["CANCELLED"] }, ...dateMatch };

    const [products, inventoryStats] = await Promise.all([
      Order.aggregate([
        { $match: orderMatch },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.productId",
            foreignField: "_id",
            as: "product"
          }
        },
        { $unwind: { path: "$product", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "categories",
            localField: "product.category",
            foreignField: "_id",
            as: "category"
          }
        },
        { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.productName" },
            category: { $first: "$category.name" },
            totalSold: { $sum: "$items.quantity" },
            totalRevenue: { $sum: { $multiply: ["$items.priceAtPurchase", "$items.quantity"] } }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]),
      Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: { $sum: { $cond: [{ $eq: ["$isBlocked", false] }, 1, 0] } },
            inventoryUnits: { $sum: "$quantity" }
          }
        }
      ])
    ]);

    const summary = products.reduce((acc, product) => {
      acc.unitsSold += product.totalSold || 0;
      acc.productRevenue += product.totalRevenue || 0;
      return acc;
    }, {
      unitsSold: 0,
      productRevenue: 0,
      totalProducts: inventoryStats[0]?.totalProducts || 0,
      activeProducts: inventoryStats[0]?.activeProducts || 0,
      inventoryUnits: inventoryStats[0]?.inventoryUnits || 0
    });

    res.json({ success: true, summary, products, topProducts: products.slice(0, 10) });
  } catch (error) {
    console.error("API getProductReport error:", error);
    res.status(500).json({ success: false, message: "Failed to load product report" });
  }
};

exports.getCustomerReport = async (req, res) => {
  try {
    const dateMatch = buildDateMatch(req.query);
    const users = await User.aggregate([
      ...(dateMatch.createdAt ? [{ $match: dateMatch }] : []),
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
      { $project: { password: 0, orders: 0, wallet: 0 } },
      { $sort: { totalSpend: -1, createdAt: -1 } }
    ]);

    const summary = users.reduce((acc, user) => {
      acc.totalCustomers += 1;
      acc.blockedCustomers += user.isBlocked ? 1 : 0;
      acc.totalOrders += user.totalOrders || 0;
      acc.totalSpend += user.totalSpend || 0;
      acc.walletBalance += user.walletBalance || 0;
      return acc;
    }, {
      totalCustomers: 0,
      blockedCustomers: 0,
      totalOrders: 0,
      totalSpend: 0,
      walletBalance: 0
    });

    res.json({ success: true, summary, customers: users });
  } catch (error) {
    console.error("API getCustomerReport error:", error);
    res.status(500).json({ success: false, message: "Failed to load customer report" });
  }
};

const sendExcel = async (res, filename, worksheetName, columns, rows) => {
  const workbook = new exceljs.Workbook();
  const worksheet = workbook.addWorksheet(worksheetName);
  worksheet.columns = columns;
  rows.forEach((row) => worksheet.addRow(row));
  worksheet.getRow(1).font = { bold: true };

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}-${Date.now()}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
};

const sendPdf = async (res, filename, title, headers, rows) => {
  const doc = new PDFDocument({ margin: 30, size: "A4", layout: "landscape" });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=${filename}-${Date.now()}.pdf`);
  doc.pipe(res);
  doc.fontSize(18).text(title, { align: "center" });
  doc.moveDown();
  doc.fontSize(9).text(`Generated on: ${new Date().toLocaleString("en-IN")}`, { align: "center" });
  doc.moveDown();
  await doc.table({ headers, rows }, {
    prepareHeader: () => doc.font("Helvetica-Bold").fontSize(9),
    prepareRow: () => doc.font("Helvetica").fontSize(8)
  });
  doc.end();
};

exports.exportProductReportExcel = async (req, res) => {
  try {
    const reportReq = { query: req.query };
    let payload;
    await exports.getProductReport(reportReq, {
      json: (data) => { payload = data; },
      status: () => ({ json: (data) => { throw new Error(data.message); } })
    });
    await sendExcel(res, "product-report", "Product Report", [
      { header: "Product", key: "name", width: 35 },
      { header: "Category", key: "category", width: 25 },
      { header: "Units Sold", key: "totalSold", width: 15 },
      { header: "Revenue", key: "totalRevenue", width: 15 }
    ], payload.products.map((item) => ({
      name: item.name || "Unknown Product",
      category: item.category || "Uncategorized",
      totalSold: item.totalSold || 0,
      totalRevenue: currency(item.totalRevenue)
    })));
  } catch (error) {
    console.error("Export Product Excel Error:", error);
    res.status(500).send("Error generating product Excel report");
  }
};

exports.exportProductReportPdf = async (req, res) => {
  try {
    const reportReq = { query: req.query };
    let payload;
    await exports.getProductReport(reportReq, {
      json: (data) => { payload = data; },
      status: () => ({ json: (data) => { throw new Error(data.message); } })
    });
    await sendPdf(res, "product-report", "HOOF - Product Report", [
      { label: "Product", property: "name", width: 220 },
      { label: "Category", property: "category", width: 140 },
      { label: "Units Sold", property: "sold", width: 80 },
      { label: "Revenue", property: "revenue", width: 100 }
    ], payload.products.map((item) => [
      item.name || "Unknown Product",
      item.category || "Uncategorized",
      String(item.totalSold || 0),
      currency(item.totalRevenue)
    ]));
  } catch (error) {
    console.error("Export Product PDF Error:", error);
    res.status(500).send("Error generating product PDF report");
  }
};

exports.exportCustomerReportExcel = async (req, res) => {
  try {
    const reportReq = { query: req.query };
    let payload;
    await exports.getCustomerReport(reportReq, {
      json: (data) => { payload = data; },
      status: () => ({ json: (data) => { throw new Error(data.message); } })
    });
    await sendExcel(res, "customer-report", "Customer Report", [
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 35 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Orders", key: "orders", width: 12 },
      { header: "Spend", key: "spend", width: 15 },
      { header: "Wallet", key: "wallet", width: 15 },
      { header: "Status", key: "status", width: 12 }
    ], payload.customers.map((user) => ({
      name: user.fullName || "N/A",
      email: user.email || "N/A",
      phone: user.phone || "N/A",
      orders: user.totalOrders || 0,
      spend: currency(user.totalSpend),
      wallet: currency(user.walletBalance),
      status: user.isBlocked ? "Blocked" : "Active"
    })));
  } catch (error) {
    console.error("Export Customer Excel Error:", error);
    res.status(500).send("Error generating customer Excel report");
  }
};

exports.exportCustomerReportPdf = async (req, res) => {
  try {
    const reportReq = { query: req.query };
    let payload;
    await exports.getCustomerReport(reportReq, {
      json: (data) => { payload = data; },
      status: () => ({ json: (data) => { throw new Error(data.message); } })
    });
    await sendPdf(res, "customer-report", "HOOF - Customer Report", [
      { label: "Name", property: "name", width: 120 },
      { label: "Email", property: "email", width: 180 },
      { label: "Orders", property: "orders", width: 60 },
      { label: "Spend", property: "spend", width: 90 },
      { label: "Wallet", property: "wallet", width: 90 },
      { label: "Status", property: "status", width: 80 }
    ], payload.customers.map((user) => [
      user.fullName || "N/A",
      user.email || "N/A",
      String(user.totalOrders || 0),
      currency(user.totalSpend),
      currency(user.walletBalance),
      user.isBlocked ? "Blocked" : "Active"
    ]));
  } catch (error) {
    console.error("Export Customer PDF Error:", error);
    res.status(500).send("Error generating customer PDF report");
  }
};
