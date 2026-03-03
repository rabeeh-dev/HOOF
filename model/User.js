/**
 * @file model/User.js
 * @description Mongoose schema for user accounts.
 */

const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    minlength: 2,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true,
  },
  password: {
    type: String,
    minlength: 8,
    select: false, // Never return password by default
  },
  resetPasswordToken: {
    type: String,
  },
  resetPasswordExpires: {
    type: Date,
  },
  authProvider: {
    type: String,
    enum: ["local", "google"],
    required: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    type: String,
    default: ""
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  phone: {
    type: String
  },
  dob: {
    type: Date
  },
  // Referral system fields
  referralCode: {
    type: String,
    unique: true,
    sparse: true,
    index: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  referralPoints: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

/**
 * Pre-validation hook to ensure password requirements for local users.
 */
userSchema.pre("validate", async function () {
  // Only require password when creating a NEW local user
  if (this.isNew && this.authProvider === "local" && !this.password) {
    throw new Error("Password is required");
  }

  // Google users never store a password
  if (this.authProvider === "google") {
    this.password = undefined;
  }
});

/**
 * Pre-save hook to auto-generate a unique referral code for new users.
 */
userSchema.pre("save", async function () {
  if (this.isNew && !this.referralCode) {
    let code;
    let isUnique = false;
    while (!isUnique) {
      code = crypto.randomBytes(4).toString("hex").toUpperCase(); // 8-char hex
      const existing = await mongoose.model("User").findOne({ referralCode: code });
      if (!existing) isUnique = true;
    }
    this.referralCode = code;
  }
});

module.exports = mongoose.model("User", userSchema);
