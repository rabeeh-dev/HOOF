/**
 * @file model/Wishlist.js
 * @description Mongoose schema for user wishlists.
 */

const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    }],
}, { timestamps: true });

module.exports = mongoose.model("Wishlist", wishlistSchema);
