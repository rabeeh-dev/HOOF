/**
 * @file services/Wallet.js
 * @description Backward-compatible proxy to services/wallet.service.js
 */

const walletService = require('./wallet.service');

exports.getWallet = (userId) => walletService.getWallet(userId);
exports.creditWallet = (userId, amount, description, orderId) =>
  walletService.creditWallet(userId, amount, description, orderId);
exports.debitWallet = (userId, amount, description, orderId) =>
  walletService.debitWallet(userId, amount, description, orderId);
exports.getWalletSummary = (userId) => walletService.getWalletSummary(userId);
