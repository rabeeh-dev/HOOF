const express = require('express');
const router = express.Router();
const passport = require('passport');

// Start Google authentication
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google callback
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
