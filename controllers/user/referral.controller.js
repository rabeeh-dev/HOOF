/**
 * @file controllers/user/referral.controller.js
 * @description Controller handling customer referral program views, referral links, and points-to-wallet conversion withdrawals.
 */

const userService = require('../../services/user.service');

/**
 * @desc    Render the customer referral program page.
 * @route   GET /user/referral
 * @access  Private (isUser)
 */
exports.loadReferralPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { user, referralConfig, referredCount } = await userService.getReferralPageData(userId);

    res.render('User/referral', {
      user,
      referredCount,
      referralConfig,
      title: 'Referral Program | HOOF',
      layout: 'layouts/user',
    });
  } catch (err) {
    console.error('Referral Page Error:', err.message);
    res.redirect('/user/profile');
  }
};

/**
 * @desc    Withdraw eligible referral points to customer wallet balance.
 * @route   POST /user/referral/withdraw
 * @access  Private (isUser)
 */
exports.withdrawReferralPoints = async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await userService.withdrawReferralPoints(userId);
    return res.json(result);
  } catch (err) {
    console.error('Referral Withdraw Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to withdraw referral points',
    });
  }
};
