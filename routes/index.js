/**
 * @file routes/index.js
 * @description Master router mounting portal-level routes (/user, /admin, /auth).
 */

const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const { isLoggedOut } = require('../middlewares/auth.middleware');

// User sub-routers & controllers
const authRoutes = require('./user/auth.routes');
const shopRoutes = require('./user/shop.routes');
const cartRoutes = require('./user/cart.routes');
const wishlistRoutes = require('./user/wishlist.routes');
const checkoutRoutes = require('./user/checkout.routes');
const orderRoutes = require('./user/order.routes');
const walletRoutes = require('./user/wallet.routes');
const referralRoutes = require('./user/referral.routes');
const profileRoutes = require('./user/profile.routes');
const authController = require('../controllers/user/auth.controller');
const shopController = require('../controllers/user/shop.controller');

// Admin sub-routers
const adminAuthRoutes = require('./admin/auth.routes');
const adminDashboardRoutes = require('./admin/dashboard.routes');
const adminProductRoutes = require('./admin/product.routes');
const adminOrderRoutes = require('./admin/order.routes');
const adminCouponRoutes = require('./admin/coupon.routes');
const adminCustomerRoutes = require('./admin/customer.routes');

// 1. User Authentication routes (/user/login, /user/signup, /user/verify-otp, etc.)
router.use('/user', authRoutes);

// 2. Direct Google OAuth entrypoints (/auth/google, /auth/google/callback)
router.get('/auth/google', isLoggedOut, passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get(
  '/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/user/login' }),
  authController.googleCallback
);

// 3. Storefront catalog & discovery routes (/user/shop, /user/product-details/:id, /user/home, /user/about, etc.)
router.use('/user', shopRoutes);

// 4. Shopping cart routes (/user/cart, /user/cart/add, /user/cart/update, /user/cart/remove/:id)
router.use('/user', cartRoutes);

// 5. Wishlist routes (/user/wishlist, /user/wishlist/add, etc.)
router.use('/user', wishlistRoutes);

// 6. Checkout & payment routes (/user/checkout, /user/checkout/place-order, Razorpay, coupons)
router.use('/user', checkoutRoutes);

// 7. Customer order management (/user/orders, /user/orders/:id, returns, cancellations, invoices)
router.use('/user', orderRoutes);

// 8. Customer wallet management (/user/wallet, /user/wallet/data)
router.use('/user', walletRoutes);

// 9. Customer referral routes (/user/referral, /user/referral/withdraw)
router.use('/user', referralRoutes);

// 10. Profile & address book routes (/user/address, /user/profile, etc.)
router.use('/user', profileRoutes);

// 11. Admin portal routes (disable default user layout)
const adminRouter = express.Router();
adminRouter.use((req, res, next) => {
  res.locals.layout = false;
  next();
});
adminRouter.use('/', adminAuthRoutes);
adminRouter.use('/', adminDashboardRoutes);
adminRouter.use('/', adminProductRoutes);
adminRouter.use('/', adminOrderRoutes);
adminRouter.use('/', adminCouponRoutes);
adminRouter.use('/', adminCustomerRoutes);

router.use('/admin', adminRouter);

// 12. Public storefront landing page
router.get('/', shopController.landingPage);

module.exports = router;
