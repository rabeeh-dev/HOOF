/**
 * @file model/Category.js
 * @description Mongoose schema for product categories.
 */

const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    isListed: {
        type: Boolean,
        default: true
    },
    categoryOffer: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);