const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const adminProductController = require('../controller/adminProductController');
const adminAuth = require('../middleware/adminAuth');
const upload = require('../middleware/productMulter');

/* =============================================================================
   ADMIN AUTHENTICATION ROUTES
   Access: Public / Guest (isLogout)
============================================================================= */

/**
 * @route   GET /admin/login
 * @desc    Render the admin login page
 * @access  Public (Guest Only)
 */
router.get('/login', adminAuth.isLogout, adminController.loadLogin);

/**
 * @route   POST /admin/login
 * @desc    Authenticate admin credentials and create session
 * @access  Public
 */
router.post('/login', adminController.verifyAdmin);

/* =============================================================================
   ADMIN DASHBOARD & MANAGEMENT
   Access: Private (isLogin)
============================================================================= */

/**
 * @route   GET /admin/dashboard
 * @desc    Load the admin analytics dashboard
 * @access  Private (Admin Only)
 */
router.get('/dashboard', adminAuth.isLogin, adminController.loadDashboard);

/**
 * @route   GET /admin/customers
 * @desc    Load user management list with pagination
 * @access  Private (Admin Only)
 */
router.get('/customers', adminAuth.isLogin, adminController.loadCustomers);

/**
 * @route   GET /admin/users/export-pdf
 * @desc    Generate and download PDF report of all users
 * @access  Private (Admin Only)
 */
router.get('/users/export-pdf', adminAuth.isLogin, adminController.exportUsersPDF);

/**
 * @route   PATCH /admin/users/:action/:id
 * @desc    Block or Unblock a user based on action parameter
 * @access  Private (Admin Only)
 */
router.patch('/users/:id/:action', adminAuth.isLogin, adminController.toggleUserStatus);

/* =============================================================================
   CATEGORY MANAGEMENT SECTION
   Access: Private (isLogin)
============================================================================= */

/**
 * @route   GET /admin/categories
 * @desc    Load category management list
 * @access  Private (Admin Only)
 */
router.get('/categories', adminAuth.isLogin, adminController.loadCategories);

/**
 * @route   POST /admin/categories/add
 * @desc    Add a new category
 * @access  Private (Admin Only)
 */
router.post('/categories/add', adminAuth.isLogin, adminController.addCategory);

/**
 * @route   PATCH /admin/categories/edit/:id
 * @desc    Update category details
 * @access  Private (Admin Only)
 */
router.patch('/categories/edit/:id', adminAuth.isLogin, adminController.updateCategory);

/**
 * @route   PATCH /admin/categories/toggle-status/:id
 * @desc    Toggle category listing status
 * @access  Private (Admin Only)
 */
router.patch('/categories/toggle-status/:id', adminAuth.isLogin, adminController.toggleCategoryStatus);




/* =============================================================================
   PRODUCT MANAGEMENT SECTION
   Access: Private (isLogin)
 ============================================================================= */

/**
 * @route   GET /admin/products
 * @desc    Load product management list
 * @access  Private (Admin Only)
 */
router.get('/products', adminAuth.isLogin, adminProductController.listProductsAdmin);

/**
 * @route   GET /admin/products/add
 * @desc    Render the add product form
 * @access  Private (Admin Only)
 */
router.get('/products/add', adminAuth.isLogin, adminProductController.loadAddProduct);

/**
 * @route   POST /admin/products/add
 * @desc    Add a new product with multiple images
 * @access  Private (Admin Only)
 */
router.post('/products/add', adminAuth.isLogin, upload.array('productImages', 4), adminProductController.addProduct);

/**
 * @route   PATCH /admin/products/toggle-status/:id
 * @desc    Toggle product blocked status
 * @access  Private (Admin Only)
 */
router.patch('/products/toggle-status/:id', adminAuth.isLogin, adminProductController.toggleProductStatus);


// GET the edit page
router.get('/products/edit/:id', adminAuth.isLogin, adminProductController.loadEditProduct);

// POST/PATCH the updates (don't forget the upload middleware for images)
router.post('/products/edit/:id', adminAuth.isLogin, upload.array('productImages', 4), adminProductController.updateProduct);

/* =============================================================================
   LOGOUT
   Access: Private (isLogin)
============================================================================= */

/**
 * @route   GET /admin/logout
 * @desc    Destroy admin session and redirect to login
 * @access  Private (Admin Only)
 */
router.get('/logout', adminAuth.isLogin, adminController.logout);

module.exports = router;  