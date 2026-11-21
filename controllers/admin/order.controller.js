/**
 * @file controllers/admin/order.controller.js
 * @description Controller handling administrator order management: listing, detail view, status transitions, return approvals, stock restorations, and export reports.
 */

const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Coupon = require('../../models/Coupon');
const walletService = require('../../services/wallet.service');
const checkoutService = require('../../services/checkout.service');
const orderService = require('../../services/order.service');
const reportService = require('../../services/report.service');

/**
 * @desc    Load administrative orders list with filtering, searching, and pagination.
 * @route   GET /admin/orders
 * @access  Private (isAdminLogin)
 */
exports.loadOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const { status, payment, search, sort = 'newest' } = req.query;

    let query = {};

    if (status) query.status = status;
    if (payment) query.paymentMethod = payment;

    // Exclude abandoned/unpaid pending UPI attempts unless explicitly filtered
    if (!status && !payment) {
      query.$nor = [{ paymentMethod: 'upi', paymentStatus: 'Pending' }];
    }

    if (search) {
      const cleanSearch = search.replace('#', '').trim();
      const searchRegex = new RegExp(cleanSearch, 'i');
      query.$or = [
        { 'shippingAddress.fullName': searchRegex },
        { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchRegex } } },
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    else if (sort === 'amount_high') sortOption = { totalAmount: -1 };
    else if (sort === 'amount_low') sortOption = { totalAmount: 1 };

    const baseFilter = { $nor: [{ paymentMethod: 'upi', paymentStatus: 'Pending' }] };
    const totalOrders = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('userId', 'fullName email')
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const stats = {
      total: await Order.countDocuments(baseFilter),
      pending: await Order.countDocuments({ status: 'Pending', ...baseFilter }),
      processing: await Order.countDocuments({ status: 'Processing' }),
      delivered: await Order.countDocuments({ status: 'DELIVERED' }),
      totalRevenue:
        (
          await Order.aggregate([
            { $match: { status: 'DELIVERED' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
          ])
        )[0]?.total || 0,
    };

    res.render('Admin/admin-orders', {
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit) || 1,
      totalOrders,
      selectedStatus: status || '',
      selectedPayment: payment || '',
      statusFilter: status || '',
      paymentFilter: payment || '',
      search: search || '',
      searchQuery: search || '',
      sortFilter: sort,
      stats,
      title: 'Orders | HOOF Admin',
      layout: false,
    });
  } catch (error) {
    console.error('Load Orders Error:', error.message);
    res.redirect('/admin/dashboard');
  }
};

/**
 * @desc    Render the dedicated order detail page.
 * @route   GET /admin/orders/:id
 * @access  Private (isAdminLogin)
 */
exports.loadOrderDetailPage = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('userId', 'fullName email phone')
      .lean();

    if (!order) {
      return res.redirect('/admin/orders');
    }

    const hasReturnedItems = order.items && order.items.some((i) => i.itemStatus === 'Returned');
    const hasReturnApproved = order.items && order.items.some((i) => i.itemStatus === 'Return Approved');
    const hasReturnRequested = order.items && order.items.some((i) => i.itemStatus === 'Return Requested');

    const returnItems =
      order.items &&
      order.items.filter((i) =>
        ['Return Requested', 'Return Approved', 'Picked Up', 'Returned'].includes(i.itemStatus)
      );

    order.returnItems = returnItems || [];
    order.hasReturnedItems = hasReturnedItems;
    order.hasReturnApproved = hasReturnApproved;
    order.hasReturnRequested = hasReturnRequested;

    res.render('Admin/admin-order-detail', {
      order,
      title: `Order Details #${order._id.toString().slice(-8).toUpperCase()} | HOOF Admin`,
      layout: false,
    });
  } catch (error) {
    console.error('Load Order Detail Error:', error.message);
    res.redirect('/admin/orders');
  }
};

/**
 * @desc    Get order details as JSON.
 * @route   GET /admin/orders/:id/detail
 * @access  Private (isAdminLogin)
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'fullName email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update whole order status and handle auto-refunds on return.
 * @route   PATCH /admin/orders/:id/status
 * @access  Private (isAdminLogin)
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const currentStatus = order.status;

    const allowedTransitions = {
      Pending: ['Processing', 'SHIPPED', 'Out for Delivery', 'DELIVERED', 'CANCELLED'],
      Processing: ['SHIPPED', 'Out for Delivery', 'DELIVERED', 'CANCELLED'],
      SHIPPED: ['Out for Delivery', 'DELIVERED', 'CANCELLED'],
      'Out for Delivery': ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['DELIVERED', 'Return Requested', 'Return Approved', 'Returned'],
      CANCELLED: ['CANCELLED'],
      'Return Requested': ['Return Approved', 'Returned', 'CANCELLED'],
      'Return Approved': ['Picked Up', 'Returned', 'CANCELLED'],
      'Picked Up': ['Returned', 'CANCELLED'],
      Returned: ['Returned'],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition: cannot change status from "${currentStatus}" to "${status}".`,
      });
    }

    const returningItems = order.items.filter((i) =>
      ['Return Requested', 'Return Approved'].includes(i.itemStatus)
    );

    if (returningItems.length > 0) {
      let itemStatusUpdate = null;
      if (status === 'Return Approved') itemStatusUpdate = 'Return Approved';
      else if (status === 'Picked Up') itemStatusUpdate = 'Picked Up';
      else if (status === 'Returned') itemStatusUpdate = 'Returned';

      if (itemStatusUpdate) {
        returningItems.forEach((item) => {
          item.itemStatus = itemStatusUpdate;
        });
      }
    } else if (status === 'CANCELLED') {
      order.items.forEach((item) => {
        if (item.itemStatus === 'Active') item.itemStatus = 'Cancelled';
      });

      const stockWasDeducted =
        order.paymentMethod !== 'upi' ||
        order.paymentStatus === 'SUCCESS' ||
        order.paymentStatus === 'Paid';
      if (stockWasDeducted) {
        await checkoutService.restoreStockForOrder(order._id);
      }

      if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') {
        const shortId = String(order._id).slice(-8).toUpperCase();
        await walletService.creditWallet(
          order.userId,
          order.totalAmount,
          `Refund for cancelled order #${shortId} (by admin)`,
          order._id
        );
        order.paymentStatus = 'Refunded';
      }

      // Put items back into customer's shopping cart
      await orderService.restoreItemsToCart(order.userId, order.items);
    }

    order.status = status;
    order.statusHistory.push({
      status,
      note: notes || `Status updated to ${status} by admin`,
    });

    if (status === 'DELIVERED') {
      order.paymentStatus = order.paymentMethod === 'COD' ? 'SUCCESS' : 'Paid';
    }

    if (status === 'Returned' && returningItems.length > 0) {
      const shortId = String(order._id).slice(-8).toUpperCase();
      let totalRefundAmount = 0;
      let totalItemCost = 0;
      const couponDiscount = order.discountAmount || 0;

      const originalSubtotal = order.items.reduce(
        (sum, i) => sum + i.priceAtPurchase * i.quantity,
        0
      );

      for (const item of returningItems) {
        const itemTotal = item.priceAtPurchase * item.quantity;
        totalItemCost += itemTotal;

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
      }

      let totalProportionalDiscount = 0;
      if (couponDiscount > 0 && originalSubtotal > 0) {
        for (const item of returningItems) {
          const itemTotal = item.priceAtPurchase * item.quantity;
          const itemContribution = itemTotal / originalSubtotal;
          totalProportionalDiscount += Math.round(couponDiscount * itemContribution);
        }
      }

      const remainingSubtotal = order.subtotal - totalItemCost;
      let couponClawback = totalProportionalDiscount;
      if (couponDiscount > 0 && order.couponCode) {
        const coupon = await Coupon.findOne({ couponCode: order.couponCode });
        if (coupon && coupon.minPurchaseAmount > 0 && remainingSubtotal < coupon.minPurchaseAmount) {
          couponClawback = couponDiscount;
        }
      }

      totalRefundAmount = Math.max(0, totalItemCost - couponClawback);

      order.subtotal -= totalItemCost;
      order.totalAmount -= totalRefundAmount;
      if (couponDiscount > 0) {
        order.discountAmount = Math.max(0, couponDiscount - couponClawback);
      }
      if (order.subtotal < 0) order.subtotal = 0;
      if (order.totalAmount < 0) order.totalAmount = 0;

      if (totalRefundAmount > 0) {
        await walletService.creditWallet(
          order.userId,
          totalRefundAmount,
          `Refund for returned items from order #${shortId}`,
          order._id
        );
      }

      const allResolved = order.items.every((i) => ['Returned', 'Cancelled'].includes(i.itemStatus));
      order.paymentStatus = allResolved ? 'Refunded' : 'Partially Refunded';
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order:statusChanged', {
        orderId: order._id,
        userId: order.userId,
        status,
      });
    }

    return res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Update Order Status Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update individual item status for per-item return management.
 * @route   PATCH /admin/orders/:orderId/item/:itemId/status
 * @access  Private (isAdminLogin)
 */
exports.updateItemStatus = async (req, res) => {
  try {
    const { orderId, itemId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const item = order.items.id(itemId);
    if (!item) return res.status(404).json({ success: false, message: 'Item not found' });

    const allowedItemTransitions = {
      'Return Requested': ['Return Approved', 'Active'],
      'Return Approved': ['Picked Up', 'Returned'],
      'Picked Up': ['Returned'],
    };

    const allowed = allowedItemTransitions[item.itemStatus] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change item status from "${item.itemStatus}" to "${status}".`,
      });
    }

    item.itemStatus = status;

    if (status === 'Active') {
      item.returnReason = '';
      order.statusHistory.push({
        status: 'Item Return Rejected',
        note: `Return rejected for "${item.productName}" by admin`,
      });
    } else {
      order.statusHistory.push({
        status: `Item ${status}`,
        note: `"${item.productName}" status updated to ${status} by admin`,
      });
    }

    if (status === 'Returned') {
      const shortId = String(order._id).slice(-8).toUpperCase();
      const itemTotal = item.priceAtPurchase * item.quantity;
      const couponDiscount = order.discountAmount || 0;

      const originalSubtotal = order.items.reduce(
        (sum, i) => sum + i.priceAtPurchase * i.quantity,
        0
      );

      let proportionalDiscount = 0;
      if (couponDiscount > 0 && originalSubtotal > 0) {
        const itemContribution = itemTotal / originalSubtotal;
        proportionalDiscount = Math.round(couponDiscount * itemContribution);
      }

      const remainingSubtotal = order.subtotal - itemTotal;
      let couponClawback = proportionalDiscount;
      if (couponDiscount > 0 && order.couponCode) {
        const coupon = await Coupon.findOne({ couponCode: order.couponCode });
        if (coupon && coupon.minPurchaseAmount > 0 && remainingSubtotal < coupon.minPurchaseAmount) {
          couponClawback = couponDiscount;
        }
      }

      const refundAmount = Math.max(0, itemTotal - couponClawback);

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

      if (refundAmount > 0) {
        await walletService.creditWallet(
          order.userId,
          refundAmount,
          `Refund for returned item "${item.productName}" from order #${shortId}`,
          order._id
        );
      }

      order.subtotal -= itemTotal;
      order.totalAmount -= refundAmount;
      if (couponDiscount > 0) {
        order.discountAmount = Math.max(0, couponDiscount - couponClawback);
      }
      if (order.subtotal < 0) order.subtotal = 0;
      if (order.totalAmount < 0) order.totalAmount = 0;
    }

    const allItemStatuses = order.items.map((i) => i.itemStatus);
    const allResolved = allItemStatuses.every((s) => ['Returned', 'Cancelled'].includes(s));
    const anyReturning = allItemStatuses.some((s) =>
      ['Return Requested', 'Return Approved', 'Picked Up'].includes(s)
    );
    const anyReturned = allItemStatuses.some((s) => s === 'Returned');

    if (allResolved) {
      order.status = 'Returned';
      order.paymentStatus = 'Refunded';
    } else if (anyReturned && !anyReturning) {
      order.paymentStatus = 'Partially Refunded';
    } else if (anyReturning) {
      const hasPickedUp = allItemStatuses.includes('Picked Up');
      const hasApproved = allItemStatuses.includes('Return Approved');
      const hasRequested = allItemStatuses.includes('Return Requested');

      if (hasPickedUp) order.status = 'Picked Up';
      else if (hasApproved) order.status = 'Return Approved';
      else if (hasRequested) order.status = 'Return Requested';
    } else if (status === 'Active') {
      const allActive = allItemStatuses.every((s) => s === 'Active' || s === 'Cancelled');
      if (allActive) {
        order.status = 'DELIVERED';
      }
    }

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order:statusChanged', {
        orderId: order._id,
        userId: order.userId,
        status: order.status,
      });
    }

    return res.json({ success: true, message: `Item status updated to "${status}" successfully` });
  } catch (error) {
    console.error('Update Item Status Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Cancel order from administrator portal and refund if paid.
 * @route   PATCH /admin/orders/:id/cancel
 * @access  Private (isAdminLogin)
 */
exports.cancelOrderAdmin = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    if (order.status === 'DELIVERED') {
      return res.status(400).json({ success: false, message: 'Delivered orders cannot be cancelled.' });
    }
    if (order.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Order is already cancelled.' });
    }

    order.status = 'CANCELLED';
    order.statusHistory.push({
      status: 'CANCELLED',
      note: 'Cancelled by administrator',
    });

    const stockWasDeducted =
      order.paymentMethod !== 'upi' ||
      order.paymentStatus === 'SUCCESS' ||
      order.paymentStatus === 'Paid';
    if (stockWasDeducted) {
      await checkoutService.restoreStockForOrder(order._id);
    }

    if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') {
      const shortId = String(order._id).slice(-8).toUpperCase();
      await walletService.creditWallet(
        order.userId,
        order.totalAmount,
        `Refund for cancelled order #${shortId} (by admin)`,
        order._id
      );
      order.paymentStatus = 'Refunded';
    }

    // Put items back into customer's shopping cart
    await orderService.restoreItemsToCart(order.userId, order.items);

    await order.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('order:statusChanged', {
        orderId: order._id,
        userId: order.userId,
        status: 'CANCELLED',
      });
    }

    return res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel Order Admin Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Export orders report as PDF.
 * @route   GET /admin/orders/export
 * @access  Private (isAdminLogin)
 */
exports.exportOrders = async (req, res) => {
  try {
    await reportService.generateOrdersPDF(res, req.query);
  } catch (error) {
    console.error('Export Orders Error:', error.message);
    res.status(500).send('Error generating orders report');
  }
};

/**
 * @desc    Export orders report as Excel spreadsheet.
 * @route   GET /admin/orders/export-excel
 * @access  Private (isAdminLogin)
 */
exports.exportOrdersExcel = async (req, res) => {
  try {
    await reportService.generateOrdersExcel(res, req.query);
  } catch (error) {
    console.error('Export Orders Excel Error:', error.message);
    res.status(500).send('Error generating Excel report');
  }
};
