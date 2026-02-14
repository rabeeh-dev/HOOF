/**
 * @file routes/userRoutes.js
 * @description Route definitions for user-related features, including authentication, profile settings, and shop browsing.
 */

const express = require("express");
const router = express.Router();
const userController = require("../controller/User");
const { isUser, isLoggedOut } = require("../middleware/auth");
const upload = require('../middleware/multer');
const passport = require("../config/passport");

// ==========================================
// AUTHENTICATION ROUTES (Signup, Login, OTP)
// ==========================================

/**
 * @desc    Render signup page for new users.
 * @route   GET /user/signup
 * @access  Public (Guest Only)
 */
router.get("/signup", isLoggedOut, userController.signupPage);

/**
 * @desc    Handle user registration submitted via form.
 * @route   POST /user/signup
 * @access  Public
 */
router.post("/signup", isLoggedOut, userController.signup);

/**
 * @desc    Render OTP verification page.
 * @route   GET /user/verify-otp
 * @access  Public (Session-based)
 */
router.get("/verify-otp", (req, res) => {
  res.render("User/auth/verify-otp", {
    layout: "layouts/user",
    error: null,
  });
});

/**
 * @desc    Verify the submitted OTP code.
 * @route   POST /user/verify-otp
 * @access  Public
 */
router.post("/verify-otp", userController.verifyOtp);

/**
 * @desc    Trigger a new OTP email (resend).
 * @route   POST /user/resend-otp
 * @access  Public
 */
router.post("/resend-otp", userController.resendOtp);

/**
 * @desc    Render login page.
 * @route   GET /user/login
 * @access  Public (Guest Only)
 */
router.get("/login", isLoggedOut, userController.loginPage);

/**
 * @desc    Authenticate user credentials and create session.
 * @route   POST /user/login
 * @access  Public
 */
router.post("/login", isLoggedOut, userController.login);

// ==========================================
// GOOGLE OAUTH ROUTES
// ==========================================

/**
 * @desc    Redirect to Google OAuth consent screen.
 * @route   GET /user/auth/google
 * @access  Public / Social Auth
 */
router.get("/auth/google", isLoggedOut,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @desc    Handle Google authentication callback and session creation.
 * @route   GET /user/auth/google/callback
 * @access  Public
 */
router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/login" }),
  (req, res) => {
    // Populate session with authenticated user data
    req.session.userId = req.user._id;
    req.session.userName = req.user.fullName;
    req.session.userEmail = req.user.email;

    req.session.save((err) => {
      if (err) {
        console.error("Session Save Error:", err);
        return res.redirect("/user/login");
      }
      res.redirect("/user/home");
    });
  }
);

// ==========================================
// PASSWORD RECOVERY ROUTES
// ==========================================

/**
 * @desc    Render forgot password request page.
 * @route   GET /user/forgot-password
 * @access  Public
 */
router.get("/forgot-password", isLoggedOut, userController.forgotPasswordPage);

/**
 * @desc    Handle forgot password email submission.
 * @route   POST /user/forgot-password
 * @access  Public
 */
router.post("/forgot-password", isLoggedOut, userController.forgotPassword);

/**
 * @desc    Render reset password form via token link from email.
 * @route   GET /user/reset-password/:token
 * @access  Public (Token-based)
 */
router.get("/reset-password/:token", userController.resetPasswordPage);

/**
 * @desc    Process the password update after successful reset.
 * @route   POST /user/reset-password/:token
 * @access  Public
 */
router.post("/reset-password/:token", userController.resetPassword);

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
// SHOP / PRODUCT LISTING
// ==========================================
const productController = require("../controller/Product");

/**
 * @desc    Display the main shop page with filtering, sorting, and pagination.
 * @route   GET /user/shop
 * @access  Public / Private
 */
router.get('/shop', productController.listProducts);

/**
 * @desc    View details of a specific product and related items.
 * @route   GET /user/product-details/:id
 * @access  Public / Private
 */
router.get('/product-details/:id', productController.loadProductDetails);

module.exports = router;