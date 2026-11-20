/**
 * @file middleware/cartCount.js
 * @description Backward-compatible wrapper pointing to middlewares/navCounts.middleware.js
 */

const navCounts = require('../middlewares/navCounts.middleware');

module.exports = async (req, res, next) => {
  if (typeof res.locals.cartCount !== 'undefined') {
    return next();
  }
  return navCounts(req, res, next);
};
