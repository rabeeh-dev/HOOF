/**
 * @file utils/AppError.js
 * @description Custom operational application error class.
 */

class AppError extends Error {
  /**
   * @param {string} message - Error description.
   * @param {number} statusCode - HTTP status code.
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
