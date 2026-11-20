/**
 * @file routes/admin/coupon.routes.js
 * @description Route definitions for administrative coupon management: CRUD and status toggling.
 */

const express = require('express');
const router = express.Router();
const couponController = require('../../controllers/admin/coupon.controller');
const { isAdminLogin } = require('../../middlewares/adminAuth.middleware');

// All coupon management routes require an authenticated administrator
router.get('/coupons', isAdminLogin, couponController.loadCoupons);
router.post('/coupons/add', isAdminLogin, couponController.addCoupon);
router.get('/coupons/:id', isAdminLogin, couponController.getCoupon);
router.patch('/coupons/edit/:id', isAdminLogin, couponController.updateCoupon);
router.patch('/coupons/toggle-status/:id', isAdminLogin, couponController.toggleCouponStatus);

module.exports = router;
