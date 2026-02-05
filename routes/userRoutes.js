const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { isUser, isLoggedOut, isLogin } = require("../middleware/auth");
const upload = require('../middleware/multer');
const passport = require("../config/passport");


// =================  Normal AUTH PAGES =================
// Use isLoggedOut so a logged-in user can't sign up again
router.get("/signup", isLoggedOut, userController.signupPage);
router.post("/signup", isLoggedOut, userController.signup);

router.get("/verify-otp", (req, res) => {
  res.render("User/auth/verify-otp", {
    layout: "layouts/user",
    error: null,
  });
});

router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

// ================= Google AUTH PAGES =================

// 1. Redirect to Google (isLoggedOut is fine here)
router.get("/auth/google", isLoggedOut, 
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// 2. Google Callback (REMOVE isLoggedOut here)
router.get("/auth/google/callback", 
  passport.authenticate("google", { failureRedirect: "/user/login" }),
  (req, res) => {
    // Manually set session variables
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

// ================= LOGIN =================
// isLoggedOut prevents a logged-in user from seeing the login page
router.get("/login", isLoggedOut, userController.loginPage);
router.post("/login", isLoggedOut, userController.login);

// ================= FORGOT PASSWORD =================
router.get("/forgot-password", isLoggedOut, userController.forgotPasswordPage);
router.post("/forgot-password", isLoggedOut, userController.forgotPassword);

// ================= RESET PASSWORD =================
// Stay public because the user is technically logged out when resetting
router.get("/reset-password/:token", userController.resetPasswordPage);
router.post("/reset-password/:token", userController.resetPassword);

router.get('/home', isUser, (req, res) => {
  res.render('User/home', {
    title: 'Home - ShoeStore',
    layout: 'layouts/user'
  });
});

// ================= USER PROFILE =================
router.get('/profile', isUser, userController.getProfile);
router.post('/profile/update', isUser, userController.updateProfile);

// ================= USER PROFILE =================
router.post('/profile/update-image', isUser, upload.single('profileImage'), userController.updateProfileImage);
router.delete('/profile/delete-image', isUser, userController.deleteProfileImage);
// ================= CHANGE EMAIL =================
// 1. Trigger the process (Send OTP to current email)
router.get('/profile/change-email-start', isUser, userController.getChangeEmailOtp);

// 2. The page where user types the NEW email (Protected by session)
router.get('/profile/change-email-form', isUser, (req, res) => {
    if (!req.session.emailVerifiedForChange) return res.redirect('/user/profile');
    res.render('User/change-email', { layout: 'layouts/user' });
});

// 3. Process the new email (Send OTP to the new email)
router.post('/profile/change-email-new-otp', isUser, userController.sendNewEmailOtp);


// ================= CHANGE PASSWORD =================
// Trigger Change Password (reuses forgot password logic)
router.get('/profile/change-password-request', isUser, userController.changePasswordRequest);


const addressController = require("../controller/addressController");

// ================= ADDRESS =================

router.post('/address/add', isUser, addressController.addAddress);

router.delete('/address/delete/:id', isUser, addressController.deleteAddress);


// ================= LOGOUT=================
router.post("/logout", userController.logout);


module.exports = router;