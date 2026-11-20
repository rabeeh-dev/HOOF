/**
 * @file routes/user/shop.routes.js
 * @description Route definitions for customer browsing: landing, home, shop catalog, product details, reviews, about, and contact.
 */

const express = require('express');
const router = express.Router();
const shopController = require('../../controllers/user/shop.controller');
const { isUser } = require('../../middlewares/auth.middleware');

// Storefront discovery
router.get('/', shopController.landingPage);
router.get('/home', isUser, shopController.homePage);
router.get('/shop', shopController.listProducts);
router.get('/product-details/:id', shopController.loadProductDetails);
router.post('/product/:id/review', isUser, shopController.addReview);

// Brand & support pages
router.get('/about', shopController.aboutPage);
router.get('/contact', shopController.contactPage);
router.post('/contact', shopController.handleContactSubmit);

module.exports = router;
