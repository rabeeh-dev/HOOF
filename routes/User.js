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
const orderRoutes = require("./user/order.routes");
const walletRoutes = require("./user/wallet.routes");
const referralRoutes = require("./user/referral.routes");
const profileRoutes = require("./user/profile.routes");

// Mount user sub-routers
router.use("/", authRoutes);
router.use("/", shopRoutes);
router.use("/", cartRoutes);
router.use("/", checkoutRoutes);
router.use("/", orderRoutes);
router.use("/", walletRoutes);
router.use("/", referralRoutes);
router.use("/", profileRoutes);

// ==========================================
// USER PROFILE & ACCOUNT MANAGEMENT (Delegated to routes/user/profile.routes.js)
// ==========================================

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

// Wallet routes delegated to routes/user/wallet.routes.js

// Referral routes delegated to routes/user/referral.routes.js

// Order management routes delegated to routes/user/order.routes.js

module.exports = router;