/**
 * @file routes/user/wishlist.routes.js
 * @description Route definitions for customer wishlist actions: viewing, saving items, removing, clearing, and bulk transfer to bag.
 */

const express = require('express');
const router = express.Router();
const wishlistController = require('../../controllers/user/wishlist.controller');
const { isUser } = require('../../middlewares/auth.middleware');

// All wishlist routes require an authenticated user
router.get('/wishlist', isUser, wishlistController.getWishlist);
router.post('/wishlist/add', isUser, wishlistController.addToWishlist);
router.delete('/wishlist/remove/:id', isUser, wishlistController.removeFromWishlist);
router.post('/wishlist/move-all', isUser, wishlistController.moveAllToCart);
router.delete('/wishlist/clear', isUser, wishlistController.clearWishlist);

module.exports = router;
