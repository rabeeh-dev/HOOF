/**
 * @file routes/admin/customer.routes.js
 * @description Route definitions for administrative customer management: user listing, blocking/unblocking, and referral settings.
 */

const express = require('express');
const router = express.Router();
const customerController = require('../../controllers/admin/customer.controller');
const { isAdminLogin } = require('../../middlewares/adminAuth.middleware');

// Customer User Listing & Blocking
router.get('/customers', isAdminLogin, customerController.loadCustomers);
router.patch('/users/:id/:action', isAdminLogin, customerController.toggleUserStatus);

// Referral Settings
router.get('/referral', isAdminLogin, customerController.loadReferralSettings);
router.patch('/referral', isAdminLogin, customerController.updateReferralSettings);

module.exports = router;
