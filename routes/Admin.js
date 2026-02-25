/**
 * @file routes/adminRoutes.js
 * @description Route definitions for administrative operations, including dashboard, user management, and category/product controls.
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controller/Admin');
const adminProductController = require('../controller/AdminProduct');
const adminCouponController = require('../controller/AdminCoupon');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/productMulter');

// ==========================================
// ADMIN AUTHENTICATION ROUTES
// ==========================================

/**
 * @desc    Render the admin login page.
 * @route   GET /admin/login
 * @access  Public (Guest Only)
 */
router.get('/login', adminAuth.isLogout, adminController.loadLogin);

/**
 * @desc    Authenticate admin credentials and create a session.
 * @route   POST /admin/login
 * @access  Public
 */
router.post('/login', adminController.verifyAdmin);

// ==========================================
// ADMIN DASHBOARD & MANAGEMENT
// ==========================================

/**
 * @desc    Load the admin analytics dashboard.
 * @route   GET /admin/dashboard
 * @access  Private (Admin Only)
 */
router.get('/dashboard', adminAuth.isLogin, adminController.loadDashboard);

/**
 * @desc    Load user management list with pagination.
 * @route   GET /admin/customers
 * @access  Private (Admin Only)
 */
router.get('/customers', adminAuth.isLogin, adminController.loadCustomers);

/**
 * @desc    Generate and download a PDF report of all users.
 * @route   GET /admin/users/export-pdf
 * @access  Private (Admin Only)
 */
router.get('/users/export-pdf', adminAuth.isLogin, adminController.exportUsersPDF);

/**
 * @desc    Block or Unblock a user based on action parameter.
 * @route   PATCH /admin/users/:id/:action
 * @access  Private (Admin Only)
 */
router.patch('/users/:id/:action', adminAuth.isLogin, adminController.toggleUserStatus);

// ==========================================
// CATEGORY MANAGEMENT SECTION
// ==========================================

/**
 * @desc    Load category management list.
 * @route   GET /admin/categories
 * @access  Private (Admin Only)
 */
router.get('/categories', adminAuth.isLogin, adminController.loadCategories);

/**
 * @desc    Add a new category.
 * @route   POST /admin/categories/add
 * @access  Private (Admin Only)
 */
router.post('/categories/add', adminAuth.isLogin, adminController.addCategory);

/**
 * @desc    Update category details.
 * @route   PATCH /admin/categories/edit/:id
 * @access  Private (Admin Only)
 */
router.patch('/categories/edit/:id', adminAuth.isLogin, adminController.updateCategory);

/**
 * @desc    Toggle category listing status.
 * @route   PATCH /admin/categories/toggle-status/:id
 * @access  Private (Admin Only)
 */
router.patch('/categories/toggle-status/:id', adminAuth.isLogin, adminController.toggleCategoryStatus);

// ==========================================
// PRODUCT MANAGEMENT SECTION
// ==========================================

/**
 * @desc    Load product management list.
 * @route   GET /admin/products
 * @access  Private (Admin Only)
 */
router.get('/products', adminAuth.isLogin, adminProductController.listProductsAdmin);

/**
 * @desc    Render the add product form.
 * @route   GET /admin/products/add
 * @access  Private (Admin Only)
 */
router.get('/products/add', adminAuth.isLogin, adminProductController.loadAddProduct);

/**
 * @desc    Add a new product with multiple images.
 * @route   POST /admin/products/add
 * @access  Private (Admin Only)
 */
router.post('/products/add', adminAuth.isLogin, upload.array('productImages', 4), adminProductController.addProduct);

/**
 * @desc    Toggle product blocked status.
 * @route   PATCH /admin/products/toggle-status/:id
 * @access  Private (Admin Only)
 */
router.patch('/products/toggle-status/:id', adminAuth.isLogin, adminProductController.toggleProductStatus);

/**
 * @desc    Render the edit product form.
 * @route   GET /admin/products/edit/:id
 * @access  Private (Admin Only)
 */
router.get('/products/edit/:id', adminAuth.isLogin, adminProductController.loadEditProduct);

/**
 * @desc    Update an existing product (handles image updates).
 * @route   POST /admin/products/edit/:id
 * @access  Private (Admin Only)
 */
router.post('/products/edit/:id', adminAuth.isLogin, upload.array('productImages', 4), adminProductController.updateProduct);

// ==========================================
// ORDER MANAGEMENT SECTION
// ==========================================

/**
 * @desc    Load order management list with filters and search.
 * @route   GET /admin/orders
 * @access  Private (Admin Only)
 */
router.get('/orders', adminAuth.isLogin, adminController.loadOrders);

/**
 * @desc    Get order details as JSON.
 * @route   GET /admin/orders/:id/detail
 * @access  Private (Admin Only)
 */
router.get('/orders/:id/detail', adminAuth.isLogin, adminController.getOrderDetail);

/**
 * @desc    Update order status.
 * @route   PATCH /admin/orders/:id/status
 * @access  Private (Admin Only)
 */
router.patch('/orders/:id/status', adminAuth.isLogin, adminController.updateOrderStatus);

/**
 * @desc    Cancel an order (Admin).
 * @route   PATCH /admin/orders/:id/cancel
 * @access  Private (Admin Only)
 */
router.patch('/orders/:id/cancel', adminAuth.isLogin, adminController.cancelOrderAdmin);

/**
 * @desc    Export orders.
 * @route   GET /admin/orders/export
 * @access  Private (Admin Only)
 */
router.get('/orders/export', adminAuth.isLogin, adminController.exportOrders);

// ==========================================
// COUPON MANAGEMENT SECTION
// ==========================================

/**
 * @desc    Load coupon management list.
 * @route   GET /admin/coupons
 * @access  Private (Admin Only)
 */
router.get('/coupons', adminAuth.isLogin, adminCouponController.loadCoupons);

/**
 * @desc    Add a new coupon.
 * @route   POST /admin/coupons/add
 * @access  Private (Admin Only)
 */
router.post('/coupons/add', adminAuth.isLogin, adminCouponController.addCoupon);

/**
 * @desc    Get single coupon details.
 * @route   GET /admin/coupons/:id
 * @access  Private (Admin Only)
 */
router.get('/coupons/:id', adminAuth.isLogin, adminCouponController.getCoupon);

/**
 * @desc    Update coupon details.
 * @route   PATCH /admin/coupons/edit/:id
 * @access  Private (Admin Only)
 */
router.patch('/coupons/edit/:id', adminAuth.isLogin, adminCouponController.updateCoupon);

/**
 * @desc    Toggle coupon status.
 * @route   PATCH /admin/coupons/toggle-status/:id
 * @access  Private (Admin Only)
 */
router.patch('/coupons/toggle-status/:id', adminAuth.isLogin, adminCouponController.toggleCouponStatus);

// ==========================================

/**
 * @desc    Destroy admin session and redirect to login.
 * @route   GET /admin/logout
 * @access  Private (Admin Only)
 */
router.get('/logout', adminAuth.isLogin, adminController.logout);

module.exports = router;
