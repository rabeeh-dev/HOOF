const express = require("express");
const router = express.Router();

const userController = require("../controller/userController");

// ================= AUTH PAGES =================
router.get("/signup", userController.signupPage);
router.post("/signup", userController.signup);

router.get("/verify-otp", (req, res) => {
  res.render("User/auth/verify-otp", {
    layout: "layouts/user",
    error: null,
  });
});
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

// ================= LOGIN =================
router.get("/login", userController.loginPage);
router.post("/login", userController.login);

// ================= FORGOT PASSWORD =================
router.get("/forgot-password", userController.forgotPasswordPage);
router.post("/forgot-password", userController.forgotPassword);

// ================= RESET PASSWORD =================
router.get("/reset-password/:token", userController.resetPasswordPage);
router.post("/reset-password/:token", userController.resetPassword);

module.exports = router;
