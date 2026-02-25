const Coupon = require("../model/Coupon");

/**
 * @desc    Load the coupon management page.
 * @route   GET /admin/coupons
 * @access  Private (Admin Only)
 */
exports.loadCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.render("Admin/coupon-management", {
            coupons,
            title: "Coupon Management | HOOF Admin",
            layout: false
        });
    } catch (err) {
        console.error("Load coupons error:", err);
        res.status(500).send("Internal Server Error");
    }
};

/**
 * @desc    Add a new coupon.
 * @route   POST /admin/coupons/add
 * @access  Private (Admin Only)
 */
exports.addCoupon = async (req, res) => {
    try {
        const {
            couponCode,
            description,
            discountType,
            discountValue,
            minPurchaseAmount,
            maxDiscountAmount,
            expiryDate,
            usageLimit
        } = req.body;

        // Basic validation
        if (!couponCode || !description || isNaN(discountValue) || !expiryDate) {
            return res.status(400).json({ success: false, message: "Missing or invalid required fields" });
        }

        const existingCoupon = await Coupon.findOne({ couponCode: couponCode.toUpperCase() });
        if (existingCoupon) {
            return res.status(400).json({ success: false, message: "Coupon code already exists" });
        }

        const newCoupon = new Coupon({
            couponCode: couponCode.toUpperCase(),
            description,
            discountType,
            discountValue,
            minPurchaseAmount: minPurchaseAmount || 0,
            maxDiscountAmount: maxDiscountAmount || undefined,
            expiryDate: new Date(expiryDate),
            usageLimit: usageLimit || 1
        });

        await newCoupon.save();
        res.status(200).json({ success: true, message: "Coupon added successfully" });
    } catch (err) {
        console.error("Add coupon error:", err);
        res.status(500).json({ success: false, message: "Failed to add coupon" });
    }
};

/**
 * @desc    Update an existing coupon.
 * @route   PATCH /admin/coupons/edit/:id
 * @access  Private (Admin Only)
 */
exports.updateCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;
        const updates = req.body;

        if (updates.couponCode) {
            updates.couponCode = updates.couponCode.toUpperCase();
        }

        const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updates, { new: true });

        if (!updatedCoupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        res.status(200).json({ success: true, message: "Coupon updated successfully" });
    } catch (err) {
        console.error("Update coupon error:", err);
        res.status(500).json({ success: false, message: "Failed to update coupon" });
    }
};

/**
 * @desc    Toggle coupon blocked status.
 * @route   PATCH /admin/coupons/toggle-status/:id
 * @access  Private (Admin Only)
 */
exports.toggleCouponStatus = async (req, res) => {
    try {
        const couponId = req.params.id;
        const coupon = await Coupon.findById(couponId);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }

        coupon.isBlocked = !coupon.isBlocked;
        await coupon.save();

        res.status(200).json({
            success: true,
            message: `Coupon ${coupon.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            isBlocked: coupon.isBlocked
        });
    } catch (err) {
        console.error("Toggle coupon status error:", err);
        res.status(500).json({ success: false, message: "Failed to update status" });
    }
};

/**
 * @desc    Get single coupon details (for editing).
 * @route   GET /admin/coupons/:id
 * @access  Private (Admin Only)
 */
exports.getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findById(req.params.id);
        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found" });
        }
        res.status(200).json({ success: true, coupon });
    } catch (err) {
        console.error("Get coupon error:", err);
        res.status(500).json({ success: false, message: "Failed to fetch coupon details" });
    }
};
