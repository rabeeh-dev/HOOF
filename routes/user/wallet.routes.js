/**
 * @file routes/user/wallet.routes.js
 * @description Route definitions for customer digital wallet operations: balance view and transaction history API.
 */

const express = require('express');
const router = express.Router();
const walletController = require('../../controllers/user/wallet.controller');
const { isUser } = require('../../middlewares/auth.middleware');

// All wallet endpoints require an authenticated user
router.get('/wallet', isUser, walletController.loadWalletPage);
router.get('/wallet/data', isUser, walletController.getWalletData);

module.exports = router;
