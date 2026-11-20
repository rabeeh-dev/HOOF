/**
 * @file routes/admin/order.routes.js
 * @description Route definitions for administrator order processing, status updates, item returns, and reporting.
 */

const express = require('express');
const router = express.Router();
const orderController = require('../../controllers/admin/order.controller');
const { isAdminLogin } = require('../../middlewares/adminAuth.middleware');

// Orders listing and exports
router.get('/orders', isAdminLogin, orderController.loadOrders);
router.get('/orders/export', isAdminLogin, orderController.exportOrders);
router.get('/orders/export-excel', isAdminLogin, orderController.exportOrdersExcel);

// Dedicated order details
router.get('/orders/:id', isAdminLogin, orderController.loadOrderDetailPage);
router.get('/orders/:id/detail', isAdminLogin, orderController.getOrderDetail);

// Status updates and cancellations
router.patch('/orders/:id/status', isAdminLogin, orderController.updateOrderStatus);
router.patch('/orders/:id/cancel', isAdminLogin, orderController.cancelOrderAdmin);
router.patch(
  '/orders/:orderId/item/:itemId/status',
  isAdminLogin,
  orderController.updateItemStatus
);

module.exports = router;
