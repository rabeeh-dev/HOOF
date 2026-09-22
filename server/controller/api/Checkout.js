/**
 * @file controller/api/Checkout.js
 * @description API Controller for checkout preparations, address lookups, wallet details, and order info.
 * Returns pure JSON responses suitable for the React frontend.
 */

const User = require("../../model/User");
const Order = require("../../model/Order");
const Address = require("../../model/Address");
const checkoutService = require("../../services/UserCheckout");
const walletService = require("../../services/Wallet");

/**
 * @desc    Get details needed for rendering the checkout form.
 * @route   GET /api/user/checkout
 * @access  Private (isUser)
 */
exports.getCheckoutDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const data = await checkoutService.prepareCheckout(userId);

        // Fetch wallet balance
        const wallet = await walletService.getWallet(userId);
        data.walletBalance = wallet.balance;

        return res.status(200).json({
            success: true,
            checkout: {
                cartItems: data.cartItems,
                addresses: data.addresses,
                subtotal: data.subtotal,
                shippingCharge: data.shippingCharge,
                totalAmount: data.totalAmount,
                walletBalance: data.walletBalance
            }
        });
    } catch (err) {
        console.error("API getCheckoutDetails error:", err);
        const status = err.message === "Cart is empty" || err.message.includes("no longer available") ? 400 : 500;
        return res.status(status).json({ success: false, message: err.message || "Failed to prepare checkout" });
    }
};

/**
 * @desc    Get details of a single order (for success/failed pages).
 * @route   GET /api/user/order/:id
 * @access  Private (isUser)
 */
exports.getOrderDetails = async (req, res) => {
    try {
        const orderId = req.params.id;
        const userId = req.session.userId;

        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: "Invalid order ID format" });
        }

        const [orderDoc, userDoc] = await Promise.all([
            Order.findOne({ _id: orderId, userId }).lean(),
            User.findById(userId).lean()
        ]);

        if (!orderDoc) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const createdAt = orderDoc.createdAt ? new Date(orderDoc.createdAt) : new Date();
        const estimatedDeliveryDate = new Date(createdAt);
        estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + 5);

        const order = {
            ...orderDoc,
            estimatedDelivery: estimatedDeliveryDate.toISOString(),
            items: Array.isArray(orderDoc.items)
                ? orderDoc.items.map(i => ({
                    quantity: i.quantity,
                    size: i.size,
                    product: {
                        productName: i.productName,
                        productImage: [i.productImage],
                        salePrice: i.priceAtPurchase
                    }
                }))
                : []
        };

        return res.status(200).json({
            success: true,
            order,
            user: {
                name: userDoc?.fullName || userDoc?.name || "Customer"
            }
        });
    } catch (err) {
        console.error("API getOrderDetails error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch order details" });
    }
};

/**
 * @desc    Get user's wallet details (balance, history).
 * @route   GET /api/user/wallet
 * @access  Private (isUser)
 */
exports.getWalletDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const wallet = await walletService.getWallet(userId);
        return res.status(200).json({ success: true, balance: wallet.balance, history: wallet.history });
    } catch (err) {
        console.error("API getWalletDetails error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch wallet details" });
    }
};

/**
 * @desc    List addresses for the logged-in user.
 * @route   GET /api/user/addresses
 * @access  Private (isUser)
 */
exports.getUserAddresses = async (req, res) => {
    try {
        const userId = req.session.userId;
        const addresses = await Address.find({ userId }).sort({ isDefault: -1, createdAt: -1 });
        return res.status(200).json({ success: true, addresses });
    } catch (err) {
        console.error("API getUserAddresses error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch addresses" });
    }
};
