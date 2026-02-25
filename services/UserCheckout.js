const Cart = require('../model/Cart');
const Address = require('../model/Address');
const Order = require('../model/Order');
const Product = require('../model/Product');

/**
 * @desc    Prepares data for the checkout page.
 * @param   {string} userId - ID of the user.
 * @returns {Promise<Object>} - Checkout data including items, addresses, and totals.
 */
exports.prepareCheckout = async (userId) => {
    const cart = await Cart.findOne({ userId })
        .populate('items.productId');

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
    }

    const addresses = await Address.find({ userId });

    let subtotal = 0;

    // Filter out blocked or unavailable products
    const blockedProducts = cart.items
        .filter(item => item.productId && item.productId.isBlocked)
        .map(item => item.productId.productName);

    const validItems = cart.items.filter(item => item.productId && !item.productId.isBlocked);

    const cartItems = validItems.map(item => {
        const totalPrice = item.productId.salePrice * item.quantity;
        subtotal += totalPrice;
        return {
            ...item.toObject(),
            totalPrice
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
        blockedProducts
    };
};

const Coupon = require('../model/Coupon');

/**
 * @desc    Creates a new order from the user's cart.
 * @param   {string} userId - ID of the user.
 * @param   {string} addressId - ID of the chosen shipping address.
 * @param   {string} [paymentMethod] - Method of payment (COD, upi).
 * @param   {string} [couponCode] - Optional coupon code to apply.
 * @returns {Promise<Object>} - The created order document.
 */
exports.createOrder = async (userId, addressId, paymentMethod = "COD", couponCode = null) => {
    const cart = await Cart.findOne({ userId })
        .populate('items.productId');

    if (!cart || cart.items.length === 0) {
        throw new Error("Cart empty");
    }

    const address = await Address.findOne({ _id: addressId, userId });

    if (!address) {
        throw new Error("Invalid address");
    }

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
        const product = item.productId;

        if (!product) {
            throw new Error("A product in your cart is no longer available.");
        }

        if (product.isBlocked) {
            throw new Error(`"${product.productName}" is currently blocked and cannot be purchased.`);
        }

        // Validate stock (simple version without variants)
        if (product.quantity < item.quantity) {
            throw new Error(`Insufficient stock for "${product.productName}". Available: ${product.quantity}`);
        }

        subtotal += product.salePrice * item.quantity;

        orderItems.push({
            productId: product._id,
            productName: product.productName,
            productImage: product.productImage[0],
            priceAtPurchase: product.salePrice,
            quantity: item.quantity
        });

        // Deduct stock
        product.quantity -= item.quantity;
        await product.save();
    }

    let discountAmount = 0;
    let appliedCouponCode = null;

    if (couponCode) {
        const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
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
            // Ensure discount doesn't exceed subtotal
            discountAmount = Math.min(discountAmount, subtotal);

            // Increment usage count
            coupon.usedCount += 1;
            await coupon.save();
        }
    }

    const shippingCharge = subtotal > 999 || subtotal === 0 ? 0 : 50;
    const totalAmount = subtotal - discountAmount + shippingCharge;

    const newOrder = new Order({
        userId,
        items: orderItems,
        shippingAddress: {
            fullName: address.fullName,
            phone: address.mobile,
            street: address.houseName,
            city: address.city,
            state: address.state,
            zip: address.pincode
        },
        subtotal,
        shippingCharge,
        couponCode: appliedCouponCode,
        discountAmount,
        totalAmount,
        paymentMethod: paymentMethod || "COD",
        paymentStatus: paymentMethod === "upi" ? "Pending" : "Pending",
        status: "Pending"
    });

    await newOrder.save();

    // Clear cart
    cart.items = [];
    await cart.save();

    return newOrder;
};

const Razorpay = require('razorpay');
const crypto = require('crypto');

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * @desc    Create a Razorpay order.
 * @param   {number} amount - Amount in INR.
 * @param   {string} orderId - System Order ID.
 */
exports.createRazorpayOrder = async (amount, orderId) => {
    const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency: "INR",
        receipt: orderId.toString()
    };
    return await instance.orders.create(options);
};

/**
 * @desc    Verify Razorpay payment signature.
 */
exports.verifyRazorpayPayment = (razorpayOrderId, razorpayPaymentId, signature) => {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};
