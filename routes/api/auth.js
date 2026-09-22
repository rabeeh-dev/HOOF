/**
 * @file routes/api/auth.js
 * @description API route definitions for authentication (Login, Signup, Google OAuth, OTP verification).
 */

const express = require('express');
const router = express.Router();
const apiAuthController = require('../../controller/api/Auth');

// Session routes
router.get('/me', apiAuthController.getMe);
router.post('/login', apiAuthController.login);
router.post('/signup', apiAuthController.signup);
router.post('/verify-otp', apiAuthController.verifyOtp);
router.post('/resend-otp', apiAuthController.resendOtp);
router.post('/forgot-password', apiAuthController.forgotPassword);
router.post('/reset-password/:token', apiAuthController.resetPassword);
router.post('/logout', apiAuthController.logout);

// Social Auth Redirection & Callbacks for API React flow
const passport = require('../../config/passport');
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  (req, res) => {
    req.session.userId = req.user._id;
    req.session.userName = req.user.fullName;
    req.session.userEmail = req.user.email;
    req.session.save((err) => {
      if (err) {
        return res.redirect("http://localhost:5173/login?error=session_error");
      }
      res.redirect("http://localhost:5173/");
    });
  }
);

module.exports = router;
