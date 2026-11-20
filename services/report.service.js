/**
 * @file services/report.service.js
 * @description Business logic for admin analytics dashboard metrics, PDF sales reports, Excel spreadsheets, and user data exports.
 */

const path = require('path');
const ejs = require('ejs');
const exceljs = require('exceljs');
const PDFDocument = require('pdfkit-table');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { launchBrowser, generatePdfFromHtml } = require('../utils/pdfBrowser');
const AppError = require('../utils/AppError');

class ReportService {
  /**
   * Builds the MongoDB date filter match query from request params.
   * @param {Object} query
   * @returns {Object}
   */
  buildDateFilter(query = {}) {
    const { filter = 'daily', startDate, endDate } = query;
    const now = new Date();
    let matchCondition = {};

    if (filter === 'daily') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      matchCondition = { createdAt: { $gte: startOfDay } };
    } else if (filter === 'weekly') {
      const lastWeek = new Date();
      lastWeek.setDate(now.getDate() - 7);
      matchCondition = { createdAt: { $gte: lastWeek } };
    } else if (filter === 'yearly') {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      matchCondition = { createdAt: { $gte: oneYearAgo } };
    } else if (filter === 'custom' && startDate && endDate) {
      matchCondition = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
        },
      };
    }

    return { matchCondition, filter };
  }

  /**
   * Enriches raw orders with financial metrics (Gross, Refund, Deductions, Net Profit).
   * @param {Array} orders
   * @returns {Object} { enrichedOrders, totalSalesCount, totalGrossRevenue, totalDiscounts, totalRefunds, totalNetProfit, statusCounts }
   */
  enrichOrdersFinancials(orders) {
    const totalSalesCount = orders.length;
    let totalGrossRevenue = 0;
    let totalDiscounts = 0;
    let totalRefunds = 0;
    let totalNetProfit = 0;

    const statusCounts = {
      Delivered: 0,
      Cancelled: 0,
      Returned: 0,
      Processing: 0,
      Shipped: 0,
      Pending: 0,
    };

    const enrichedOrders = orders.map((orderDoc) => {
      const order = typeof orderDoc.toObject === 'function' ? orderDoc.toObject() : { ...orderDoc };

      const s = (order.status || 'Pending').toLowerCase();
      if (s === 'delivered') statusCounts.Delivered++;
      else if (s === 'cancelled') statusCounts.Cancelled++;
      else if (['returned', 'return approved', 'return requested', 'picked up'].includes(s))
        statusCounts.Returned++;
      else if (s === 'processing') statusCounts.Processing++;
      else if (['shipped', 'out for delivery'].includes(s)) statusCounts.Shipped++;
      else statusCounts.Pending++;

      const isPrepaid =
        ['Razorpay', 'Wallet'].includes(order.paymentMethod) && order.paymentStatus !== 'Failed';

      let orderGross = 0;
      let orderRefund = 0;
      const orderDiscount = order.discountAmount || order.discount || 0;
      const shippingFee = order.shippingCharge || order.shippingFee || 0;

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const itemTotal = (item.priceAtPurchase || item.price || 0) * item.quantity;
          orderGross += itemTotal;

          const isItemRefunded = ['Cancelled', 'Returned'].includes(item.itemStatus);
          const isEntireOrderCancelled = order.status === 'CANCELLED';

          if (isEntireOrderCancelled) {
            if (isPrepaid) orderRefund += itemTotal;
          } else if (isItemRefunded) {
            if (isPrepaid || item.itemStatus === 'Returned') {
              orderRefund += itemTotal;
            }
          }
        });
      }

      if (order.status === 'CANCELLED' && isPrepaid) {
        orderRefund += shippingFee - orderDiscount;
        if (orderRefund < 0) orderRefund = 0;
      }

      let orderNet = orderGross + shippingFee - orderDiscount - orderRefund;
      if (orderNet < 0) orderNet = 0;

      totalGrossRevenue += orderGross + shippingFee;
      totalDiscounts += orderDiscount;
      totalRefunds += orderRefund;
      totalNetProfit += orderNet;

      order.calculatedGross = orderGross + shippingFee;
      order.calculatedRefund = orderRefund;
      order.calculatedNet = orderNet;

      return order;
    });

    return {
      enrichedOrders,
      totalSalesCount,
      totalGrossRevenue,
      totalDiscounts,
      totalRefunds,
      totalNetProfit,
      statusCounts,
    };
  }

  /**
   * Gathers full dashboard metrics, charts, tables, and KPIs.
   * @param {Object} query
   * @returns {Promise<Object>}
   */
  async getDashboardData(query = {}) {
    const { matchCondition, filter } = this.buildDateFilter(query);
    const now = new Date();

    const dateFilterStage = Object.keys(matchCondition).length > 0 ? { $match: matchCondition } : null;

    // Revenue KPI
    const revenuePipeline = [{ $match: { status: 'DELIVERED' } }];
    if (dateFilterStage) revenuePipeline.push(dateFilterStage);
    revenuePipeline.push({ $group: { _id: null, total: { $sum: '$totalAmount' } } });
    const [revenueResult] = await Order.aggregate(revenuePipeline);
    const totalRevenue = revenueResult ? revenueResult.total : 0;

    // Order Count KPI
    const orderCountPipeline = [];
    if (dateFilterStage) orderCountPipeline.push(dateFilterStage);
    orderCountPipeline.push({ $count: 'total' });
    const [orderCountResult] = await Order.aggregate(orderCountPipeline);
    const totalOrders = orderCountResult ? orderCountResult.total : 0;

    // Customer count
    const userQuery = matchCondition.createdAt ? { createdAt: matchCondition.createdAt } : {};
    const totalCustomers = await User.countDocuments(userQuery);

    // Product count
    const productQuery = { isBlocked: false };
    if (matchCondition.createdAt) productQuery.createdAt = matchCondition.createdAt;
    const totalProducts = await Product.countDocuments(productQuery);

    // Chart Data Generation
    const chartData = [];
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    if (filter === 'daily') {
      const hourlySalesRaw = await Order.aggregate([
        {
          $match: {
            status: 'DELIVERED',
            createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { hour: { $hour: '$createdAt' } },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.hour': 1 } },
      ]);

      for (let i = 23; i >= 0; i--) {
        const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
        const hour = hourDate.getHours();
        const found = hourlySalesRaw.find((h) => h._id.hour === hour);
        chartData.push({
          label: `${hour}:00`,
          revenue: found ? found.revenue : 0,
          count: found ? found.count : 0,
        });
      }
    } else if (filter === 'weekly') {
      const dailySalesRaw = await Order.aggregate([
        {
          $match: {
            status: 'DELIVERED',
            createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            revenue: { $sum: '$totalAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]);

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const day = d.getDate();
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const found = dailySalesRaw.find(
          (ds) => ds._id.year === year && ds._id.month === month && ds._id.day === day
        );
        chartData.push({
          label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
          revenue: found ? found.revenue : 0,
          count: found ? found.count : 0,
        });
      }
    } else {
      const aggregationPipeline = [{ $match: { status: 'DELIVERED' } }];
      if (dateFilterStage) aggregationPipeline.push(dateFilterStage);

      aggregationPipeline.push({
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      });
      aggregationPipeline.push({ $sort: { '_id.year': 1, '_id.month': 1 } });

      const monthlySalesRaw = await Order.aggregate(aggregationPipeline);

      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const found = monthlySalesRaw.find((m) => m._id.year === year && m._id.month === month);
        chartData.push({
          label: `${monthNames[month - 1]} ${year}`,
          revenue: found ? found.revenue : 0,
          count: found ? found.count : 0,
        });
      }
    }

    // Status breakdown
    const statusBreakdownRaw = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const statusBreakdown = {};
    statusBreakdownRaw.forEach((s) => {
      statusBreakdown[s._id] = s.count;
    });

    // Top 5 Selling Products
    const topProducts = await Order.aggregate([
      { $match: { status: { $nin: ['CANCELLED'] } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          name: { $first: '$items.productName' },
          image: { $first: '$items.productImage' },
          totalSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
    ]);

    // Recent 5 Orders
    const recentOrders = await Order.find({})
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(5);

    // Low stock products
    const lowStockProducts = await Product.aggregate([
      { $match: { isBlocked: false } },
      { $unwind: '$variants' },
      { $match: { 'variants.quantity': { $lte: 5 } } },
      {
        $project: {
          productName: 1,
          variantSize: '$variants.size',
          variantQty: '$variants.quantity',
          productImage: { $arrayElemAt: ['$productImage', 0] },
        },
      },
      { $sort: { variantQty: 1 } },
      { $limit: 6 },
    ]);

    // Category-wise sales
    const categorySalesRaw = await Order.aggregate([
      { $match: { status: 'DELIVERED' } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.category',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$category.name',
          totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } },
          totalSold: { $sum: '$items.quantity' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 8 },
    ]);
    const categorySales = categorySalesRaw.filter((c) => c._id != null);

    return {
      stats: { totalRevenue, totalOrders, totalCustomers, totalProducts },
      monthlySales: chartData,
      statusBreakdown,
      topProducts,
      recentOrders,
      lowStockProducts,
      categorySales,
      activeFilter: filter,
      query,
    };
  }

  /**
   * Generates and streams sales report PDF.
   * @param {Object} res - Express response
   * @param {Object} query
   */
  async generateSalesReportPDF(res, query = {}) {
    const { matchCondition, filter } = this.buildDateFilter(query);
    const orders = await Order.find(matchCondition)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    const financials = this.enrichOrdersFinancials(orders);

    const templatePath = path.join(__dirname, '../views/Admin/sales-report.ejs');
    const compiledHtml = await ejs.renderFile(templatePath, {
      ...financials,
      orders: financials.enrichedOrders,
      filter: filter || 'ALL TIME',
      generatedDate: new Date().toLocaleString('en-IN'),
    });

    const browser = await launchBrowser();
    const nodeBuffer = await generatePdfFromHtml(browser, compiledHtml, {
      landscape: true,
      margin: { top: '30px', right: '30px', bottom: '30px', left: '30px' },
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.pdf`);
    res.setHeader('Content-Length', nodeBuffer.length);
    res.end(nodeBuffer);
  }

  /**
   * Generates and streams sales report Excel (.xlsx).
   * @param {Object} res - Express response
   * @param {Object} query
   */
  async generateSalesExcel(res, query = {}) {
    const { matchCondition } = this.buildDateFilter(query);
    const orders = await Order.find(matchCondition)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 25 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Customer Name', key: 'customer', width: 25 },
      { header: 'Gross Value', key: 'gross', width: 15 },
      { header: 'Discount+Refund', key: 'deductions', width: 18 },
      { header: 'Net Profit', key: 'net', width: 15 },
      { header: 'Payment', key: 'payment', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    orders.forEach((order) => {
      const isPrepaid =
        ['Razorpay', 'Wallet'].includes(order.paymentMethod) && order.paymentStatus !== 'Failed';

      let orderGross = 0;
      let orderRefund = 0;
      const orderDiscount = order.discountAmount || order.discount || 0;
      const shippingFee = order.shippingCharge || order.shippingFee || 0;

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const itemTotal = (item.priceAtPurchase || item.price || 0) * item.quantity;
          orderGross += itemTotal;

          const isItemRefunded = ['Cancelled', 'Returned'].includes(item.itemStatus);
          const isEntireOrderCancelled = order.status === 'CANCELLED';

          if (isEntireOrderCancelled) {
            if (isPrepaid) orderRefund += itemTotal;
          } else if (isItemRefunded) {
            if (isPrepaid || item.itemStatus === 'Returned') {
              orderRefund += itemTotal;
            }
          }
        });
      }

      if (order.status === 'CANCELLED' && isPrepaid) {
        orderRefund += shippingFee - orderDiscount;
        if (orderRefund < 0) orderRefund = 0;
      }

      let orderNet = orderGross + shippingFee - orderDiscount - orderRefund;
      if (orderNet < 0) orderNet = 0;

      worksheet.addRow({
        id: order._id.toString(),
        date: new Date(order.createdAt).toLocaleDateString('en-IN'),
        customer: order.userId
          ? order.userId.fullName
          : order.shippingAddress
          ? order.shippingAddress.fullName
          : 'Guest',
        gross: (orderGross + shippingFee).toFixed(2),
        deductions: (orderDiscount + orderRefund).toFixed(2),
        net: orderNet.toFixed(2),
        payment: order.paymentMethod,
        status: order.status,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Generates and streams customers PDF report using pdfkit-table.
   * @param {Object} res - Express response
   */
  async generateUsersPDF(res) {
    const users = await User.find({}).sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=customers-report.pdf');

    doc.pipe(res);

    doc.fontSize(20).text('HOOF - Customer Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);

    const table = {
      title: 'User List',
      headers: [
        { label: 'Name', property: 'name', width: 100 },
        { label: 'Email', property: 'email', width: 150 },
        { label: 'Phone', property: 'phone', width: 100 },
        { label: 'Joined Date', property: 'date', width: 100 },
        { label: 'Status', property: 'status', width: 80 },
      ],
      rows: users.map((user) => [
        user.fullName || 'N/A',
        user.email || 'N/A',
        user.phone || 'N/A',
        new Date(user.createdAt).toLocaleDateString(),
        user.isBlocked ? 'Blocked' : 'Active',
      ]),
    };

    await doc.table(table, {
      prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
      prepareRow: (row, indexColumn, indexRow, rect) => {
        doc.font('Helvetica').fontSize(10);
        if (indexRow % 2 === 0) {
          doc.addBackground(rect, '#f0f0f0', 0.15);
        }
      },
    });

    doc.end();
  }

  /**
   * Generates and streams orders PDF report.
   * @param {Object} res - Express response
   * @param {Object} query
   */
  async generateOrdersPDF(res, query = {}) {
    const { status, payment, search } = query;
    const dbQuery = {};

    if (status) dbQuery.status = status;
    if (payment) dbQuery.paymentMethod = payment;
    if (search) {
      const cleanSearch = search.replace('#', '').trim();
      const searchRegex = new RegExp(cleanSearch, 'i');
      dbQuery.$or = [
        { 'shippingAddress.fullName': searchRegex },
        { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchRegex } } },
      ];
    }

    const orders = await Order.find(dbQuery)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    const financials = this.enrichOrdersFinancials(orders);

    const filters = [];
    if (status) filters.push(`Status: ${status}`);
    if (payment) filters.push(`Payment: ${payment}`);
    if (search) filters.push(`Search: "${search}"`);

    const templatePath = path.join(__dirname, '../views/Admin/sales-report.ejs');
    const compiledHtml = await ejs.renderFile(templatePath, {
      reportTitle: 'Order Management Export',
      ...financials,
      orders: financials.enrichedOrders,
      filter: filters.length > 0 ? filters.join(' | ') : 'ALL TIME',
      generatedDate: new Date().toLocaleString('en-IN'),
    });

    const browser = await launchBrowser();
    const nodeBuffer = await generatePdfFromHtml(browser, compiledHtml, {
      landscape: true,
      margin: { top: '30px', right: '30px', bottom: '30px', left: '30px' },
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=orders-report-${Date.now()}.pdf`);
    res.setHeader('Content-Length', nodeBuffer.length);
    res.end(nodeBuffer);
  }

  /**
   * Generates and streams orders Excel spreadsheet (.xlsx).
   * @param {Object} res - Express response
   * @param {Object} query
   */
  async generateOrdersExcel(res, query = {}) {
    const { status, payment, search } = query;
    const dbQuery = {};

    if (status) dbQuery.status = status;
    if (payment) dbQuery.paymentMethod = payment;
    if (search) {
      const cleanSearch = search.replace('#', '').trim();
      const searchRegex = new RegExp(cleanSearch, 'i');
      dbQuery.$or = [
        { 'shippingAddress.fullName': searchRegex },
        { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchRegex } } },
      ];
    }

    const orders = await Order.find(dbQuery)
      .populate('userId', 'fullName email')
      .sort({ createdAt: -1 });

    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Orders Management');

    worksheet.columns = [
      { header: 'Order ID', key: 'id', width: 25 },
      { header: 'Order Date', key: 'date', width: 15 },
      { header: 'Customer', key: 'customer', width: 25 },
      { header: 'Gross Value', key: 'gross', width: 15 },
      { header: 'Deductions', key: 'deductions', width: 15 },
      { header: 'Net Amount', key: 'net', width: 15 },
      { header: 'Payment Method', key: 'payment', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    orders.forEach((order) => {
      const isPrepaid =
        ['Razorpay', 'Wallet'].includes(order.paymentMethod) && order.paymentStatus !== 'Failed';

      let orderGross = 0;
      let orderRefund = 0;
      const orderDiscount = order.discountAmount || order.discount || 0;
      const shippingFee = order.shippingCharge || order.shippingFee || 0;

      if (order.items && order.items.length > 0) {
        order.items.forEach((item) => {
          const itemTotal = (item.priceAtPurchase || item.price || 0) * item.quantity;
          orderGross += itemTotal;

          const isItemRefunded = ['Cancelled', 'Returned'].includes(item.itemStatus);
          const isEntireOrderCancelled = order.status === 'CANCELLED';

          if (isEntireOrderCancelled) {
            if (isPrepaid) orderRefund += itemTotal;
          } else if (isItemRefunded) {
            if (isPrepaid || item.itemStatus === 'Returned') {
              orderRefund += itemTotal;
            }
          }
        });
      }

      if (order.status === 'CANCELLED' && isPrepaid) {
        orderRefund += shippingFee - orderDiscount;
        if (orderRefund < 0) orderRefund = 0;
      }

      let orderNet = orderGross + shippingFee - orderDiscount - orderRefund;
      if (orderNet < 0) orderNet = 0;

      worksheet.addRow({
        id: order._id.toString(),
        date: new Date(order.createdAt).toLocaleDateString('en-IN'),
        customer: order.userId
          ? order.userId.fullName
          : order.shippingAddress
          ? order.shippingAddress.fullName
          : 'Guest',
        gross: (orderGross + shippingFee).toFixed(2),
        deductions: (orderDiscount + orderRefund).toFixed(2),
        net: orderNet.toFixed(2),
        payment: order.paymentMethod,
        status: order.status,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename=orders-export-${Date.now()}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
  }
}

module.exports = new ReportService();
