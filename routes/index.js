/**
 * @file routes/index.js
 * @description Master router mounting portal-level routes (/user, /admin, /auth).
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./user/auth.routes');
const shopRoutes = require('./user/shop.routes');
const googleAuthRoutes = require('./Auth');
const userRoutes = require('./User');
const addressRoutes = require('./Address');
const adminRoutes = require('./Admin');
const shopController = require('../controllers/user/shop.controller');

// 1. User Authentication routes (/user/login, /user/signup, /user/verify-otp, etc.)
router.use('/user', authRoutes);

// 2. Direct Google OAuth entrypoints (/auth/google, /auth/google/callback)
router.use('/auth', googleAuthRoutes);

// 3. Storefront catalog & discovery routes (/user/shop, /user/product-details/:id, /user/home, /user/about, etc.)
router.use('/user', shopRoutes);

// 4. Address book routes
router.use('/user/address', addressRoutes);

// 5. User portal features (profile, cart, checkout, orders, wallet, referral)
router.use('/user', userRoutes);

// 6. Admin portal routes (disable default user layout)
router.use(
  '/admin',
  (req, res, next) => {
    res.locals.layout = false;
    next();
  },
  adminRoutes
);

// 7. Public storefront landing page
router.get('/', shopController.landingPage);

module.exports = router;
