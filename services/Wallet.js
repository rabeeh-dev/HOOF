const Wallet = require('../model/Wallet');

/**
 * @desc    Get or create a wallet for a user.
 * @param   {string} userId
 * @returns {Promise<Object>} Wallet document
 */
exports.getWallet = async (userId) => {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }
    return wallet;
};

/**
 * @desc    Credit (add) funds to a user's wallet.
 * @param   {string} userId
 * @param   {number} amount
 * @param   {string} description
 * @param   {string} [orderId]
 * @returns {Promise<Object>} Updated wallet document
 */
exports.creditWallet = async (userId, amount, description, orderId = null) => {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }

    wallet.balance += amount;
    wallet.transactions.push({
        type: 'credit',
        amount,
        description,
        orderId,
        date: new Date()
    });

    await wallet.save();
    return wallet;
};

/**
 * @desc    Debit (subtract) funds from a user's wallet.
 * @param   {string} userId
 * @param   {number} amount
 * @param   {string} description
 * @param   {string} [orderId]
 * @returns {Promise<Object>} Updated wallet document
 * @throws  {Error} If insufficient balance
 */
exports.debitWallet = async (userId, amount, description, orderId = null) => {
    let wallet = await Wallet.findOne({ userId });
    if (!wallet) {
        wallet = await Wallet.create({ userId, balance: 0, transactions: [] });
    }

    if (wallet.balance < amount) {
        throw new Error('Insufficient wallet balance');
    }

    wallet.balance -= amount;
    wallet.transactions.push({
        type: 'debit',
        amount,
        description,
        orderId,
        date: new Date()
    });

    await wallet.save();
    return wallet;
};
