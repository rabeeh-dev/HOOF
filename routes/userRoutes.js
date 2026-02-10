const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { isUser, isLoggedOut, isLogin } = require("../middleware/auth");
const upload = require('../middleware/multer');
const passport = require("../config/passport");

/* =============================================================================
   AUTHENTICATION ROUTES (Signup, Login, OTP)
   Access: Public / Guest (isLoggedOut)
============================================================================= */

/**
 * @route   GET /user/signup
 * @desc    Render signup page for new users
 */
router.get("/signup", isLoggedOut, userController.signupPage);

/**
 * @route   POST /user/signup
 * @desc    Handle user registration data
 */
router.post("/signup", isLoggedOut, userController.signup);

/**
 * @route   GET /user/verify-otp
 * @desc    Render OTP verification page
 */
router.get("/verify-otp", (req, res) => {
  res.render("User/auth/verify-otp", {
    layout: "layouts/user",
    error: null,
  });
});

/**
 * @route   POST /user/verify-otp
 * @desc    Verify the submitted OTP code
 */
router.post("/verify-otp", userController.verifyOtp);

/**
 * @route   POST /user/resend-otp
 * @desc    Trigger a new OTP email
 */
router.post("/resend-otp", userController.resendOtp);

/**
 * @route   GET /user/login
 * @desc    Render login page
 */
router.get("/login", isLoggedOut, userController.loginPage);

/**
 * @route   POST /user/login
 * @desc    Authenticate user and create session
 */
router.post("/login", isLoggedOut, userController.login);

/* =============================================================================
   GOOGLE OAUTH ROUTES
   Access: Public / Social Auth
============================================================================= */

/**
 * @route   GET /user/auth/google
 * @desc    Redirect to Google OAuth consent screen
 */
router.get("/auth/google", isLoggedOut,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @route   GET /user/auth/google/callback
 * @desc    Handle Google authentication callback and session creation
 */
router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/login" }),
  (req, res) => {
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

/* =============================================================================
   PASSWORD RECOVERY ROUTES
   Access: Public
============================================================================= */

/**
 * @route   GET /user/forgot-password
 * @desc    Render forgot password request page
 */
router.get("/forgot-password", isLoggedOut, userController.forgotPasswordPage);

/**
 * @route   POST /user/forgot-password
 * @desc    Handle forgot password email submission
 */
router.post("/forgot-password", isLoggedOut, userController.forgotPassword);

/**
 * @route   GET /user/reset-password/:token
 * @desc    Render reset password form via token link
 */
router.get("/reset-password/:token", userController.resetPasswordPage);

/**
 * @route   POST /user/reset-password/:token
 * @desc    Process the password update
 */
router.post("/reset-password/:token", userController.resetPassword);

/* =============================================================================
   USER PROFILE & ACCOUNT MANAGEMENT
   Access: Private (isUser)
============================================================================= */

/**
 * @route   GET /user/home
 * @desc    User homepage
 */
router.get('/home', isUser, (req, res) => {
  res.render('User/home', {
    title: 'Home - ShoeStore',
    layout: 'layouts/user'
  });
});

/**
 * @route   GET /user/profile
 * @desc    Render user profile dashboard
 */
router.get('/profile', isUser, userController.getProfile);

/**
 * @route   POST /user/profile/update
 * @desc    Update user profile details (AJAX)
 */
router.post('/profile/update', isUser, userController.updateProfile);

/**
 * @route   POST /user/profile/update-image
 * @desc    Upload and crop new profile image
 */
router.post('/profile/update-image', isUser, upload.single('profileImage'), userController.updateProfileImage);

/**
 * @route   DELETE /user/profile/delete-image
 * @desc    Remove profile image
 */
router.delete('/profile/delete-image', isUser, userController.deleteProfileImage);

/* =============================================================================
   EMAIL & PASSWORD CHANGE FLOW
   Access: Private (isUser)
============================================================================= */

/**
 * @route   GET /user/profile/change-email-start
 * @desc    Initiate email change (send OTP to old email)
 */
router.get('/profile/change-email-start', isUser, userController.getChangeEmailOtp);

/**
 * @route   GET /user/profile/change-email-form
 * @desc    Render form to enter new email (session protected)
 */
router.get('/profile/change-email-form', isUser, (req, res) => {
  if (!req.session.emailVerifiedForChange) return res.redirect('/user/profile');
  res.render('User/change-email', { layout: 'layouts/user' });
});

/**
 * @route   POST /user/profile/change-email-new-otp
 * @desc    Send OTP to the new email address
 */
router.post('/profile/change-email-new-otp', isUser, userController.sendNewEmailOtp);

/**
 * @route   GET /user/profile/change-password-request
 * @desc    Initiate password change from inside profile
 */
router.get('/profile/change-password-request', isUser, userController.changePasswordRequest);

/* =============================================================================
   ADDRESS MANAGEMENT
   Access: Private (isUser)
============================================================================= */
const addressController = require("../controller/addressController");

/**
 * @route   POST /user/address/add
 * @desc    Create new delivery address
 */
router.post('/address/add', isUser, addressController.addAddress);

/**
 * @route   DELETE /user/address/delete/:id
 * @desc    Remove a specific delivery address
 */
router.delete('/address/delete/:id', isUser, addressController.deleteAddress);

/* =============================================================================
   LOGOUT
============================================================================= */

/**
 * @route   POST /user/logout
 * @desc    End user session
 */
router.post("/logout", userController.logout);


/* =============================================================================
   SHOP / PRODUCT LISTING
============================================================================= */
const productController = require("../controller/productController");

/**
 * @route   GET /shop
 * @desc    Display the product listing page
 */
router.get('/shop', productController.listProducts);

/**
 * @route   GET /product-details/:id
 * @desc    View single product
 */
router.get('/product-details/:id', productController.loadProductDetails);



module.exports = router;