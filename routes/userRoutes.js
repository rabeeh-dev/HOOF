const express = require("express");
const router = express.Router();
const userController = require("../controller/userController");
const { isUser, isLoggedOut } = require("../middleware/auth");

// ================= AUTH PAGES =================
// Use isLoggedOut so a logged-in user can't sign up again
router.get("/signup", isLoggedOut, userController.signupPage);
router.post("/signup", isLoggedOut, userController.signup);

// These stay public so the verification flow can finish
router.get("/verify-otp", (req, res) => {
  res.render("User/auth/verify-otp", {
    layout: "layouts/user",
    error: null,
  });
});
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

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


// ================= LOGOUT=================
router.post("/logout", userController.logout);


module.exports = router;