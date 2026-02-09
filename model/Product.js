const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    productName: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Links to the Category model
        required: true
    },
    regularPrice: {
        type: Number,
        required: true
    },
    salePrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    productImage: {
        type: [String], // Array to store multiple image paths
        required: true
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ["Available", "Out of Stock", "Discontinued"],
        default: "Available"
    }
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);