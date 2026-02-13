/**
 * @file routes/authRoutes.js
 * @description Authentication routes via external providers (e.g., Google OAuth).
 */

const express = require('express');
const router = express.Router();
const passport = require('passport');

/**
 * @desc    Route to start Google authentication flow.
 * @route   GET /auth/google
 * @access  Public
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

/**
 * @desc    Callback route for Google authentication success or failure.
 * @route   GET /auth/google/callback
 * @access  Public
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/user/login',
  }),
  (req, res) => {
    // User is now authenticated
    res.redirect('/user/home');
  }
);

module.exports = router;
