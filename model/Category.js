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
    }
}, { timestamps: true });

module.exports = mongoose.model("Category", categorySchema);