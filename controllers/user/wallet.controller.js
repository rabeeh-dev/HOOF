/**
 * @file controllers/user/wallet.controller.js
 * @description Controller handling customer wallet views, transaction histories, and balance API endpoints.
 */

const User = require('../../models/User');
const walletService = require('../../services/wallet.service');

/**
 * @desc    Render the wallet page with balance, metrics, and transaction history.
 * @route   GET /user/wallet
 * @access  Private (isUser)
 */
exports.loadWalletPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const [user, wallet] = await Promise.all([
      User.findById(userId),
      walletService.getWalletSummary(userId),
    ]);

    res.render('User/wallet', {
      user,
      wallet,
      title: 'My Wallet | HOOF',
      layout: 'layouts/user',
    });
  } catch (err) {
    console.error('Wallet Page Error:', err.message);
    res.redirect('/user/profile');
  }
};

/**
 * @desc    JSON API endpoint for real-time wallet balance and transaction logs.
 * @route   GET /user/wallet/data
 * @access  Private (isUser)
 */
exports.getWalletData = async (req, res) => {
  try {
    const userId = req.session.userId;
    const wallet = await walletService.getWalletSummary(userId);

    return res.json({
      success: true,
      balance: wallet.balance,
      transactions: wallet.transactions,
    });
  } catch (err) {
    console.error('Wallet Data Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to load wallet',
    });
  }
};
