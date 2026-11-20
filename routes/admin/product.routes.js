/**
 * @file routes/admin/product.routes.js
 * @description Route definitions for administrator product catalog and category management.
 */

const express = require('express');
const router = express.Router();
const productController = require('../../controllers/admin/product.controller');
const { isAdminLogin } = require('../../middlewares/adminAuth.middleware');
const upload = require('../../middlewares/upload.middleware');

const productImagesUpload = upload.productUpload
  ? upload.productUpload.array('productImages', 4)
  : upload.array('productImages', 4);

// ==========================================
// CATEGORY MANAGEMENT ROUTES
// ==========================================

router.get('/categories', isAdminLogin, productController.loadCategories);
router.post('/categories/add', isAdminLogin, productController.addCategory);
router.patch('/categories/edit/:id', isAdminLogin, productController.updateCategory);
router.patch('/categories/toggle-status/:id', isAdminLogin, productController.toggleCategoryStatus);
router.post('/categories/offer/:id', isAdminLogin, productController.applyCategoryOffer);
router.post('/categories/remove-offer/:id', isAdminLogin, productController.removeCategoryOffer);

// ==========================================
// PRODUCT MANAGEMENT ROUTES
// ==========================================

router.get('/products', isAdminLogin, productController.listProductsAdmin);
router.get('/products/add', isAdminLogin, productController.loadAddProduct);
router.post('/products/add', isAdminLogin, productImagesUpload, productController.addProduct);
router.patch('/products/toggle-status/:id', isAdminLogin, productController.toggleProductStatus);
router.get('/products/edit/:id', isAdminLogin, productController.loadEditProduct);
router.post('/products/edit/:id', isAdminLogin, productImagesUpload, productController.updateProduct);

module.exports = router;
