/**
 * @file routes/api/admin.js
 * @description API route definitions for administrative actions (Dashboard stats, Category management, Product management, Orders management, Customer management, Coupons, Referrals).
 */

const express = require('express');
const router = express.Router();
const adminController = require('../../controller/Admin');
const adminCouponController = require('../../controller/AdminCoupon');
const dashboardApiController = require('../../controller/api/Dashboard');
const adminManagementApiController = require('../../controller/api/AdminManagement');
const adminCouponReferralApiController = require('../../controller/api/AdminCouponReferral');

const requireAdminApi = (req, res, next) => {
  if (req.session.adminId) return next();
  return res.status(401).json({ success: false, message: "Unauthenticated" });
};

// Admin Auth APIs
router.post('/login', adminController.verifyAdmin);

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Logout failed" });
    }
    res.clearCookie("hoof.admin.sid", { path: '/' });
    res.json({ success: true, message: "Admin logged out successfully" });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.adminId) {
    return res.status(401).json({ success: false, message: "Unauthenticated" });
  }
  const Admin = require('../../model/Admin');
  const admin = await Admin.findById(req.session.adminId).select('email');
  if (!admin) {
    req.session.destroy();
    return res.status(401).json({ success: false, message: "Admin not found" });
  }
  res.json({
    success: true,
    user: {
      id: admin._id,
      email: admin.email,
      role: 'admin',
      name: 'Admin'
    }
  });
});

router.use(requireAdminApi);

// Admin Dashboard Analytics API Route
router.get('/dashboard', dashboardApiController.getDashboardData);

// Product Management API Routes
const adminProductApiController = require('../../controller/api/AdminProduct');
const upload = require('../../middleware/productMulter');

router.get('/products', adminProductApiController.listProducts);
router.get('/products/:id', adminProductApiController.getProduct);
router.post('/products', upload.array('productImages', 4), adminProductApiController.addProduct);
router.put('/products/:id', upload.array('productImages', 4), adminProductApiController.updateProduct);
router.patch('/products/:id/toggle-status', adminProductApiController.toggleProductStatus);
router.delete('/products/:id', adminProductApiController.deleteProduct);

// Category Management API Routes
router.get('/categories', adminProductApiController.listCategories);
router.get('/categories/all', adminProductApiController.getAllCategories);
router.post('/categories', adminProductApiController.addCategory);
router.put('/categories/:id', adminProductApiController.updateCategory);
router.patch('/categories/:id/toggle-status', adminProductApiController.toggleCategoryStatus);
router.delete('/categories/:id', adminProductApiController.deleteCategory);

// Coupon Management API Routes
router.get('/coupons', adminCouponReferralApiController.listCoupons);
router.get('/coupons/:id', adminCouponController.getCoupon);
router.post('/coupons', adminCouponController.addCoupon);
router.patch('/coupons/:id', adminCouponController.updateCoupon);
router.patch('/coupons/:id/toggle-status', adminCouponController.toggleCouponStatus);
router.delete('/coupons/:id', adminCouponReferralApiController.deleteCoupon);

// Referral Configuration API Routes
router.get('/referral-settings', adminCouponReferralApiController.getReferralSettings);
router.patch('/referral-settings', adminController.updateReferralSettings);

// Order Management API Routes
router.get('/orders', adminManagementApiController.listOrders);
router.get('/orders/:id', adminManagementApiController.getOrder);
router.patch('/orders/:id/status', adminController.updateOrderStatus);
router.patch('/orders/:id/payment-status', adminManagementApiController.updatePaymentStatus);
router.patch('/orders/:id/cancel', adminController.cancelOrderAdmin);
router.patch('/orders/:orderId/item/:itemId/status', adminController.updateItemStatus);

// Customer Management API Routes
router.get('/customers', adminManagementApiController.listCustomers);
router.get('/customers/:id', adminManagementApiController.getCustomer);
router.patch('/customers/:id/:action', adminController.toggleUserStatus);

// Report Management API Routes
const adminReportsApiController = require('../../controller/api/AdminReports');

router.get('/reports/sales', adminReportsApiController.getSalesReport);
router.get('/reports/products', adminReportsApiController.getProductReport);
router.get('/reports/customers', adminReportsApiController.getCustomerReport);

router.get('/reports/sales/export/excel', adminController.exportSalesExcel);
router.get('/reports/sales/export/pdf', adminController.exportSalesReport);

router.get('/reports/products/export/excel', adminReportsApiController.exportProductReportExcel);
router.get('/reports/products/export/pdf', adminReportsApiController.exportProductReportPdf);

router.get('/reports/customers/export/excel', adminReportsApiController.exportCustomerReportExcel);
router.get('/reports/customers/export/pdf', adminReportsApiController.exportCustomerReportPdf);

module.exports = router;
