/**
 * @file routes/index.js
 * @description Master router mounting portal-level routes (/user, /admin, /auth).
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./user/auth.routes');
const googleAuthRoutes = require('./Auth');
const userRoutes = require('./User');
const addressRoutes = require('./Address');
const adminRoutes = require('./Admin');
const userController = require('../controller/User');

// 1. User Authentication routes (/user/login, /user/signup, /user/verify-otp, etc.)
router.use('/user', authRoutes);

// 2. Direct Google OAuth entrypoints (/auth/google, /auth/google/callback)
router.use('/auth', googleAuthRoutes);

// 3. Address book routes
router.use('/user/address', addressRoutes);

// 4. User portal features (profile, shop, cart, checkout, orders, wallet, referral)
router.use('/user', userRoutes);

// 5. Admin portal routes (disable default user layout)
router.use(
  '/admin',
  (req, res, next) => {
    res.locals.layout = false;
    next();
  },
  adminRoutes
);

// 6. Public storefront landing page
router.get('/', userController.landingPage);

module.exports = router;
