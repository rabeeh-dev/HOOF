/**
 * @file controller/Product.js
 * @description Backward-compatible proxy to controllers/user/shop.controller.js
 */

const shopController = require('../controllers/user/shop.controller');

exports.listProducts = shopController.listProducts;
exports.loadProductDetails = shopController.loadProductDetails;
exports.addReview = shopController.addReview;
