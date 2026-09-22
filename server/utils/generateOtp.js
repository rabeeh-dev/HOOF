/**
 * @file utils/generateOtp.js
 * @description Utility for generating random 6-digit numeric OTPs.
 */

/**
 * Generates a random 6-digit One-Time Password (OTP).
 * @returns {string} The generated 6-digit OTP string.
 */
exports.generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

