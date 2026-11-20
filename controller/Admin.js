/**
 * @file controller/Admin.js
 * @description Backward-compatible wrapper delegating admin portal requests to modular controllers.
 */

const authController = require('../controllers/admin/auth.controller');
const dashboardController = require('../controllers/admin/dashboard.controller');
const productController = require('../controllers/admin/product.controller');
const orderController = require('../controllers/admin/order.controller');
const couponController = require('../controllers/admin/coupon.controller');
const customerController = require('../controllers/admin/customer.controller');

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================
exports.loadLogin = authController.loadLogin;
exports.verifyAdmin = authController.verifyAdmin;
exports.logout = authController.logout;

// ==========================================
// ADMIN DASHBOARD & METRICS
// ==========================================
exports.loadDashboard = dashboardController.loadDashboard;
exports.exportSalesReport = dashboardController.exportSalesReport;
exports.exportSalesExcel = dashboardController.exportSalesExcel;
exports.exportUsersPDF = dashboardController.exportUsersPDF;

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================
exports.loadCategories = productController.loadCategories;
exports.addCategory = productController.addCategory;
exports.updateCategory = productController.updateCategory;
exports.toggleCategoryStatus = productController.toggleCategoryStatus;
exports.applyCategoryOffer = productController.applyCategoryOffer;
exports.removeCategoryOffer = productController.removeCategoryOffer;

// ==========================================
// ORDER MANAGEMENT
// ==========================================
exports.loadOrders = orderController.loadOrders;
exports.loadOrderDetailPage = orderController.loadOrderDetailPage;
exports.getOrderDetail = orderController.getOrderDetail;
exports.updateOrderStatus = orderController.updateOrderStatus;
exports.updateItemStatus = orderController.updateItemStatus;
exports.cancelOrderAdmin = orderController.cancelOrderAdmin;
exports.exportOrders = orderController.exportOrders;
exports.exportOrdersExcel = orderController.exportOrdersExcel;

// ==========================================
// CUSTOMER & REFERRAL MANAGEMENT
// ==========================================
exports.loadCustomers = customerController.loadCustomers;
exports.toggleUserStatus = customerController.toggleUserStatus;
exports.loadReferralSettings = customerController.loadReferralSettings;
exports.updateReferralSettings = customerController.updateReferralSettings;

// ==========================================
// COUPON MANAGEMENT
// ==========================================
exports.loadCoupons = couponController.loadCoupons;
exports.addCoupon = couponController.addCoupon;
exports.toggleCouponStatus = couponController.toggleCouponStatus;
exports.deleteCoupon = couponController.deleteCoupon;
