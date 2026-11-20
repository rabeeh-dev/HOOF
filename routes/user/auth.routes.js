/**
 * @file routes/user/auth.routes.js
 * @description Authentication route definitions for customer registration, login, OTP verification, Google OAuth, and password recovery.
 */

const express = require('express');
const router = express.Router();
const passport = require('../../config/passport');
const authController = require('../../controllers/user/auth.controller');
const { isUser, isLoggedOut } = require('../../middlewares/auth.middleware');
const { authLimiter, otpLimiter, forgotPasswordLimiter } = require('../../middlewares/rateLimit.middleware');

// ==========================================
// REGISTRATION & SIGNUP
// ==========================================
router.get('/signup', isLoggedOut, authController.signupPage);
router.post('/signup', isLoggedOut, authLimiter, authController.signup);

// ==========================================
// OTP VERIFICATION
// ==========================================
router.get('/verify-otp', authController.verifyOtpPage);
router.post('/verify-otp', otpLimiter, authController.verifyOtp);
router.post('/resend-otp', authController.resendOtp);

// ==========================================
// LOCAL LOGIN & LOGOUT
// ==========================================
router.get('/login', isLoggedOut, authController.loginPage);
router.post('/login', isLoggedOut, authLimiter, authController.login);
router.post('/logout', isUser, authController.logout);

// ==========================================
// GOOGLE OAUTH 2.0
// ==========================================
router.get('/auth/google', isLoggedOut, passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  authController.googleCallback
);

// ==========================================
// PASSWORD RECOVERY
// ==========================================
router.get('/forgot-password', isLoggedOut, authController.forgotPasswordPage);
router.post('/forgot-password', isLoggedOut, forgotPasswordLimiter, authController.forgotPassword);
router.get('/reset-password/:token', authController.resetPasswordPage);
router.post('/reset-password/:token', authController.resetPassword);

module.exports = router;
