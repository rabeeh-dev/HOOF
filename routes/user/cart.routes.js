/**
 * @file routes/user/cart.routes.js
 * @description Route definitions for shopping cart actions: bag viewing, adding items, updating quantities, and removal.
 */

const express = require('express');
const router = express.Router();
const cartController = require('../../controllers/user/cart.controller');
const { isUser } = require('../../middlewares/auth.middleware');

// All cart operations require an authenticated user
router.get('/cart', isUser, cartController.getCart);
router.post('/cart/add', isUser, cartController.addToCart);
router.put('/cart/update', isUser, cartController.updateQuantity);
router.delete('/cart/remove/:id', isUser, cartController.removeItem);
router.post('/cart/promo', isUser, cartController.applyPromo);

module.exports = router;
