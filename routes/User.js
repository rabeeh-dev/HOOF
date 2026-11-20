/**
 * @file routes/userRoutes.js
 * @description Route definitions for user-related features, including authentication, profile settings, and shop browsing.
 */

const express = require("express");
const router = express.Router();
const userController = require("../controller/User");
const checkoutController = require("../controller/UserCheckout");
const couponController = require("../controller/Coupon");
const { isUser, isLoggedOut } = require("../middlewares/auth.middleware");
const upload = require('../middleware/multer');
const passport = require("../config/passport");
const authRoutes = require("./user/auth.routes");
const shopRoutes = require("./user/shop.routes");
const cartRoutes = require("./user/cart.routes");

// Mount user authentication & discovery routes
router.use("/", authRoutes);
router.use("/", shopRoutes);
router.use("/", cartRoutes);

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
// Razorpay Payment Verification & Failure
router.post('/checkout/verify-payment', isUser, checkoutController.verifyPayment);
router.get('/payment-failure/:id', isUser, checkoutController.loadPaymentFailure);
router.post('/checkout/retry-payment', isUser, checkoutController.retryPayment);

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
// WISHLIST ROUTES
// ==========================================
const Wishlist = require("../model/Wishlist");
const Cart = require("../model/Cart");
const Product = require("../model/Product");
// ==========================================

/**
 * @desc    Render the wishlist page.
 * @route   GET /user/wishlist
 * @access  Private (isUser)
 */
router.get('/wishlist', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId })
      .populate({
        path: 'products',
        populate: { path: 'category', select: 'name' }
      });

    let wishlistItems = [];
    if (wishlist && wishlist.products.length > 0) {
      // Map to match expected template shape
      wishlistItems = wishlist.products
        .filter(p => p) // filter deleted products
        .map(product => ({ productId: product }));
    }

    res.render('User/wishlist', {
      title: 'Wishlist - HOOF',
      layout: 'layouts/user',
      wishlistItems,
    });
  } catch (err) {
    console.error('Wishlist page error:', err);
    res.render('User/wishlist', {
      title: 'Wishlist - HOOF',
      layout: 'layouts/user',
      wishlistItems: [],
    });
  }
});

/**
 * @desc    Add a product to wishlist.
 * @route   POST /user/wishlist/add
 * @access  Private (isUser)
 */
router.post('/wishlist/add', isUser, async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.session.userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.session.userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.json({ success: true, message: 'Added to wishlist!' });
  } catch (err) {
    console.error('Add to wishlist error:', err);
    res.status(500).json({ success: false, message: 'Could not add to wishlist' });
  }
});

/**
 * @desc    Remove a product from wishlist.
 * @route   DELETE /user/wishlist/remove/:id
 * @access  Private (isUser)
 */
router.delete('/wishlist/remove/:id', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      p => p.toString() !== req.params.id
    );
    await wishlist.save();

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Remove from wishlist error:', err);
    res.status(500).json({ success: false, message: 'Could not remove item' });
  }
});

/**
 * @desc    Move all wishlist items to cart.
 * @route   POST /user/wishlist/move-all
 * @access  Private (isUser)
 */
router.post('/wishlist/move-all', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId });
    if (!wishlist || wishlist.products.length === 0) {
      return res.json({ success: false, message: 'Wishlist is empty' });
    }

    let cart = await Cart.findOne({ userId: req.session.userId });
    if (!cart) {
      cart = new Cart({ userId: req.session.userId, items: [] });
    }

    wishlist.products.forEach(productId => {
      const existing = cart.items.find(
        item => item.productId.toString() === productId.toString()
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.items.push({ productId, quantity: 1 });
      }
    });

    await cart.save();

    // Clear wishlist
    wishlist.products = [];
    await wishlist.save();

    res.json({ success: true, message: 'All items moved to bag!' });
  } catch (err) {
    console.error('Move all to cart error:', err);
    res.status(500).json({ success: false, message: 'Could not move items' });
  }
});

/**
 * @desc    Clear entire wishlist.
 * @route   DELETE /user/wishlist/clear
 * @access  Private (isUser)
 */

router.delete('/wishlist/clear', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (err) {
    console.error('Clear wishlist error:', err);
    res.status(500).json({ success: false, message: 'Could not clear wishlist' });
  }
});


//Checkout page 
router.get('/checkout', isUser, checkoutController.loadCheckout);
router.post('/checkout', isUser, checkoutController.placeOrder);
router.post('/checkout/place-order', isUser, checkoutController.placeOrderApi);
router.get('/order-success/:id', isUser, checkoutController.loadOrderSuccess);

// Coupons
router.get('/available-coupons', isUser, couponController.getAvailableCoupons);
router.post('/apply-coupon', isUser, couponController.applyCoupon);

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