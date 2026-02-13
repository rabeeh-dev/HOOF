/**
 * @file model/User.js
 * @description Mongoose schema for user accounts.
 */

const mongoose = require("mongoose");

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

module.exports = mongoose.model("User", userSchema);
