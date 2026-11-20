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
  action: {
    type: String,
    enum: ['SIGNUP', 'PASSWORD_RESET', 'EMAIL_CHANGE_OLD', 'EMAIL_CHANGE_NEW'],
    default: 'SIGNUP',
    index: true
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
  },
  attempts: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.models.Otp || mongoose.model("Otp", otpSchema);
