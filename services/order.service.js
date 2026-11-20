/**
 * @file services/order.service.js
 * @description Pure business logic for customer order management: tracking, details, item/order cancellations, return requests, wallet refunds, and PDF invoice generation.
 */

const path = require('path');
const ejs = require('ejs');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const walletService = require('./wallet.service');
const checkoutService = require('./checkout.service');
const { launchBrowser, generatePdfFromHtml } = require('../utils/pdfBrowser');
const AppError = require('../utils/AppError');

class OrderService {
  /**
   * Fetches all visible orders for a customer, excluding abandoned online payments.
   * @param {string} userId
   * @returns {Promise<Array>} List of user orders
   */
  async getUserOrders(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    return await Order.find({
      userId,
      $nor: [{ paymentMethod: 'upi', paymentStatus: 'Pending' }],
    }).sort({ createdAt: -1 });
  }

  /**
   * Fetches detailed information for a specific customer order.
   * @param {string} orderId
   * @param {string} userId
   * @returns {Promise<Object>} Formatted order document
   */
  async getOrderDetails(orderId, userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    if (!orderId || !orderId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid order ID', 400);
    }

    const orderDoc = await Order.findOne({ _id: orderId, userId })
      .populate({
        path: 'items.productId',
        select: 'productName productImage salePrice regularPrice category',
        populate: { path: 'category', select: 'name' },
      })
      .lean();

    if (!orderDoc) {
      throw new AppError('Order not found', 404);
    }

    const order = {
      ...orderDoc,
      items: orderDoc.items.map((item) => ({
        ...item,
        product: item.productId || {},
        itemStatus: item.itemStatus || orderDoc.status,
      })),
    };

    return order;
  }

  /**
   * Cancels an entire customer order, restores product stock, and issues wallet refunds if pre-paid.
   * @param {string} orderId
   * @param {string} userId
   * @returns {Promise<Object>} Updated order document
   */
  async cancelOrder(orderId, userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!['PLACED', 'CONFIRMED', 'Pending', 'Processing'].includes(order.status)) {
      throw new AppError('Order cannot be cancelled at this stage', 400);
    }

    order.status = 'CANCELLED';
    order.statusHistory.push({
      status: 'CANCELLED',
      note: 'Cancelled by user',
    });

    // Mark individual items as cancelled
    order.items.forEach((item) => {
      item.itemStatus = 'Cancelled';
    });

    // Restore stock if stock was deducted
    const stockWasDeducted =
      order.paymentMethod !== 'upi' ||
      order.paymentStatus === 'SUCCESS' ||
      order.paymentStatus === 'Paid';

    if (stockWasDeducted) {
      await checkoutService.restoreStockForOrder(order._id);
    }

    // Refund to wallet if payment was already confirmed
    if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') {
      const shortId = String(order._id).slice(-8).toUpperCase();
      await walletService.creditWallet(
        userId,
        order.totalAmount,
        `Refund for cancelled order #${shortId}`,
        order._id
      );
      order.paymentStatus = 'Refunded';
    }

    await order.save();
    return order;
  }

  /**
   * Requests a return for an entire delivered order.
   * @param {Object} params
   * @param {string} params.orderId
   * @param {string} params.userId
   * @param {string} params.reason
   * @returns {Promise<Object>} Updated order document
   */
  async returnOrder({ orderId, userId, reason }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    if (!reason || !reason.trim()) {
      throw new AppError('Return reason is required', 400);
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (['Return Requested', 'Return Approved', 'Returned'].includes(order.status)) {
      throw new AppError('Return already requested or processed for this order.', 400);
    }

    if (order.status !== 'DELIVERED') {
      throw new AppError('Only delivered orders can be returned.', 400);
    }

    order.status = 'Return Requested';
    order.statusHistory.push({
      status: 'Return Requested',
      note: `Return requested by user. Reason: ${reason.trim()}`,
    });

    // Mark active items as Return Requested
    order.items.forEach((item) => {
      if (item.itemStatus === 'Active') {
        item.itemStatus = 'Return Requested';
        item.returnReason = reason.trim();
      }
    });

    await order.save();
    return order;
  }

  /**
   * Cancels a single item within an order, adjusts totals, restores inventory, and refunds wallet.
   * @param {Object} params
   * @param {string} params.orderId
   * @param {string} params.itemId
   * @param {string} params.userId
   * @returns {Promise<Object>} Cancelled item details
   */
  async cancelOrderItem({ orderId, itemId, userId }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!['Pending', 'Processing', 'PLACED', 'CONFIRMED'].includes(order.status)) {
      throw new AppError('Items cannot be cancelled at this stage.', 400);
    }

    const item = order.items.id(itemId);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    if (item.itemStatus !== 'Active') {
      throw new AppError(`This item is already ${item.itemStatus}`, 400);
    }

    item.itemStatus = 'Cancelled';

    // Restore stock for this item
    const product = await Product.findById(item.productId);
    if (product) {
      const variant = product.variants
        ? product.variants.find((v) => String(v.size) === String(item.variantSize))
        : null;
      if (variant) {
        variant.quantity += item.quantity;
        variant.status = 'Available';
      }
      product.quantity += item.quantity;
      await product.save();
    }

    // Partial refund calculation deducting proportional coupon share
    const itemTotal = item.priceAtPurchase * item.quantity;
    const couponDiscount = order.discountAmount || 0;
    const totalItemCount = order.items.length;
    let perItemDiscount = 0;
    if (couponDiscount > 0 && totalItemCount > 0) {
      perItemDiscount = Math.round(couponDiscount / totalItemCount);
    }
    const refundAmount = itemTotal - perItemDiscount;

    if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') {
      const shortId = String(order._id).slice(-8).toUpperCase();
      await walletService.creditWallet(
        userId,
        refundAmount,
        `Refund for cancelled item "${item.productName}" from order #${shortId}`,
        order._id
      );
    }

    order.statusHistory.push({
      status: 'Item Cancelled',
      note: `"${item.productName}" (Size: ${item.variantSize || 'N/A'}) cancelled by user`,
    });

    // Adjust order totals
    order.subtotal -= itemTotal;
    order.totalAmount -= refundAmount;
    if (couponDiscount > 0) {
      order.discountAmount = Math.max(0, couponDiscount - perItemDiscount);
    }
    if (order.subtotal < 0) order.subtotal = 0;
    if (order.totalAmount < 0) order.totalAmount = 0;

    // If ALL items cancelled, mark whole order cancelled
    const allCancelled = order.items.every((i) => i.itemStatus === 'Cancelled');
    if (allCancelled) {
      order.status = 'CANCELLED';
      order.statusHistory.push({ status: 'CANCELLED', note: 'All items cancelled by user' });
      if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') {
        order.paymentStatus = 'Refunded';
      }
    }

    await order.save();
    return { item, order };
  }

  /**
   * Requests a return for a single item within a delivered order.
   * @param {Object} params
   * @param {string} params.orderId
   * @param {string} params.itemId
   * @param {string} params.userId
   * @param {string} params.reason
   * @returns {Promise<Object>} Updated item and order details
   */
  async returnOrderItem({ orderId, itemId, userId, reason }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    if (!reason || !reason.trim()) {
      throw new AppError('Return reason is required', 400);
    }

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.status !== 'DELIVERED') {
      throw new AppError('Can only return delivered items', 400);
    }

    const item = order.items.id(itemId);
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    if (item.itemStatus !== 'Active') {
      throw new AppError(`This item is already ${item.itemStatus}`, 400);
    }

    item.itemStatus = 'Return Requested';
    item.returnReason = reason.trim();

    order.statusHistory.push({
      status: 'Item Return Requested',
      note: `Return requested for "${item.productName}" - Reason: ${reason.trim()}`,
    });

    const allReturning = order.items.every((i) =>
      ['Return Requested', 'Return Approved', 'Picked Up', 'Returned', 'Cancelled'].includes(
        i.itemStatus
      )
    );

    if (
      allReturning &&
      !['Return Requested', 'Return Approved', 'Picked Up', 'Returned', 'CANCELLED'].includes(
        order.status
      )
    ) {
      order.status = 'Return Requested';
      order.statusHistory.push({
        status: 'Return Requested',
        note: 'Return requested for all active items',
      });
    }

    await order.save();
    return { item, order };
  }

  /**
   * Generates a downloadable PDF invoice for an eligible completed order.
   * @param {string} orderId
   * @param {string} userId
   * @returns {Promise<Buffer>} PDF binary buffer
   */
  async generateInvoicePdf(orderId, userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const order = await Order.findOne({
      _id: orderId,
      userId,
    }).populate('items.productId');

    if (
      !order ||
      !['delivered', 'return requested', 'return approved', 'picked up', 'returned'].includes(
        order.status.toLowerCase()
      )
    ) {
      throw new AppError('Invoice not available for this order status', 404);
    }

    const templatePath = path.join(__dirname, '../views/User/invoice-template.ejs');
    const htmlContent = await ejs.renderFile(templatePath, { order });

    const browser = await launchBrowser();
    const nodeBuffer = await generatePdfFromHtml(browser, htmlContent, {
      margin: { top: '0px', right: '0px', bottom: '0px', left: '0px' },
    });
    await browser.close();

    return {
      buffer: nodeBuffer,
      filename: `invoice-${order._id}.pdf`,
    };
  }
}

module.exports = new OrderService();
