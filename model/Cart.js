/**
 * @file model/Cart.js
 * @description Mongoose schema for user shopping carts.
 */

const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            default: 1,
            min: 1,
        },
        size: {
            type: String, // Store size variant
            required: false // Optional for backward compatibility or non-sized products
        },
    }],
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
