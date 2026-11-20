/**
 * @file controller/Coupon.js
 * @description Backward-compatible proxy to controllers/user/checkout.controller.js
 */

const checkoutController = require('../controllers/user/checkout.controller');

exports.getAvailableCoupons = checkoutController.getAvailableCoupons;
exports.applyCoupon = checkoutController.applyCoupon;
