/**
 * @file routes/user/order.routes.js
 * @description Route definitions for customer order management: order history, tracking details, cancellations, return requests, and invoice downloads.
 */

const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/user/order.controller');
const { isUser } = require('../../middlewares/auth.middleware');

// Customer Order Listing & Details
router.get('/orders', isUser, orderController.loadOrders);
router.get('/orders/:id', isUser, orderController.loadOrderDetails);

// Full Order Actions
router.put('/orders/cancel/:id', isUser, orderController.cancelOrder);
router.put('/orders/return/:id', isUser, orderController.returnOrder);

// Per-Item Actions
router.put('/orders/:orderId/item/:itemId/cancel', isUser, orderController.cancelOrderItem);
router.put('/orders/:orderId/item/:itemId/return', isUser, orderController.returnOrderItem);

// Invoice Download
router.get('/orders/invoice/:id', isUser, orderController.downloadInvoice);

module.exports = router;
