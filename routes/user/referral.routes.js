/**
 * @file routes/user/referral.routes.js
 * @description Route definitions for customer referral program: dashboard, sharing links, and points withdrawal.
 */

const express = require('express');
const router = express.Router();
const referralController = require('../../controllers/user/referral.controller');
const { isUser } = require('../../middlewares/auth.middleware');

// All customer referral routes require an authenticated user
router.get('/referral', isUser, referralController.loadReferralPage);
router.post('/referral/withdraw', isUser, referralController.withdrawReferralPoints);

module.exports = router;
