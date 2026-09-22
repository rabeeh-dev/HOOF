/**
 * @file routes/api/user.js
 * @description API route definitions for customer actions (Shop, Cart, Wishlist, Profile, Wallet, Orders).
 */

const express = require('express');
const router = express.Router();
const productApiController = require('../../controller/api/Product');
const cartWishlistApiController = require('../../controller/api/CartWishlist');
const checkoutApiController = require('../../controller/api/Checkout');
const addressController = require('../../controller/Address');
const couponController = require('../../controller/Coupon');
const userCheckoutController = require('../../controller/UserCheckout');
const accountApiController = require('../../controller/api/Account');
const userController = require('../../controller/User');

// Product Catalog Routes
router.get('/products', productApiController.listProducts);
router.get('/products/new-arrivals', productApiController.getNewArrivals);
router.get('/product/:id', productApiController.getProductDetails);
router.get('/categories', productApiController.listCategories);

// Cart & Wishlist Routes
router.get('/cart', cartWishlistApiController.getCart);
router.post('/cart/add', cartWishlistApiController.addToCart);
router.put('/cart/update', cartWishlistApiController.updateCart);
router.post('/cart/remove', cartWishlistApiController.removeFromCart); // using POST /cart/remove for JSON compatibility

router.get('/wishlist', cartWishlistApiController.getWishlist);
router.post('/wishlist/add', cartWishlistApiController.addToWishlist);
router.post('/wishlist/remove', cartWishlistApiController.removeFromWishlist);
router.post('/wishlist/move-all', cartWishlistApiController.moveAllToCart);

router.get('/counts', cartWishlistApiController.getCounts);

// Addresses API Routes
router.get('/addresses', checkoutApiController.getUserAddresses);
router.post('/address/add', addressController.addAddress);
router.put('/address/edit/:id', addressController.editAddress);
router.delete('/address/delete/:id', addressController.deleteAddress);

// Coupons API Routes
router.get('/coupons/available', couponController.getAvailableCoupons);
router.post('/coupons/apply', couponController.applyCoupon);

// Wallet API Routes
router.get('/wallet', checkoutApiController.getWalletDetails);

// Checkout & Payment API Routes
router.get('/checkout', checkoutApiController.getCheckoutDetails);
router.post('/checkout/place-order', userCheckoutController.placeOrderApi);
router.post('/checkout/verify-payment', userCheckoutController.verifyPayment);
router.post('/checkout/retry-payment', userCheckoutController.retryPayment);

// Order Details API Routes (for Success/Failed pages)
router.get('/order/:id', checkoutApiController.getOrderDetails);

// Profile API Routes
router.get('/profile', accountApiController.getProfileDetails);
router.put('/profile/update', accountApiController.updateProfileDetails);
// Supports direct updates or password reset mail link triggers
router.post('/profile/change-password', accountApiController.changePasswordDirect);
router.post('/profile/change-password-request', userController.changePasswordRequest);

// Orders API Routes
router.get('/orders', accountApiController.getCustomerOrders);
router.get('/orders/:id', accountApiController.getCustomerOrderDetails);
router.put('/orders/cancel/:id', userController.cancelOrder);
router.put('/orders/return/:id', userController.returnOrder);
router.get('/orders/invoice/:id', userController.downloadInvoice);

// Referrals API Routes
router.get('/referral', accountApiController.getReferralStats);
router.post('/referral/withdraw', userController.withdrawReferralPoints);

// Reviews API Routes
router.post('/product/:id/review', accountApiController.addReviewApi);
router.put('/review/:id', accountApiController.editReviewApi);
router.delete('/review/:id', accountApiController.deleteReviewApi);

module.exports = router;
