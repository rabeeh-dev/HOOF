/**
 * @file routes/Admin.js
 * @description Master router for the administrative portal mounting modular admin sub-routers.
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./admin/auth.routes');
const dashboardRoutes = require('./admin/dashboard.routes');
const productRoutes = require('./admin/product.routes');
const orderRoutes = require('./admin/order.routes');
const couponRoutes = require('./admin/coupon.routes');
const customerRoutes = require('./admin/customer.routes');

// Mount Admin sub-routers
router.use('/', authRoutes);
router.use('/', dashboardRoutes);
router.use('/', productRoutes);
router.use('/', orderRoutes);
router.use('/', couponRoutes);
router.use('/', customerRoutes);

module.exports = router;
