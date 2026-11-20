/**
 * @file services/password.service.js
 * @description Business logic for password reset requests, secure token validation, and password updates.
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { sendResetPasswordEmail } = require('../utils/sendEmail');
const AppError = require('../utils/AppError');

class PasswordService {
  /**
   * Generates a secure password reset token and emails it to the user.
   * @param {string} email
   * @returns {Promise<boolean>}
   */
  async initiatePasswordReset(email) {
    const normalizedEmail = (email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Only allow password reset for accounts with local credentials
    if (user && (user.authProvider === 'local' || user.authProvider === 'both' || user.password)) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 minutes
      await user.save({ validateBeforeSave: false });

      await sendResetPasswordEmail(normalizedEmail, resetToken);
    }

    // Always return true to prevent user enumeration
    return true;
  }

  /**
   * Verifies if a reset token is valid and unexpired.
   * @param {string} token
   * @returns {Promise<Object>}
   */
  async verifyResetToken(token) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Password reset link is invalid or has expired', 400);
    }

    return user;
  }

  /**
   * Resets the user's password with the new provided password.
   * @param {string} token
   * @param {string} password
   * @returns {Promise<boolean>}
   */
  async resetPassword(token, password) {
    if (!password || password.length < 8) {
      throw new AppError('Password must be at least 8 characters long', 400);
    }

    const user = await this.verifyResetToken(token);

    // Hash the new password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    // Ensure account has local access enabled
    if (user.authProvider === 'google') {
      user.authProvider = 'both';
    }

    await user.save({ validateBeforeSave: false });
    return true;
  }
}

module.exports = new PasswordService();
