/**
 * @file controller/userController.js
 * @description Controller for handled user-related operations, including authentication, profile management, password recovery, and shop interactions.
 */

const User = require("../model/User");
const bcrypt = require("bcrypt");
const Otp = require("../model/Otp");
const path = require('path');
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail, sendResetPasswordEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const Address = require("../model/Address");
const authService = require("../services/Auth");
const passwordService = require("../services/Password");
const userService = require("../services/User");
// checkoutService removed (moved to UserCheckout)
const Order = require('../model/Order');
const PDFDocument = require('pdfkit');
const walletService = require('../services/Wallet');
const ReferralConfig = require('../model/ReferralConfig');


// ==========================================
// AUTHENTICATION SECTION (Delegated to controllers/user/auth.controller)
// ==========================================
const authController = require("../controllers/user/auth.controller");

exports.signupPage = authController.signupPage;
exports.signup = authController.signup;
exports.verifyOtp = authController.verifyOtp;
exports.resendOtp = authController.resendOtp;
exports.loginPage = authController.loginPage;
exports.login = authController.login;
exports.logout = authController.logout;
exports.forgotPasswordPage = authController.forgotPasswordPage;
exports.forgotPassword = authController.forgotPassword;
exports.resetPasswordPage = authController.resetPasswordPage;
exports.resetPassword = authController.resetPassword;

// ==========================================
// LANDING & HOME PAGES (Delegated to controllers/user/shop.controller)
// ==========================================
const shopController = require("../controllers/user/shop.controller");
exports.landingPage = shopController.landingPage;
exports.getHome = shopController.homePage;

// ==========================================
// USER PROFILE SECTION (Details & Settings)
// ==========================================

/**
 * @desc    Fetch and display user profile, addresses, and status flags.
 * @route   GET /user/profile
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/user/login');

    const user = await User.findById(userId);
    const addresses = await Address.find({ userId: userId });

    const emailChanged = req.query.emailChanged === 'true';
    const passwordChanged = req.query.passwordChanged === 'true';
    const resetLinkSent = req.query.message === 'reset_link_sent';

    let successMessage = null;
    if (emailChanged) {
      successMessage = "Your email has been updated successfully!";
    } else if (passwordChanged) {
      successMessage = "Your password has been changed successfully!";
    } else if (resetLinkSent) {
      successMessage = "A password reset link has been sent to your email.";
    }

    res.render('User/user-profile', {
      user,
      addresses,
      title: 'My Profile | HOOF',
      layout: 'layouts/user',
      successMessage: successMessage
    });
  } catch (err) {
    console.error("Profile Error:", err);
    res.redirect('/user/home');
  }
};

/**
 * @desc    Update text-based profile details via AJAX.
 * @route   POST /user/profile/update
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, dateOfBirth } = req.body;

    const updatedUser = await userService.updateProfileData(req.session.userId, {
      fullName,
      phoneNumber,
      dateOfBirth
    });

    req.session.userName = updatedUser.fullName;

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Upload, crop, and save a new profile image.
 * @route   POST /user/profile/update-image
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const userId = req.session.userId;
    const publicRoot = path.join(__dirname, '../public');

    const newImagePath = await userService.updateUserProfileImage(
      userId,
      req.file.filename,
      publicRoot
    );

    if (req.session.user) {
      req.session.user.profileImage = newImagePath;
    }

    req.session.save((err) => {
      if (err) throw err;
      res.json({
        success: true,
        message: "Profile picture updated!",
        imagePath: newImagePath
      });
    });

  } catch (error) {
    console.error("Profile Image Upload Error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error during upload"
    });
  }
};

/**
 * @desc    Removes profile picture from server and database.
 * @route   DELETE /user/profile/delete-image
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.deleteProfileImage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const publicRoot = path.join(__dirname, '../public');

    await userService.removeUserProfileImage(userId, publicRoot);

    if (req.session.user) {
      req.session.user.profileImage = "";
    }

    return res.json({ success: true, message: "Profile image deleted" });

  } catch (error) {
    console.error("Delete Image Error:", error);
    const statusCode = error.message === "No image found to delete" ? 400 : 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || "Server error"
    });
  }
};

// ==========================================
// EMAIL & PASSWORD CHANGE FLOW
// ==========================================

/**
 * @desc    Sends verification OTP to current email to authorize change.
 * @route   GET /user/profile/change-email-start
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.getChangeEmailOtp = async (req, res) => {
  try {
    const currentEmail = await authService.initiateEmailChangeCurrent(req.session.userId);
    req.session.changeEmailFlow = true;
    req.session.currentEmailToVerify = currentEmail;
    req.session.otpEmail = currentEmail;

    res.render("User/auth/verify-otp", { layout: "layouts/user", email: currentEmail, message: null });
  } catch (err) {
    console.error("Change Email Start Error:", err.message);
    res.redirect('/user/profile');
  }
};

/**
 * @desc    Sends verification OTP to the NEW email address.
 * @route   POST /user/profile/change-email-new-otp
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.sendNewEmailOtp = async (req, res) => {
  try {
    if (!req.session.emailVerifiedForChange) return res.redirect('/user/profile');
    const { newEmail } = req.body;

    const normalizedNewEmail = await authService.initiateEmailChangeNew(req.session.userId, newEmail);

    req.session.tempNewEmail = normalizedNewEmail;
    req.session.newEmailOtpSent = true;
    req.session.otpEmail = normalizedNewEmail;

    res.render("User/auth/verify-otp", { layout: "layouts/user", email: normalizedNewEmail, message: null });
  } catch (err) {
    console.error("Send New Email OTP Error:", err.message);
    res.render('User/change-email', {
      layout: 'layouts/user',
      message: { type: 'error', text: err.message || 'Failed to send verification code.' }
    });
  }
};

/**
 * @desc    Initiates password change via reset link sent to registered email.
 * @route   GET /user/profile/change-password-request
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.changePasswordRequest = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || user.authProvider !== "local") {
      return res.redirect('/user/profile');
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendResetPasswordEmail(user.email, resetToken);

    res.redirect('/user/profile?message=reset_link_sent');

  } catch (err) {
    console.error("Change password request error:", err);
    res.redirect('/user/profile');
  }
};

/**
 * @desc    Renders global search results page.
 * @route   GET /user/search
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.getSearchPage = async (req, res) => {
  try {
    const query = req.query.q || "";
    const page = parseInt(req.query.page) || 1;

    const { products, totalPages, currentPage, totalResults } =
      await userService.searchProducts(query, page);

    res.render("User/search-results", {
      products,
      totalPages,
      currentPage,
      query,
      totalResults,
      title: `Search results for "${query}" | HOOF`
    });
  } catch (error) {
    console.error("Search Error:", error);
    res.redirect("/");
  }
};

/**
 * @desc    Renders the shop page with advanced filtering and search.
 * @route   GET /user/shop
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadShop = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const category = req.query.category || null;
    const search = req.query.search || '';
    const sort = req.query.sort || 'newest';
    const maxPrice = req.query.maxPrice || 300000;

    const { products, totalPages, currentPage } = await userService.getShopProducts({
      page,
      limit: 9,
      category,
      search,
      sort,
      maxPrice
    });

    res.render("User/shop", {
      products,
      totalPages,
      currentPage,
      selectedCategory: category,
      selectedSort: sort,
      maxPrice: maxPrice,
      search: search,
      title: "Shop Sneakers | HOOF",
      layout: "layout"
    });
  } catch (error) {
    console.error("Shop Load Error:", error);
    res.redirect("/");
  }
};


// (Checkout functions moved to controller/UserCheckout.js)

// ==========================================
// ORDER MANAGEMENT SECTION (Delegated to controllers/user/order.controller.js)
// ==========================================
const orderController = require("../controllers/user/order.controller");
exports.loadOrders = orderController.loadOrders;
exports.loadOrderDetails = orderController.loadOrderDetails;
exports.cancelOrder = orderController.cancelOrder;
exports.returnOrder = orderController.returnOrder;
exports.cancelOrderItem = orderController.cancelOrderItem;
exports.returnOrderItem = orderController.returnOrderItem;
exports.downloadInvoice = orderController.downloadInvoice;

// ==========================================
// WALLET SECTION (Delegated to controllers/user/wallet.controller.js)
// ==========================================
const walletController = require("../controllers/user/wallet.controller");
exports.loadWalletPage = walletController.loadWalletPage;
exports.getWalletData = walletController.getWalletData;

// ==========================================
// REFERRAL SECTION
// ==========================================

/**
 * @desc    Render the referral page with user's code, points, and stats.
 * @route   GET /user/referral
 * @access  Private
 */
exports.loadReferralPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    // Count how many users this person has referred
    const referredCount = await User.countDocuments({ referredBy: userId });

    // Get referral config for dynamic display
    const referralConfig = await ReferralConfig.getConfig();

    res.render('User/referral', {
      user,
      referredCount,
      referralConfig,
      title: 'Referral Program | HOOF',
      layout: 'layouts/user'
    });
  } catch (err) {
    console.error("Referral Page Error:", err);
    res.redirect('/user/profile');
  }
};

/**
 * @desc    Withdraw referral points to wallet (100 points = ₹1).
 * @route   POST /user/referral/withdraw
 * @access  Private
 */
exports.withdrawReferralPoints = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Get referral config for dynamic conversion
    const refConfig = await ReferralConfig.getConfig();
    const pointsPerRupee = refConfig.pointsPerRupee || 100;
    const minWithdraw = refConfig.minWithdrawPoints || 100;

    const points = user.referralPoints || 0;
    if (points < minWithdraw) {
      return res.status(400).json({
        success: false,
        message: `Minimum ${minWithdraw} points required to withdraw`
      });
    }

    // Convert all eligible points (multiples of pointsPerRupee) to rupees
    const withdrawablePoints = Math.floor(points / pointsPerRupee) * pointsPerRupee;
    const amountInRupees = withdrawablePoints / pointsPerRupee;

    // Credit wallet
    await walletService.creditWallet(
      userId,
      amountInRupees,
      `Referral reward withdrawal (${withdrawablePoints} points)`
    );

    // Deduct points from user
    user.referralPoints = points - withdrawablePoints;
    await user.save();

    res.json({
      success: true,
      message: `₹${amountInRupees.toFixed(2)} credited to your wallet!`,
      amountCredited: amountInRupees,
      remainingPoints: user.referralPoints
    });
  } catch (err) {
    console.error("Referral Withdraw Error:", err);
    res.status(500).json({ success: false, message: "Failed to withdraw" });
  }
};
