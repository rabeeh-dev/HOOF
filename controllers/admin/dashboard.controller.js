/**
 * @file controllers/admin/dashboard.controller.js
 * @description Controller handling administrator dashboard analytics, charts, and report exports.
 */

const reportService = require('../../services/report.service');

/**
 * @desc    Load administrative dashboard analytics and KPI metrics.
 * @route   GET /admin/dashboard
 * @access  Private (isAdminLogin)
 */
exports.loadDashboard = async (req, res) => {
  try {
    const data = await reportService.getDashboardData(req.query);

    if (req.query.ajax === 'true' || req.query.ajax === true) {
      return res.json({
        stats: data.stats,
        monthlySales: data.monthlySales,
        statusBreakdown: data.statusBreakdown,
        categorySales: data.categorySales,
      });
    }

    res.render('Admin/admin-dashboard', {
      title: 'Admin Dashboard | HOOF',
      layout: false,
      stats: data.stats,
      monthlySales: data.monthlySales,
      statusBreakdown: data.statusBreakdown,
      topProducts: data.topProducts,
      recentOrders: data.recentOrders,
      lowStockProducts: data.lowStockProducts,
      categorySales: data.categorySales,
      activeFilter: data.activeFilter,
      query: req.query,
    });
  } catch (error) {
    console.error('Load Dashboard Error:', error.message);
    res.redirect('/admin/login');
  }
};

/**
 * @desc    Export filtered sales report as PDF.
 * @route   GET /admin/dashboard/export
 * @access  Private (isAdminLogin)
 */
exports.exportSalesReport = async (req, res) => {
  try {
    await reportService.generateSalesReportPDF(res, req.query);
  } catch (error) {
    console.error('Export Sales PDF Error:', error.message);
    res.status(500).send('Error generating PDF report');
  }
};

/**
 * @desc    Export filtered sales report as Excel spreadsheet.
 * @route   GET /admin/dashboard/export-excel
 * @access  Private (isAdminLogin)
 */
exports.exportSalesExcel = async (req, res) => {
  try {
    await reportService.generateSalesExcel(res, req.query);
  } catch (error) {
    console.error('Export Sales Excel Error:', error.message);
    res.status(500).send('Error generating Excel report');
  }
};

/**
 * @desc    Export complete user list as PDF report.
 * @route   GET /admin/users/export-pdf
 * @access  Private (isAdminLogin)
 */
exports.exportUsersPDF = async (req, res) => {
  try {
    await reportService.generateUsersPDF(res);
  } catch (error) {
    console.error('Export Users PDF Error:', error.message);
    res.status(500).send('Error generating customer PDF report');
  }
};
