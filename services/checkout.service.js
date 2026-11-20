/**
 * @file services/checkout.service.js
 * @description Pure business logic for checkout calculations, stock reservations, order creation, coupons, and Razorpay payments.
 */

const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require('../models/Cart');
const Address = require('../models/Address');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const walletService = require('./wallet.service');
const AppError = require('../utils/AppError');

// Initialize Razorpay client
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret',
});

class CheckoutService {
  /**
   * Prepares and audits all data required for rendering the checkout screen.
   * @param {string} userId - User ObjectId string
   * @returns {Promise<Object>} Checkout summary with items, saved addresses, and pricing
   */
  async prepareCheckout(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'category' },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    const addresses = await Address.find({ userId });

    let subtotal = 0;

    // Check for ANY invalid or out-of-stock items
    const invalidItems = cart.items.filter((item) => {
      if (!item.productId) return true; // deleted product
      const product = item.productId;
      if (product.isBlocked) return true;
      if (product.category && !product.category.isListed) return true;
      const variant = product.variants
        ? product.variants.find((v) => String(v.size) === String(item.size))
        : null;
      if (!variant || item.quantity > variant.quantity) return true;
      return false;
    });

    if (invalidItems.length > 0) {
      throw new AppError(
        'Some items in your cart are no longer available. Please remove them to proceed.',
        400
      );
    }

    const validItems = cart.items.filter((item) => item.productId);

    const cartItems = validItems.map((item) => {
      const totalPrice = item.productId.salePrice * item.quantity;
      subtotal += totalPrice;
      return {
        ...item.toObject(),
        totalPrice,
      };
    });

    const shippingCharge = subtotal > 999 ? 0 : 50;
    const totalAmount = subtotal + shippingCharge;

    return {
      cartItems,
      addresses,
      subtotal,
      shippingCharge,
      totalAmount,
    };
  }

  /**
   * Creates a formal order from the user's active shopping cart.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.addressId
   * @param {string} [params.paymentMethod="COD"] - "COD" | "upi" | "wallet"
   * @param {string|null} [params.couponCode]
   * @returns {Promise<Object>} Created Order document
   */
  async createOrder({ userId, addressId, paymentMethod = 'COD', couponCode = null }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'category' },
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    const address = await Address.findOne({ _id: addressId, userId });
    if (!address) {
      throw new AppError('Invalid shipping address selected', 400);
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product = item.productId;
      if (!product) {
        throw new AppError('A product in your cart is no longer available.', 400);
      }

      if (product.isBlocked || (product.category && !product.category.isListed)) {
        throw new AppError(
          `"${product.productName}" is currently unavailable and cannot be purchased.`,
          400
        );
      }

      const variant = product.variants
        ? product.variants.find((v) => String(v.size) === String(item.size))
        : null;

      if (!variant) {
        throw new AppError(
          `Size ${item.size} is no longer available for "${product.productName}".`,
          400
        );
      }

      if (variant.quantity < item.quantity) {
        throw new AppError(
          `Insufficient stock for "${product.productName}" (Size ${item.size}). Available: ${variant.quantity}`,
          400
        );
      }

      subtotal += product.salePrice * item.quantity;

      orderItems.push({
        productId: product._id,
        productName: product.productName,
        productImage: product.productImage ? product.productImage[0] : '',
        priceAtPurchase: product.salePrice,
        quantity: item.quantity,
        variantSize: item.size || null,
      });

      // Deduct stock immediately for COD and Wallet orders
      // For online UPI orders: stock is deducted upon Razorpay signature verification
      if (paymentMethod !== 'upi') {
        variant.quantity -= item.quantity;
        variant.status = variant.quantity > 0 ? 'Available' : 'Out of Stock';
        product.quantity -= item.quantity;
        await product.save();
      }
    }

    // Apply Coupon if supplied
    let discountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode && couponCode.trim()) {
      const coupon = await Coupon.findOne({ couponCode: couponCode.trim().toUpperCase() });
      if (coupon && coupon.isValid() && subtotal >= coupon.minPurchaseAmount) {
        appliedCouponCode = coupon.couponCode;
        if (coupon.discountType === 'percentage') {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }

        discountAmount = Math.min(discountAmount, subtotal);
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const shippingCharge = subtotal > 999 || subtotal === 0 ? 0 : 50;
    const totalAmount = subtotal - discountAmount + shippingCharge;

    // Handle Wallet payment option
    if (paymentMethod === 'wallet') {
      await walletService.debitWallet(
        userId,
        totalAmount,
        'Payment for order',
        null // Will be updated after order document creation
      );
    }

    const newOrder = new Order({
      userId,
      items: orderItems,
      shippingAddress: {
        fullName: address.fullName,
        phone: address.mobile,
        street: address.houseName,
        city: address.city,
        state: address.state,
        zip: address.pincode,
        country: 'India',
      },
      subtotal,
      shippingCharge,
      couponCode: appliedCouponCode,
      discountAmount,
      totalAmount,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentMethod === 'wallet' ? 'SUCCESS' : 'Pending',
      status: paymentMethod === 'wallet' ? 'Processing' : 'Pending',
    });

    await newOrder.save();

    // Link actual orderId to the wallet transaction record
    if (paymentMethod === 'wallet') {
      const Wallet = require('../models/Wallet');
      const wallet = await Wallet.findOne({ userId });
      if (wallet && wallet.transactions && wallet.transactions.length > 0) {
        const lastTx = wallet.transactions[wallet.transactions.length - 1];
        if (!lastTx.orderId) {
          const shortId = String(newOrder._id).slice(-8).toUpperCase();
          lastTx.orderId = newOrder._id;
          lastTx.description = `Payment for order #${shortId}`;
          await wallet.save();
        }
      }
    }

    // Clear cart upon order creation
    cart.items = [];
    await cart.save();

    return newOrder;
  }

  /**
   * Creates an order with Razorpay API.
   * @param {number} amount - Amount in INR
   * @param {string} orderId - System internal Order ID
   * @returns {Promise<Object>} Razorpay order payload
   */
  async createRazorpayOrder(amount, orderId) {
    const options = {
      amount: Math.round(amount * 100), // smallest currency unit (paise)
      currency: 'INR',
      receipt: orderId.toString(),
    };
    return await razorpayInstance.orders.create(options);
  }

  /**
   * Verifies Razorpay payment signature cryptographically.
   * @param {string} razorpayOrderId
   * @param {string} razorpayPaymentId
   * @param {string} signature
   * @returns {boolean}
   */
  verifyRazorpayPayment(razorpayOrderId, razorpayPaymentId, signature) {
    const secret = process.env.RAZORPAY_KEY_SECRET || 'dummy_razorpay_secret';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
  }

  /**
   * Deducts product and variant inventory once an online payment is verified.
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async deductStockForOrder(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      const variant = product.variants
        ? product.variants.find((v) => String(v.size) === String(item.variantSize))
        : null;

      if (variant) {
        variant.quantity -= item.quantity;
        variant.status = variant.quantity > 0 ? 'Available' : 'Out of Stock';
      }
      product.quantity -= item.quantity;
      await product.save();
    }
  }

  /**
   * Restores product stock when an order is cancelled or aborted.
   * @param {string} orderId
   * @returns {Promise<void>}
   */
  async restoreStockForOrder(orderId) {
    const order = await Order.findById(orderId);
    if (!order) throw new AppError('Order not found', 404);

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

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

  /**
   * Retrieves active coupons applicable to the user's cart subtotal.
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getAvailableCoupons(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    let subtotal = 0;
    cart.items.forEach((item) => {
      if (item.productId && !item.productId.isBlocked) {
        subtotal += item.productId.salePrice * item.quantity;
      }
    });

    const coupons = await Coupon.find({
      isActive: true,
      isBlocked: false,
      expiryDate: { $gt: new Date() },
      $expr: { $lt: ['$usedCount', '$usageLimit'] },
    });

    return coupons.filter((c) => subtotal >= c.minPurchaseAmount);
  }

  /**
   * Validates and previews coupon discount for the user's active cart.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.couponCode
   * @returns {Promise<Object>}
   */
  async applyCoupon({ userId, couponCode }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    if (!couponCode || !couponCode.trim()) {
      throw new AppError('Coupon code is required', 400);
    }

    const coupon = await Coupon.findOne({ couponCode: couponCode.trim().toUpperCase() });
    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }

    if (!coupon.isValid()) {
      throw new AppError('Coupon is expired or inactive', 400);
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || !cart.items || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    let subtotal = 0;
    cart.items.forEach((item) => {
      if (item.productId && !item.productId.isBlocked) {
        subtotal += item.productId.salePrice * item.quantity;
      }
    });

    if (subtotal < coupon.minPurchaseAmount) {
      throw new AppError(
        `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required for this coupon.`,
        400
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      success: true,
      message: 'Coupon applied successfully',
      couponCode: coupon.couponCode,
      discountAmount,
      newTotal: subtotal - discountAmount,
    };
  }
}

module.exports = new CheckoutService();
