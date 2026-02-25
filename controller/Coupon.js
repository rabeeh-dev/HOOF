const Coupon = require("../model/Coupon");
const Cart = require("../model/Cart");

/**
 * @desc    Get all available coupons for the current user/cart.
 * @route   GET /user/available-coupons
 */
exports.getAvailableCoupons = async (req, res) => {
    try {
        const userId = req.session.userId;
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        // Calculate subtotal using salePrice of populated products
        let subtotal = 0;
        cart.items.forEach(item => {
            if (item.productId && !item.productId.isBlocked) {
                subtotal += item.productId.salePrice * item.quantity;
            }
        });

        // Find active and non-blocked coupons that haven't expired
        const coupons = await Coupon.find({
            isActive: true,
            isBlocked: false,
            expiryDate: { $gt: new Date() },
            $expr: { $lt: ["$usedCount", "$usageLimit"] }
        });

        // Optionally filter by minPurchaseAmount here (to show only applicable coupons)
        const applicableCoupons = coupons.filter(c => subtotal >= c.minPurchaseAmount);

        res.status(200).json({ success: true, coupons: applicableCoupons });
    } catch (err) {
        console.error("Get available coupons error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch coupons" });
    }
};

/**
 * @desc    Apply a coupon to the cart.
 * @route   POST /user/apply-coupon
 */
exports.applyCoupon = async (req, res) => {
    try {
        const { couponCode } = req.body;
        const userId = req.session.userId;

        if (!couponCode) {
            return res.status(400).json({ success: false, message: "Coupon code is required" });
        }

        const coupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid coupon code" });
        }

        if (!coupon.isValid()) {
            return res.status(400).json({ success: false, message: "Coupon is expired or inactive" });
        }

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }

        // Calculate subtotal
        let subtotal = 0;
        cart.items.forEach(item => {
            if (item.productId && !item.productId.isBlocked) {
                subtotal += item.productId.salePrice * item.quantity;
            }
        });

        if (subtotal < coupon.minPurchaseAmount) {
            return res.status(400).json({
                success: false,
                message: `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required for this coupon.`
            });
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

        // Ensure discount doesn't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        res.status(200).json({
            success: true,
            message: "Coupon applied successfully",
            couponCode: coupon.couponCode,
            discountAmount,
            newTotal: subtotal - discountAmount
        });
    } catch (err) {
        console.error("Apply coupon error:", err);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};
