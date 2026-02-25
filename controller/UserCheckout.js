const User = require("../model/User");
const Order = require("../model/Order");
const checkoutService = require("../services/UserCheckout");

/**
 * @desc    Render the checkout page.
 * @route   GET /user/checkout
 */
exports.loadCheckout = async (req, res) => {
    try {
        const userId = req.session.userId;
        const data = await checkoutService.prepareCheckout(userId);

        // If all items are blocked/unavailable, redirect to cart
        if (!data.cartItems || data.cartItems.length === 0) {
            return res.redirect('/user/cart?unavailable=1');
        }

        res.render('User/checkout', data);
    } catch (err) {
        console.error("Load checkout error:", err);
        res.redirect('/user/cart');
    }
};

/**
 * @desc    Process order placement (Form submission/Redirect).
 * @route   POST /user/checkout
 */
exports.placeOrder = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, couponCode } = req.body;
        const order = await checkoutService.createOrder(userId, addressId, couponCode);
        res.redirect(`/user/order-success/${order._id}`);
    } catch (err) {
        console.error("Place order error:", err);
        res.redirect('/user/checkout');
    }
};

/**
 * @desc    Process order placement via AJAX.
 * @route   POST /user/checkout/place-order
 */
exports.placeOrderApi = async (req, res) => {
    try {
        const userId = req.session.userId;
        const { addressId, couponCode, paymentMethod } = req.body || {};

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Please select a delivery address." });
        }

        const order = await checkoutService.createOrder(userId, addressId, paymentMethod, couponCode);

        // If UPI, create Razorpay order
        if (paymentMethod === "upi") {
            try {
                const razorpayOrder = await checkoutService.createRazorpayOrder(order.totalAmount, order._id);

                // Save razorpay order ID to our order
                order.razorpayOrderId = razorpayOrder.id;
                await order.save();

                return res.status(200).json({
                    success: true,
                    paymentMethod: "upi",
                    razorpayOrderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    keyId: process.env.RAZORPAY_KEY_ID,
                    orderId: order._id, // Our internal ID
                    user: {
                        name: req.session.userName,
                        email: req.session.userEmail
                    }
                });
            } catch (rzpErr) {
                console.error("Razorpay order creation failed:", rzpErr);
                // Return 200 but notify frontend that payment init failed
                return res.status(200).json({
                    success: false,
                    message: "Payment initialization failed. Please try again or use COD."
                });
            }
        }

        return res.status(200).json({
            success: true,
            redirectUrl: `/user/order-success/${order._id}`
        });
    } catch (err) {
        console.error("Place order API error:", err);
        return res.status(500).json({
            success: false,
            message: err?.message || "Failed to place order."
        });
    }
};

/**
 * @desc    Verify Razorpay payment.
 * @route   POST /user/checkout/verify-payment
 */
exports.verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

        const isVerified = checkoutService.verifyRazorpayPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature);

        if (isVerified) {
            const order = await Order.findById(orderId);
            if (!order) return res.status(404).json({ success: false, message: "Order not found" });

            order.paymentStatus = "SUCCESS";
            order.status = "Processing";
            order.razorpayPaymentId = razorpay_payment_id;

            // Add to status history
            order.statusHistory.push({
                status: "Processing",
                note: "Payment verified successfully via Razorpay"
            });

            await order.save();

            return res.status(200).json({
                success: true,
                message: "Payment verified successfully",
                redirectUrl: `/user/order-success/${order._id}`
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Payment verification failed"
            });
        }
    } catch (err) {
        console.error("Verify payment error:", err);
        return res.status(500).json({ success: false, message: "Internal server error during verification" });
    }
};

/**
 * @desc    Render the payment failure page.
 * @route   GET /user/payment-failure/:id
 */
exports.loadPaymentFailure = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.userId;

        const order = await Order.findOne({ _id: orderId, userId }).lean();
        if (!order) return res.redirect("/user/orders");

        res.render("User/payment-failure", {
            layout: false,
            orderId: order._id,
            totalAmount: order.totalAmount,
            title: "Payment Failed | HOOF"
        });
    } catch (err) {
        console.error("Payment failure page error:", err);
        res.redirect("/user/orders");
    }
};

/**
 * @desc    Retry payment for an existing order.
 * @route   POST /user/checkout/retry-payment
 */
exports.retryPayment = async (req, res) => {
    try {
        const { orderId } = req.body;
        const userId = req.session.userId;

        const order = await Order.findOne({ _id: orderId, userId });
        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (order.paymentStatus === "SUCCESS") {
            return res.status(400).json({ success: false, message: "Order is already paid" });
        }

        // Create new Razorpay order for existing order
        const razorpayOrder = await checkoutService.createRazorpayOrder(order.totalAmount, order._id);

        // Update order with new razorpay ID
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
                email: userDoc?.email || req.session.userEmail
            }
        });
    } catch (err) {
        console.error("Retry payment error:", err);
        return res.status(500).json({ success: false, message: "Failed to initiate retry payment" });
    }
};

/**
 * @desc    Render the order success page.
 * @route   GET /user/order-success/:id
 */
exports.loadOrderSuccess = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.userId;

        const [orderDoc, userDoc] = await Promise.all([
            Order.findOne({ _id: orderId, userId }).lean(),
            User.findById(userId).lean()
        ]);

        if (!orderDoc) return res.redirect("/user/orders");

        const createdAt = orderDoc.createdAt ? new Date(orderDoc.createdAt) : new Date();
        const estimatedDeliveryDate = new Date(createdAt);
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

        const order = {
            ...orderDoc,
            estimatedDelivery: estimatedDeliveryDate.toISOString(),
            couponCode: orderDoc.couponCode,
            discountAmount: orderDoc.discountAmount,
            items: Array.isArray(orderDoc.items)
                ? orderDoc.items.map(i => ({
                    quantity: i.quantity,
                    product: {
                        productName: i.productName,
                        productImage: [i.productImage],
                        salePrice: i.priceAtPurchase
                    }
                }))
                : []
        };

        const user = {
            name: userDoc?.fullName || userDoc?.name || ""
        };

        res.render("User/order-success", {
            layout: false,
            order,
            user,
            title: "Order Success | HOOF"
        });
    } catch (err) {
        console.error("Order success page error:", err);
        res.redirect("/user/orders");
    }
};
