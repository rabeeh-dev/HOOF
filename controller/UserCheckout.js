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
        const { addressId, couponCode } = req.body || {};

        if (!addressId) {
            return res.status(400).json({ success: false, message: "Please select a delivery address." });
        }

        const order = await checkoutService.createOrder(userId, addressId, couponCode);

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
