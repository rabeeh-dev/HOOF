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
const checkoutService = require('../services/Checkout');
const Order = require('../model/Order');
const PDFDocument = require('pdfkit');


// ==========================================
// AUTHENTICATION SECTION (Signup, Login, OTP)
// ==========================================

/**
 * @desc    Renders the registration page.
 * @route   GET /user/signup
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.signupPage = (req, res) => {
  res.render("User/auth/register", {
    layout: "layouts/user",
    message: null,
    formData: {},
  });
};

/**
 * @desc    Handles user registration and initiates OTP verification.
 * @route   POST /user/signup
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.signup = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  try {
    // Basic validation
    if (!fullName || !email || !password || !confirmPassword) {
      return res.render("User/auth/register", {
        layout: "layouts/user",
        message: { type: "error", text: "All fields are required" },
        formData: { fullName, email },
      });
    }

    if (password.length < 8) {
      return res.render("User/auth/register", {
        layout: "layouts/user",
        message: { type: "error", text: "Password must be at least 8 characters" },
        formData: { fullName, email },
      });
    }

    if (password !== confirmPassword) {
      return res.render("User/auth/register", {
        layout: "layouts/user",
        message: { type: "error", text: "Passwords do not match" },
        formData: { fullName, email },
      });
    }

    // Initiate signup process via service
    const result = await authService.initiateSignup(fullName, email, password);

    req.session.pendingUser = result.pendingUser;
    req.session.otpEmail = email;

    console.log("OTP (DEV):", result.otp);
    res.redirect("/user/verify-otp");

  } catch (err) {
    console.error("Signup error:", err);
    res.render("User/auth/register", {
      layout: "layouts/user",
      message: { type: "error", text: err.message || "Something went wrong. Try again." },
      formData: { fullName, email },
    });
  }
};

/**
 * @desc    Verifies the OTP code for signup or email changes.
 * @route   POST /user/verify-otp
 * @access  Public / Session-based
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const isOld = !!req.session.changeEmailFlow;
    const isNew = !!req.session.newEmailOtpSent;

    let mode = 'NEW_SIGNUP';
    let email = req.session.pendingUser?.email;

    // Determine verification context
    if (isNew) {
      mode = 'NEW_EMAIL_UPDATE';
      email = req.session.tempNewEmail;
    } else if (isOld) {
      mode = 'VERIFY_OLD_EMAIL';
      email = req.session.currentEmailToVerify;
    }

    if (!email) {
      return res.status(400).json({ success: false, message: "Session expired" });
    }

    const result = await authService.verifyOtpCode({
      otp,
      email,
      mode,
      userId: req.session.userId,
      pendingUserData: req.session.pendingUser
    });

    // Cleanup session after successful verification
    if (mode === 'NEW_EMAIL_UPDATE') {
      req.session.emailVerifiedForChange = req.session.newEmailOtpSent = req.session.tempNewEmail = null;
    } else if (mode === 'VERIFY_OLD_EMAIL') {
      req.session.emailVerifiedForChange = true;
      req.session.changeEmailFlow = null;
    } else {
      req.session.pendingUser = null;
    }

    return res.json({ success: true, redirectUrl: result.redirectUrl });

  } catch (err) {
    console.error("Verification Error:", err);
    return res.status(400).json({ success: false, message: err.message || "Error during verification." });
  }
};

/**
 * @desc    Resends the OTP code with a cooldown enforcement.
 * @route   POST /user/resend-otp
 * @access  Public / Session-based
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.resendOtp = async (req, res) => {
  try {
    const email = req.session.otpEmail;

    if (!email) {
      return res.status(400).json({
        message: "Session expired. Please signup again."
      });
    }

    const otp = await authService.processResendOtp(email);
    console.log("RESEND OTP (DEV):", otp);

    return res.json({ message: "OTP resent successfully" });

  } catch (err) {
    console.error("Resend OTP error:", err);
    const status = err.status || 500;
    const message = err.message || "Failed to resend OTP";
    return res.status(status).json({ message });
  }
};

/**
 * @desc    Renders the login page with optional success/reset messages.
 * @route   GET /user/login
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loginPage = (req, res) => {
  const signupSuccess = req.query.signupSuccess === 'true';
  const resetSuccess = req.query.resetSuccess === 'true';

  let successMessage = null;
  if (signupSuccess) {
    successMessage = "Account created successfully! Please log in.";
  } else if (resetSuccess) {
    successMessage = "Password reset successful! Log in now.";
  }

  res.render("User/auth/login", {
    layout: "layouts/user",
    error: null,
    successMessage: successMessage,
  });
};

/**
 * @desc    Authenticates user and starts a session.
 * @route   POST /user/login
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await authService.authenticateUser(email, password);

    // Establish user session
    req.session.userId = user._id;
    req.session.userName = user.fullName;
    req.session.userEmail = user.email;

    req.session.save((err) => {
      if (err) {
        console.error("Session Save Error:", err);
        return res.redirect("/user/login");
      }
      res.redirect("/user/home");
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.render("User/auth/login", {
      layout: "layouts/user",
      error: err.message || "Something went wrong. Try again.",
    });
  }
};

/**
 * @desc    Destroys user session and clears authentication cookies.
 * @route   POST /user/logout
 * @access  Private
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.logout = (req, res) => {
  req.session.userId = null;
  req.session.userName = null;

  req.session.destroy((err) => {
    if (err) {
      console.log("Logout Error:", err);
      return res.redirect("/user/home");
    }
    res.clearCookie("connect.sid", { path: '/' });
    res.redirect("/user/login");
  });
};

// ==========================================
// PASSWORD RECOVERY SECTION
// ==========================================

/**
 * @desc    Renders the forgot password email request page.
 * @route   GET /user/forgot-password
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.forgotPasswordPage = (req, res) => {
  res.render("User/auth/forgot-password", {
    layout: "layouts/user",
    message: null,
  });
};

/**
 * @desc    Generates reset token and sends a reset email.
 * @route   POST /user/forgot-password
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    await passwordService.initiatePasswordReset(email);

    res.render("User/auth/forgot-password", {
      layout: "layouts/user",
      message: "If an account exists, a reset link has been sent.",
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.render("User/auth/forgot-password", {
      layout: "layouts/user",
      message: "Something went wrong. Please try again.",
    });
  }
};

/**
 * @desc    Renders password reset form if the provided token is valid.
 * @route   GET /user/reset-password/:token
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.resetPasswordPage = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.send("Invalid or expired reset link");
  }

  res.render("User/auth/reset-password", {
    layout: "layouts/user",
    token: req.params.token,
  });
};

/**
 * @desc    Updates the password in the database after successful reset.
 * @route   POST /user/reset-password/:token
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const { token } = req.params;

    if (password !== confirmPassword) {
      return res.render("User/auth/reset-password", {
        token,
        error: "Passwords do not match"
      });
    }

    await passwordService.resetPassword(token, password);
    res.redirect("/user/login?resetSuccess=true");

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(400).send(err.message || "Internal Server Error");
  }
};

// ==========================================
// LANDING & HOME PAGES
// ==========================================

/**
 * @desc    Renders the public landing page with new arrivals.
 * @route   GET /
 * @access  Public
 */
exports.landingPage = async (req, res) => {
  try {
    const newArrivals = await userService.getNewArrivals();
    res.render("User/landing", {
      title: "HOOF | Premium Sneakers",
      layout: "layouts/user",
      newArrivals
    });
  } catch (err) {
    console.error("Landing Page Error:", err);
    res.render("User/landing", {
      title: "HOOF | Premium Sneakers",
      layout: "layouts/user",
      newArrivals: []
    });
  }
};

/**
 * @desc    User homepage (Landing after login) with fresh products.
 * @route   GET /user/home
 * @access  Private (isUser)
 */
exports.getHome = async (req, res) => {
  try {
    const newArrivals = await userService.getNewArrivals();
    res.render('User/home', {
      title: 'Home - ShoeStore',
      layout: 'layouts/user',
      newArrivals
    });
  } catch (err) {
    console.error("Home Page Error:", err);
    res.render('User/home', {
      title: 'Home - ShoeStore',
      layout: 'layouts/user',
      newArrivals: []
    });
  }
};

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
    const user = await User.findById(req.session.userId);
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Refresh OTP record for current email
    await Otp.deleteMany({ email: user.email });
    await Otp.create({ email: user.email, otp: hashedOtp, expiresAt: Date.now() + 300000 });
    await sendOtpEmail(user.email, otp);

    console.log("OLD EMAIL OTP (DEBUG):", otp);

    req.session.changeEmailFlow = true;
    req.session.currentEmailToVerify = user.email;

    res.render("User/auth/verify-otp", { layout: "layouts/user", email: user.email, message: null });
  } catch (err) {
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

    const exists = await User.findOne({ email: newEmail });
    if (exists) {
      return res.render('User/change-email', {
        layout: 'layouts/user',
        message: { type: 'error', text: 'Email already registered.' }
      });
    }

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Save OTP for new email verification
    await Otp.deleteMany({ email: newEmail });
    await Otp.create({ email: newEmail, otp: hashedOtp, expiresAt: Date.now() + 300000 });
    await sendOtpEmail(newEmail, otp);

    console.log("NEW EMAIL OTP (DEBUG):", otp);

    req.session.tempNewEmail = newEmail;
    req.session.newEmailOtpSent = true;

    res.render("User/auth/verify-otp", { layout: "layouts/user", email: newEmail, message: null });
  } catch (err) {
    res.redirect('/user/profile');
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


//checkout 

exports.loadCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;

    const data = await checkoutService.prepareCheckout(userId);
    console.log("Checkout Data:", data);
    res.render('User/checkout', data);

  } catch (err) {
    console.error(err);
    res.redirect('/user/cart');
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { addressId } = req.body;

    const order = await checkoutService.createOrder(userId, addressId);

    res.redirect(`/user/order-success/${order._id}`);

  } catch (err) {
    console.error(err);
    res.redirect('/user/checkout');
  }
};

//Order management 
exports.loadOrders = async (req, res) => {
  try {
    const userId = req.session.userId;

    const user = await User.findById(userId);

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 });

    res.render('User/orders', { orders, user });

  } catch (error) {
    console.error(error);
    res.redirect('/');
  }
};


exports.loadOrderDetails = async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);

    const orderDoc = await Order.findOne({ _id: req.params.id, userId })
      .populate({
        path: 'items.productId',
        select: 'productName productImage salePrice regularPrice category',
        populate: { path: 'category', select: 'name' }
      })
      .lean();

    if (!orderDoc) return res.redirect('/user/orders');

    // Transform items to match expected EJS structure
    const order = {
      ...orderDoc,
      items: orderDoc.items.map(item => ({
        ...item,
        product: item.productId || {}, // populated product
        itemStatus: item.itemStatus || orderDoc.status // fallback
      }))
    };

    res.render('User/order-detail', { order, user });
  } catch (err) {
    console.error("Load Order Details Error:", err);
    res.redirect('/user/orders');
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.session.userId
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Check if order is eligible for cancellation
    // Model Enum: ["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"]
    // Including legacy 'Pending'/'Processing' just in case, but prioritizing Model Enums
    if (!["PLACED", "CONFIRMED", "Pending", "Processing"].includes(order.status)) {
      return res.status(400).json({ success: false, message: "Order cannot be cancelled" });
    }

    order.status = "CANCELLED";
    order.statusHistory.push({
      status: "CANCELLED",
      note: "Cancelled by user"
    });

    await order.save();

    res.json({ success: true, message: "Order cancelled successfully" });

  } catch (err) {
    console.error("Cancel Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};

exports.returnOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.session.userId
    });

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status.toLowerCase() !== "delivered") {
      return res.status(400).json({ success: false, message: "Order cannot be returned" });
    }

    order.status = "Return Requested";
    order.statusHistory.push({
      status: "Return Requested",
      note: "Return requested by user"
    });

    await order.save();

    res.json({ success: true, message: "Return requested successfully" });

  } catch (err) {
    console.error("Return Order Error:", err);
    res.status(500).json({ success: false, message: "Failed to request return" });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      userId: req.session.userId
    }).populate('items.productId');

    if (!order || order.status.toLowerCase() !== "delivered") {
      return res.status(404).json({ error: "Invoice not available" });
    }

    const doc = new PDFDocument({ margin: 50 });
    let filename = `invoice-${order._id}.pdf`;
    filename = encodeURIComponent(filename);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('INVOICE', { align: 'center' });
    doc.moveDown();

    // Company Info
    doc.fontSize(12).text('HOOF Premium Sneakers', { align: 'right' });
    doc.text('123 Sneaker Street, Kerala, India', { align: 'right' });
    doc.moveDown();

    // Order Info
    doc.text(`Order ID: #${String(order._id).slice(-8).toUpperCase()}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();

    // Shipping Address
    doc.fontSize(14).text('Shipping Address', { underline: true });
    doc.fontSize(10).text(order.shippingAddress.fullName);
    doc.text(order.shippingAddress.street || order.shippingAddress.houseName || '');
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.zip || order.shippingAddress.pincode || ''}`);
    doc.text(`Phone: ${order.shippingAddress.phone || order.shippingAddress.mobile || ''}`);
    doc.moveDown();

    // Table Header
    const tableTop = 330;
    doc.fontSize(12).text('Item', 50, tableTop);
    doc.text('Qty', 300, tableTop);
    doc.text('Price', 400, tableTop);
    doc.text('Total', 500, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

    // Table Content
    let y = tableTop + 30;
    order.items.forEach(item => {
      doc.fontSize(10).text(item.productName || (item.productId ? item.productId.productName : 'Product'), 50, y);
      doc.text(item.quantity.toString(), 300, y);
      doc.text(`₹${item.priceAtPurchase.toLocaleString()}`, 400, y);
      doc.text(`₹${(item.quantity * item.priceAtPurchase).toLocaleString()}`, 500, y);
      y += 20;
    });

    // Summary
    doc.moveTo(50, y + 10).lineTo(550, y + 10).stroke();
    y += 25;
    doc.fontSize(12).text('Grand Total:', 400, y);
    doc.text(`₹${order.totalAmount.toLocaleString()}`, 500, y);

    // Footer
    doc.fontSize(10).text('Thank you for shopping with HOOF!', 50, 700, { align: 'center' });

    doc.end();

  } catch (err) {
    console.error("Invoice Error:", err);
    res.status(500).send("Error generating invoice");
  }
};

