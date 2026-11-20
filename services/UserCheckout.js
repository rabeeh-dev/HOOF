/**
 * @file services/UserCheckout.js
 * @description Backward-compatible proxy to services/checkout.service.js
 */

const checkoutService = require('./checkout.service');

exports.prepareCheckout = (userId) => checkoutService.prepareCheckout(userId);
exports.createOrder = (userId, addressId, paymentMethod, couponCode) =>
  checkoutService.createOrder({ userId, addressId, paymentMethod, couponCode });
exports.createRazorpayOrder = (amount, orderId) => checkoutService.createRazorpayOrder(amount, orderId);
exports.verifyRazorpayPayment = (razorpayOrderId, razorpayPaymentId, signature) =>
  checkoutService.verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, signature);
exports.deductStockForOrder = (orderId) => checkoutService.deductStockForOrder(orderId);
exports.restoreStockForOrder = (orderId) => checkoutService.restoreStockForOrder(orderId);
exports.getAvailableCoupons = (userId) => checkoutService.getAvailableCoupons(userId);
exports.applyCoupon = (params) => checkoutService.applyCoupon(params);
