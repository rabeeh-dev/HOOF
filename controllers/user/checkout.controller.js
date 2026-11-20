/**
 * @file controllers/user/checkout.controller.js
 * @description Controller handling checkout page rendering, order creation, payment gateways (Razorpay, COD, Wallet), payment verification, retries, and coupon applications.
 */

const User = require('../../models/User');
const Order = require('../../models/Order');
const checkoutService = require('../../services/checkout.service');
const walletService = require('../../services/wallet.service');

/**
 * @desc    Render the checkout page with cart items, addresses, and pricing.
 * @route   GET /user/checkout
 * @access  Private (isUser)
 */
exports.loadCheckout = async (req, res) => {
  try {
    const userId = req.session.userId;
    const data = await checkoutService.prepareCheckout(userId);

    // If all items are blocked/unavailable, redirect to cart
    if (!data.cartItems || data.cartItems.length === 0) {
      return res.redirect('/user/cart?unavailable=1');
    }

    // Fetch wallet balance for payment option
    const wallet = await walletService.getWallet(userId);
    data.walletBalance = wallet ? wallet.balance : 0;

    res.render('User/checkout', data);
  } catch (err) {
    console.error('Load Checkout Error:', err.message);
    if (err.message.includes('no longer available') || err.message === 'Cart is empty') {
      return res.redirect('/user/cart?unavailable=1');
    }
    res.redirect('/user/cart');
  }
};

/**
 * @desc    Process order placement via standard form submit.
 * @route   POST /user/checkout
 * @access  Private (isUser)
 */
exports.placeOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { addressId, couponCode, paymentMethod } = req.body;
    const order = await checkoutService.createOrder({
      userId,
      addressId,
      paymentMethod,
      couponCode,
    });
    res.redirect(`/user/order-success/${order._id}`);
  } catch (err) {
    console.error('Place Order Form Error:', err.message);
    res.redirect('/user/checkout');
  }
};

/**
 * @desc    Process order placement via AJAX (supports COD, Wallet, and online Razorpay/UPI).
 * @route   POST /user/checkout/place-order
 * @access  Private (isUser)
 */
exports.placeOrderApi = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { addressId, couponCode, paymentMethod } = req.body || {};

    if (!addressId) {
      return res.status(400).json({ success: false, message: 'Please select a delivery address.' });
    }

    const order = await checkoutService.createOrder({
      userId,
      addressId,
      paymentMethod,
      couponCode,
    });

    // 1. Wallet Payment (instant confirmation)
    if (paymentMethod === 'wallet') {
      return res.status(200).json({
        success: true,
        redirectUrl: `/user/order-success/${order._id}`,
      });
    }

    // 2. Online Payment (Razorpay / UPI)
    if (paymentMethod === 'upi') {
      try {
        const razorpayOrder = await checkoutService.createRazorpayOrder(order.totalAmount, order._id);

        order.razorpayOrderId = razorpayOrder.id;
        await order.save();

        return res.status(200).json({
          success: true,
          paymentMethod: 'upi',
          razorpayOrderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          keyId: process.env.RAZORPAY_KEY_ID,
          orderId: order._id,
          user: {
            name: req.session.userName,
            email: req.session.userEmail,
          },
        });
      } catch (rzpErr) {
        console.error('Razorpay Order Creation Failed:', rzpErr);
        return res.status(200).json({
          success: false,
          message: 'Payment initialization failed. Please try again or use COD.',
        });
      }
    }

    // 3. Cash on Delivery (COD)
    return res.status(200).json({
      success: true,
      redirectUrl: `/user/order-success/${order._id}`,
    });
  } catch (err) {
    console.error('Place Order API Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to place order.',
    });
  }
};

/**
 * @desc    Verify Razorpay payment signature and deduct stock.
 * @route   POST /user/checkout/verify-payment
 * @access  Private (isUser)
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const isVerified = checkoutService.verifyRazorpayPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (isVerified) {
      const order = await Order.findById(orderId);
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      // Deduct stock now that payment is confirmed
      await checkoutService.deductStockForOrder(orderId);

      order.paymentStatus = 'SUCCESS';
      order.status = 'Processing';
      order.razorpayPaymentId = razorpay_payment_id;

      order.statusHistory.push({
        status: 'Processing',
        note: 'Payment verified successfully via Razorpay',
      });

      await order.save();

      return res.status(200).json({
        success: true,
        message: 'Payment verified successfully',
        redirectUrl: `/user/order-success/${order._id}`,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
      });
    }
  } catch (err) {
    console.error('Verify Payment Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during verification',
    });
  }
};

/**
 * @desc    Render the payment failure page.
 * @route   GET /user/payment-failure/:id
 * @access  Private (isUser)
 */
exports.loadPaymentFailure = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.userId;

    const order = await Order.findOne({ _id: orderId, userId }).lean();
    if (!order) return res.redirect('/user/orders');

    res.render('User/payment-failure', {
      layout: false,
      orderId: order._id,
      totalAmount: order.totalAmount,
      title: 'Payment Failed | HOOF',
    });
  } catch (err) {
    console.error('Payment Failure Page Error:', err.message);
    res.redirect('/user/orders');
  }
};

/**
 * @desc    Retry payment for an existing failed/pending online order.
 * @route   POST /user/checkout/retry-payment
 * @access  Private (isUser)
 */
exports.retryPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.session.userId;

    const order = await Order.findOne({ _id: orderId, userId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.paymentStatus === 'SUCCESS') {
      return res.status(400).json({ success: false, message: 'Order is already paid' });
    }

    const razorpayOrder = await checkoutService.createRazorpayOrder(order.totalAmount, order._id);

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    const userDoc = await User.findById(userId);

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
      user: {
        name: userDoc?.fullName || req.session.userName,
        email: userDoc?.email || req.session.userEmail,
      },
    });
  } catch (err) {
    console.error('Retry Payment Error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to initiate retry payment' });
  }
};

/**
 * @desc    Render the order success receipt page.
 * @route   GET /user/order-success/:id
 * @access  Private (isUser)
 */
exports.loadOrderSuccess = async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.userId;

    const [orderDoc, userDoc] = await Promise.all([
      Order.findOne({ _id: orderId, userId }).lean(),
      User.findById(userId).lean(),
    ]);

    if (!orderDoc) return res.redirect('/user/orders');

    const createdAt = orderDoc.createdAt ? new Date(orderDoc.createdAt) : new Date();
    const estimatedDeliveryDate = new Date(createdAt);
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

    const order = {
      ...orderDoc,
      estimatedDelivery: estimatedDeliveryDate.toISOString(),
      couponCode: orderDoc.couponCode,
      discountAmount: orderDoc.discountAmount,
      items: Array.isArray(orderDoc.items)
        ? orderDoc.items.map((i) => ({
            quantity: i.quantity,
            product: {
              productName: i.productName,
              productImage: [i.productImage],
              salePrice: i.priceAtPurchase,
            },
          }))
        : [],
    };

    const user = {
      name: userDoc?.fullName || userDoc?.name || '',
    };

    res.render('User/order-success', {
      layout: false,
      order,
      user,
      title: 'Order Success | HOOF',
    });
  } catch (err) {
    console.error('Order Success Page Error:', err.message);
    res.redirect('/user/orders');
  }
};

/**
 * @desc    Get all available coupons applicable for the current user's cart.
 * @route   GET /user/available-coupons
 * @access  Private (isUser)
 */
exports.getAvailableCoupons = async (req, res) => {
  try {
    const userId = req.session.userId;
    const coupons = await checkoutService.getAvailableCoupons(userId);
    return res.status(200).json({ success: true, coupons });
  } catch (err) {
    console.error('Get Available Coupons Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch coupons',
    });
  }
};

/**
 * @desc    Apply and preview coupon discount during checkout.
 * @route   POST /user/apply-coupon
 * @access  Private (isUser)
 */
exports.applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;
    const userId = req.session.userId;
    const result = await checkoutService.applyCoupon({ userId, couponCode });
    return res.status(200).json(result);
  } catch (err) {
    console.error('Apply Coupon Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to apply coupon',
    });
  }
};
