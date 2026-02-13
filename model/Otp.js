/**
 * @file model/Otp.js
 * @description Mongoose schema for One-Time Passwords used in authentication flows.
 */

const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index for automatic deletion
  },
  lastSentAt: {
    type: Date,
    required: true,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("Otp", otpSchema);
