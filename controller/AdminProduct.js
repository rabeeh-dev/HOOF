/**
 * @file controller/AdminProduct.js
 * @description Backward-compatible wrapper delegating admin product operations to controllers/admin/product.controller.js
 */

const productController = require('../controllers/admin/product.controller');

exports.listProductsAdmin = productController.listProductsAdmin;
exports.loadCategories = productController.loadCategories;
exports.addProduct = productController.addProduct;
exports.toggleProductStatus = productController.toggleProductStatus;
exports.loadEditProduct = productController.loadEditProduct;
exports.updateProduct = productController.updateProduct;
exports.loadAddProduct = productController.loadAddProduct;
