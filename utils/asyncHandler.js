/**
 * @file utils/asyncHandler.js
 * @description Wrapper utility to catch unhandled async errors in route controllers.
 */

/**
 * Wraps an async controller function to forward errors to Express next().
 * @param {Function} fn - Async controller function.
 * @returns {Function} Express middleware handler.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
