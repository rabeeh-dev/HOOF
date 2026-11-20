/**
 * @file routes/user/checkout.routes.js
 * @description Route definitions for checkout processing, coupon discounts, and payment gateways (Razorpay, COD, Wallet, retry).
 */

const express = require('express');
const router = express.Router();
const checkoutController = require('../../controllers/user/checkout.controller');
const { isUser } = require('../../middlewares/auth.middleware');

// Checkout View & Order Placement
router.get('/checkout', isUser, checkoutController.loadCheckout);
router.post('/checkout', isUser, checkoutController.placeOrder);
router.post('/checkout/place-order', isUser, checkoutController.placeOrderApi);

// Razorpay Online Payments & Verification
router.post('/checkout/verify-payment', isUser, checkoutController.verifyPayment);
router.get('/payment-failure/:id', isUser, checkoutController.loadPaymentFailure);
router.post('/checkout/retry-payment', isUser, checkoutController.retryPayment);

// Order Success Receipt
router.get('/order-success/:id', isUser, checkoutController.loadOrderSuccess);

// Coupon Application at Checkout
router.get('/available-coupons', isUser, checkoutController.getAvailableCoupons);
router.post('/apply-coupon', isUser, checkoutController.applyCoupon);

module.exports = router;
