/**
 * @file routes/admin/dashboard.routes.js
 * @description Route definitions for administrator dashboard analytics and PDF/Excel report exports.
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/admin/dashboard.controller');
const { isAdminLogin } = require('../../middlewares/adminAuth.middleware');

// Dashboard analytics view
router.get('/dashboard', isAdminLogin, dashboardController.loadDashboard);

// Sales report exports
router.get('/dashboard/export', isAdminLogin, dashboardController.exportSalesReport);
router.get('/dashboard/export-excel', isAdminLogin, dashboardController.exportSalesExcel);

// Customer report PDF export
router.get('/users/export-pdf', isAdminLogin, dashboardController.exportUsersPDF);

module.exports = router;
