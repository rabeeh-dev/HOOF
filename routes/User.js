/**
 * @file routes/userRoutes.js
 * @description Route definitions for user-related features, including authentication, profile settings, and shop browsing.
 */

const express = require("express");
const router = express.Router();
const userController = require("../controller/User");
const { isUser, isLoggedOut } = require("../middlewares/auth.middleware");
const upload = require('../middleware/multer');
const passport = require("../config/passport");
const authRoutes = require("./user/auth.routes");
const shopRoutes = require("./user/shop.routes");
const cartRoutes = require("./user/cart.routes");
const checkoutRoutes = require("./user/checkout.routes");

// Mount user sub-routers
router.use("/", authRoutes);
router.use("/", shopRoutes);
router.use("/", cartRoutes);
router.use("/", checkoutRoutes);

// ==========================================
// USER PROFILE & ACCOUNT MANAGEMENT
// ==========================================

/**
 * @desc    User homepage (Landing after login).
 * @route   GET /user/home
 * @access  Private (isUser)
 */
router.get('/home', isUser, userController.getHome);

/**
 * @desc    Render user profile dashboard with addresses and details.
 * @route   GET /user/profile
 * @access  Private (isUser)
 */
router.get('/profile', isUser, userController.getProfile);

/**
 * @desc    Update text-based profile details (Full Name, Phone, etc.) via AJAX.
 * @route   POST /user/profile/update
 * @access  Private (isUser)
 */
router.post('/profile/update', isUser, userController.updateProfile);

/**
 * @desc    Upload, crop, and set a new profile image.
 * @route   POST /user/profile/update-image
 * @access  Private (isUser)
 */
router.post('/profile/update-image', isUser, upload.single('profileImage'), userController.updateProfileImage);

/**
 * @desc    Remove current profile image and revert to default.
 * @route   DELETE /user/profile/delete-image
 * @access  Private (isUser)
 */
router.delete('/profile/delete-image', isUser, userController.deleteProfileImage);

// ==========================================
// EMAIL & PASSWORD CHANGE FLOW (Inside Profile)
// ==========================================

/**
 * @desc    Initiate email change (sends OTP to old email).
 * @route   GET /user/profile/change-email-start
 * @access  Private (isUser)
 */
router.get('/profile/change-email-start', isUser, userController.getChangeEmailOtp);

/**
 * @desc    Render form to enter new email address (requires OTP verification).
 * @route   GET /user/profile/change-email-form
 * @access  Private (isUser, Session-protected)
 */
router.get('/profile/change-email-form', isUser, (req, res) => {
  if (!req.session.emailVerifiedForChange) return res.redirect('/user/profile');
  res.render('User/change-email', { layout: 'layouts/user' });
});

/**
 * @desc    Send OTP to the new email address for confirmation.
 * @route   POST /user/profile/change-email-new-otp
 * @access  Private (isUser)
 */
router.post('/profile/change-email-new-otp', isUser, userController.sendNewEmailOtp);

/**
 * @desc    Initiate password change flow via reset link from profile settings.
 * @route   GET /user/profile/change-password-request
 * @access  Private (isUser)
 */
router.get('/profile/change-password-request', isUser, userController.changePasswordRequest);

// ==========================================
// ADDRESS MANAGEMENT
// ==========================================




// ==========================================
// LOGOUT
// ==========================================

/**
 * @desc    End user session and clear authentication flags.
 * @route   POST /user/logout
 * @access  Private (isUser)
 */
router.post("/logout", userController.logout);

// ==========================================
// ==========================================
// CART ROUTES (Delegated to routes/user/cart.routes.js)
// ==========================================

// ==========================================
// WISHLIST ROUTES (Delegated to routes/user/wishlist.routes.js via cart.routes.js)
// ==========================================

// ==========================================
// CHECKOUT & PAYMENT ROUTES (Delegated to routes/user/checkout.routes.js)
// ==========================================

// Wallet
router.get('/wallet', isUser, userController.loadWalletPage);
router.get('/wallet/data', isUser, userController.getWalletData);

// Referral
router.get('/referral', isUser, userController.loadReferralPage);
router.post('/referral/withdraw', isUser, userController.withdrawReferralPoints);

router.get('/orders', isUser, userController.loadOrders);
router.get('/orders/:id', isUser, userController.loadOrderDetails);

// Whole order actions (legacy/fallback)
router.put('/orders/cancel/:id', isUser, userController.cancelOrder);
router.put('/orders/return/:id', isUser, userController.returnOrder);

// Per-item actions
router.put('/orders/:orderId/item/:itemId/cancel', isUser, userController.cancelOrderItem);
router.put('/orders/:orderId/item/:itemId/return', isUser, userController.returnOrderItem);

router.get('/orders/invoice/:id', isUser, userController.downloadInvoice);

module.exports = router;