/**
 * @file controller/api/Account.js
 * @description API Controller for customer accounts (Profile updates, password modifications, orders listings, reviews CRUD, referral stats).
 * Returns pure JSON responses suitable for the React frontend.
 */

const User = require("../../model/User");
const Order = require("../../model/Order");
const Review = require("../../model/Review");
const ReferralConfig = require("../../model/ReferralConfig");
const userService = require("../../services/User");
const bcrypt = require("bcrypt");

/**
 * @desc    Get the current user's profile details.
 * @route   GET /api/user/profile
 * @access  Private (isUser)
 */
exports.getProfileDetails = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select("-password -resetPasswordToken -resetPasswordExpires");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.status(200).json({ success: true, user });
    } catch (err) {
        console.error("API getProfileDetails error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * @desc    Update text-based profile details.
 * @route   PUT /api/user/profile/update
 * @access  Private (isUser)
 */
exports.updateProfileDetails = async (req, res) => {
    try {
        const { fullName, phoneNumber, dateOfBirth } = req.body;
        if (!fullName || fullName.trim().length < 2) {
            return res.status(400).json({ success: false, message: "Name must be at least 2 characters." });
        }

        const updatedUser = await userService.updateProfileData(req.session.userId, {
            fullName,
            phoneNumber,
            dateOfBirth
        });

        req.session.userName = updatedUser.fullName;

        return res.status(200).json({ 
            success: true, 
            message: "Profile updated successfully!",
            user: {
                fullName: updatedUser.fullName,
                phoneNumber: updatedUser.phoneNumber,
                dateOfBirth: updatedUser.dateOfBirth
            }
        });
    } catch (err) {
        console.error("API updateProfileDetails error:", err);
        return res.status(500).json({ success: false, message: err.message || "Failed to update profile." });
    }
};

/**
 * @desc    Update password directly.
 * @route   POST /api/user/profile/change-password
 * @access  Private (isUser)
 */
exports.changePasswordDirect = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.session.userId;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: "Both current and new passwords are required." });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
        }

        const user = await User.findById(userId).select("+password");
        if (!user || user.authProvider !== "local") {
            return res.status(400).json({ success: false, message: "Password modifications not supported for social logins." });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Current password entered is incorrect." });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save({ validateBeforeSave: false });

        return res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (err) {
        console.error("API changePasswordDirect error:", err);
        return res.status(500).json({ success: false, message: "Failed to update password." });
    }
};

/**
 * @desc    List customer order history (excluding UPI pending items).
 * @route   GET /api/user/orders
 * @access  Private (isUser)
 */
exports.getCustomerOrders = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orders = await Order.find({
            userId,
            $nor: [{ paymentMethod: 'upi', paymentStatus: 'Pending' }]
        }).sort({ createdAt: -1 });

        return res.status(200).json({ success: true, orders });
    } catch (err) {
        console.error("API getCustomerOrders error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch orders list" });
    }
};

/**
 * @desc    Get detailed single order items, populating with associated reviews.
 * @route   GET /api/user/orders/:id
 * @access  Private (isUser)
 */
exports.getCustomerOrderDetails = async (req, res) => {
    try {
        const userId = req.session.userId;
        const orderId = req.params.id;

        if (!orderId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: "Invalid order ID format" });
        }

        const orderDoc = await Order.findOne({ _id: orderId, userId })
            .populate({
                path: 'items.productId',
                select: 'productName productImage salePrice regularPrice category',
                populate: { path: 'category', select: 'name' }
            })
            .lean();

        if (!orderDoc) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Fetch user reviews on products in this order
        const productIds = orderDoc.items.map(item => item.productId?._id);
        const reviews = await Review.find({ userId, productId: { $in: productIds } });

        const items = orderDoc.items.map(item => {
            const hasReviewed = reviews.some(r => r.productId.toString() === item.productId?._id.toString());
            const userReview = reviews.find(r => r.productId.toString() === item.productId?._id.toString());
            return {
                ...item,
                product: item.productId || {},
                itemStatus: item.itemStatus || orderDoc.status,
                hasReviewed,
                review: userReview ? {
                    _id: userReview._id,
                    rating: userReview.rating,
                    comment: userReview.comment
                } : null
            };
        });

        const order = {
            ...orderDoc,
            items
        };

        return res.status(200).json({ success: true, order });
    } catch (err) {
        console.error("API getCustomerOrderDetails error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch order details" });
    }
};

/**
 * @desc    Get user's referral stats.
 * @route   GET /api/user/referral
 * @access  Private (isUser)
 */
exports.getReferralStats = async (req, res) => {
    try {
        const userId = req.session.userId;
        const user = await User.findById(userId);
        const referredCount = await User.countDocuments({ referredBy: userId });
        const referralConfig = await ReferralConfig.getConfig();

        return res.status(200).json({
            success: true,
            referralCode: user?.referralCode || "",
            referralPoints: user?.referralPoints || 0,
            referredCount,
            pointsPerRupee: referralConfig.pointsPerRupee || 100,
            minWithdrawPoints: referralConfig.minWithdrawPoints || 100,
            pointsPerReferral: referralConfig.pointsPerReferral || 10
        });
    } catch (err) {
        console.error("API getReferralStats error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch referral stats" });
    }
};

/**
 * @desc    Submit a product review.
 * @route   POST /api/user/product/:id/review
 * @access  Private (isUser)
 */
exports.addReviewApi = async (req, res) => {
    try {
        const productId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.session.userId;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: "Rating and comment are required." });
        }

        const deliveredStatuses = ['DELIVERED', 'Return Requested', 'Return Approved', 'Returned'];
        const hasPurchased = await Order.exists({
            userId,
            'items.productId': productId,
            status: { $in: deliveredStatuses }
        });

        if (!hasPurchased) {
            return res.status(403).json({ success: false, message: "You can only review products you have purchased." });
        }

        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "You have already reviewed this product." });
        }

        const newReview = new Review({
            userId,
            productId,
            rating: parseInt(rating),
            comment: comment.trim()
        });

        await newReview.save();
        return res.status(200).json({ success: true, message: "Review added successfully!" });
    } catch (err) {
        console.error("API addReviewApi error:", err);
        return res.status(500).json({ success: false, message: "Failed to add review" });
    }
};

/**
 * @desc    Edit an existing review.
 * @route   PUT /api/user/review/:id
 * @access  Private (isUser)
 */
exports.editReviewApi = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const { rating, comment } = req.body;
        const userId = req.session.userId;

        if (!rating || !comment) {
            return res.status(400).json({ success: false, message: "Rating and comment are required." });
        }

        const review = await Review.findOneAndUpdate(
            { _id: reviewId, userId },
            { rating: parseInt(rating), comment: comment.trim() },
            { new: true }
        );

        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found or unauthorized" });
        }

        return res.status(200).json({ success: true, message: "Review updated successfully!", review });
    } catch (err) {
        console.error("API editReviewApi error:", err);
        return res.status(500).json({ success: false, message: "Failed to update review" });
    }
};

/**
 * @desc    Delete an existing review.
 * @route   DELETE /api/user/review/:id
 * @access  Private (isUser)
 */
exports.deleteReviewApi = async (req, res) => {
    try {
        const reviewId = req.params.id;
        const userId = req.session.userId;

        const review = await Review.findOneAndDelete({ _id: reviewId, userId });
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found or unauthorized" });
        }

        return res.status(200).json({ success: true, message: "Review deleted successfully!" });
    } catch (err) {
        console.error("API deleteReviewApi error:", err);
        return res.status(500).json({ success: false, message: "Failed to delete review" });
    }
};
