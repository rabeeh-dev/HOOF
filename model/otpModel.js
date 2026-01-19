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
    index: { expires: 0 }
  },
  lastSentAt: {
  type: Date,
  required: true,
  default: Date.now
}
});

module.exports = mongoose.model("Otp", otpSchema);
