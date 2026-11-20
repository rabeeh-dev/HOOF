/**
 * @file services/wallet.service.js
 * @description Pure business logic for customer digital wallet: balance tracking, transaction history, credit (refunds/referrals), and debit operations.
 */

const Wallet = require('../models/Wallet');
const AppError = require('../utils/AppError');

class WalletService {
  /**
   * Retrieves or automatically initializes a user's wallet document.
   * @param {string} userId - User ObjectId string
   * @returns {Promise<Object>} Wallet document
   */
  async getWallet(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }
    return wallet;
  }

  /**
   * Credits funds to a user's wallet and logs a credit transaction.
   * @param {string} userId - User ObjectId string
   * @param {number} amount - Amount in INR to credit
   * @param {string} description - Transaction description
   * @param {string|null} [orderId=null] - Associated order ID if applicable
   * @returns {Promise<Object>} Updated wallet document
   */
  async creditWallet(userId, amount, description, orderId = null) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const creditAmount = Number(amount);
    if (isNaN(creditAmount) || creditAmount <= 0) {
      throw new AppError('Invalid credit amount', 400);
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }

    wallet.balance += creditAmount;
    wallet.transactions.push({
      type: 'credit',
      amount: creditAmount,
      description: description || 'Wallet credit',
      orderId,
      date: new Date(),
    });

    await wallet.save();
    return wallet;
  }

  /**
   * Debits funds from a user's wallet for order purchases.
   * @param {string} userId - User ObjectId string
   * @param {number} amount - Amount in INR to debit
   * @param {string} description - Transaction description
   * @param {string|null} [orderId=null] - Associated order ID if applicable
   * @returns {Promise<Object>} Updated wallet document
   */
  async debitWallet(userId, amount, description, orderId = null) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const debitAmount = Number(amount);
    if (isNaN(debitAmount) || debitAmount <= 0) {
      throw new AppError('Invalid debit amount', 400);
    }

    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }

    if (wallet.balance < debitAmount) {
      throw new AppError('Insufficient wallet balance', 400);
    }

    wallet.balance -= debitAmount;
    wallet.transactions.push({
      type: 'debit',
      amount: debitAmount,
      description: description || 'Wallet payment',
      orderId,
      date: new Date(),
    });

    await wallet.save();
    return wallet;
  }

  /**
   * Computes wallet dashboard summary with sorted transaction logs and debit/credit totals.
   * @param {string} userId
   * @returns {Promise<Object>} Formatted wallet details
   */
  async getWalletSummary(userId) {
    const wallet = await this.getWallet(userId);

    const transactions = (wallet.transactions || []).sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );

    const totalCredits = transactions
      .filter((t) => t.type === 'credit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalDebits = transactions
      .filter((t) => t.type === 'debit')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      balance: wallet.balance,
      transactions,
      totalCredits,
      totalDebits,
    };
  }
}

module.exports = new WalletService();
