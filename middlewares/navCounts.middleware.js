/**
 * @file middlewares/navCounts.middleware.js
 * @description Combines cartCount and wishlistCount fetching concurrently for customer navbar badges.
 */

const cartService = require('../services/cart.service');
const wishlistService = require('../services/wishlist.service');

const navCountsMiddleware = async (req, res, next) => {
  if (req.session && req.session.userId) {
    try {
      const [cartCount, wishlistCount] = await Promise.all([
        cartService.getCartCount(req.session.userId).catch(() => 0),
        wishlistService.getWishlistCount(req.session.userId).catch(() => 0),
      ]);
      res.locals.cartCount = cartCount || 0;
      res.locals.wishlistCount = wishlistCount || 0;
    } catch (error) {
      res.locals.cartCount = 0;
      res.locals.wishlistCount = 0;
    }
  } else {
    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;
  }
  next();
};

module.exports = navCountsMiddleware;
