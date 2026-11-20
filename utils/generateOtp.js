/**
 * @file utils/generateOtp.js
 * @description Cryptographically secure 6-digit numeric OTP generator.
 */

const crypto = require('crypto');

/**
 * Generates a cryptographically secure 6-digit One-Time Password.
 * @returns {string} 6-digit OTP string
 */
exports.generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};
