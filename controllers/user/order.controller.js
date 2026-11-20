/**
 * @file controllers/user/order.controller.js
 * @description Controller handling customer orders: order history, tracking details, cancellations, return requests, and invoice PDF streaming.
 */

const User = require('../../models/User');
const orderService = require('../../services/order.service');

/**
 * @desc    Render user's order history page.
 * @route   GET /user/orders
 * @access  Private (isUser)
 */
exports.loadOrders = async (req, res) => {
  try {
    const userId = req.session.userId;
    const [orders, user] = await Promise.all([
      orderService.getUserOrders(userId),
      User.findById(userId),
    ]);

    res.render('User/orders', { orders, user });
  } catch (error) {
    console.error('Load Orders Error:', error);
    res.redirect('/');
  }
};

/**
 * @desc    Render details and timeline tracking for a specific order.
 * @route   GET /user/orders/:id
 * @access  Private (isUser)
 */
exports.loadOrderDetails = async (req, res) => {
  try {
    const userId = req.session.userId;
    const [order, user] = await Promise.all([
      orderService.getOrderDetails(req.params.id, userId),
      User.findById(userId),
    ]);

    res.render('User/order-detail', { order, user });
  } catch (err) {
    console.error('Load Order Details Error:', err.message);
    res.redirect('/user/orders');
  }
};

/**
 * @desc    Cancel an entire order before dispatch.
 * @route   PUT /user/orders/cancel/:id
 * @access  Private (isUser)
 */
exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    await orderService.cancelOrder(req.params.id, userId);

    return res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (err) {
    console.error('Cancel Order Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to cancel order',
    });
  }
};

/**
 * @desc    Submit a return request for an entire delivered order.
 * @route   PUT /user/orders/return/:id
 * @access  Private (isUser)
 */
exports.returnOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const userId = req.session.userId;

    await orderService.returnOrder({
      orderId: req.params.id,
      userId,
      reason,
    });

    return res.json({ success: true, message: 'Return requested successfully' });
  } catch (err) {
    console.error('Return Order Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to request return',
    });
  }
};

/**
 * @desc    Cancel an individual item within an unfulfilled order.
 * @route   PUT /user/orders/:orderId/item/:itemId/cancel
 * @access  Private (isUser)
 */
exports.cancelOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const userId = req.session.userId;

    const { item } = await orderService.cancelOrderItem({
      orderId,
      itemId,
      userId,
    });

    return res.json({
      success: true,
      message: `"${item.productName}" cancelled successfully`,
    });
  } catch (err) {
    console.error('Cancel Order Item Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to cancel item',
    });
  }
};

/**
 * @desc    Request a return for an individual item from a delivered order.
 * @route   PUT /user/orders/:orderId/item/:itemId/return
 * @access  Private (isUser)
 */
exports.returnOrderItem = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { reason } = req.body;
    const userId = req.session.userId;

    const { item } = await orderService.returnOrderItem({
      orderId,
      itemId,
      userId,
      reason,
    });

    return res.json({
      success: true,
      message: `Return requested for "${item.productName}"`,
    });
  } catch (err) {
    console.error('Return Order Item Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to request return',
    });
  }
};

/**
 * @desc    Generate and stream a PDF invoice for an eligible order.
 * @route   GET /user/orders/invoice/:id
 * @access  Private (isUser)
 */
exports.downloadInvoice = async (req, res) => {
  try {
    const userId = req.session.userId;
    const orderId = req.params.id;

    const { buffer, filename } = await orderService.generateInvoicePdf(orderId, userId);

    const encodedFilename = encodeURIComponent(filename);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodedFilename}"`);
    res.setHeader('Content-Length', buffer.length);

    return res.end(buffer);
  } catch (err) {
    console.error('Invoice Download Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      error: err.message || 'Error generating invoice',
    });
  }
};
