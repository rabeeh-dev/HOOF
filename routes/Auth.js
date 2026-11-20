/**
 * @file routes/Auth.js
 * @description Authentication routes via external providers (Google OAuth 2.0).
 */

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const authController = require('../controllers/user/auth.controller');
const { isLoggedOut } = require('../middlewares/auth.middleware');

router.get('/google', isLoggedOut, passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  authController.googleCallback
);

module.exports = router;
