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
const referralController = require('../controllers/user/referral.controller');
const profileController = require('../controllers/user/profile.controller');


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
// USER PROFILE SECTION (Delegated to controllers/user/profile.controller)
// ==========================================
exports.getProfile = profileController.getProfile;
exports.updateProfile = profileController.updateProfile;
exports.updateProfileImage = profileController.updateProfileImage;
exports.deleteProfileImage = profileController.deleteProfileImage;
exports.getChangeEmailOtp = profileController.getChangeEmailOtp;
exports.renderChangeEmailForm = profileController.renderChangeEmailForm;
exports.sendNewEmailOtp = profileController.sendNewEmailOtp;
exports.changePasswordRequest = profileController.changePasswordRequest;

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

// ==========================================
// REFERRAL SECTION (Delegated to controllers/user/referral.controller)
// ==========================================
exports.loadReferralPage = (req, res, next) => referralController.loadReferralPage(req, res, next);
exports.withdrawReferralPoints = (req, res, next) => referralController.withdrawReferralPoints(req, res, next);
