/**
 * @file model/ReferralConfig.js
 * @description Singleton model for referral program configuration.
 * Only one document should exist — use ReferralConfig.getConfig() to retrieve or create it.
 */

const mongoose = require('mongoose');

const referralConfigSchema = new mongoose.Schema({
  pointsPerReferral: {
    type: Number,
    default: 10,
    min: 0,
  },
  pointsPerRupee: {
    type: Number,
    default: 100,
    min: 1,
  },
  minWithdrawPoints: {
    type: Number,
    default: 100,
    min: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

/**
 * Static method to get the singleton config document.
 * Creates one with defaults if it doesn't exist.
 * @returns {Promise<Object>} The referral configuration document.
 */
referralConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({});
  }
  return config;
};

module.exports = mongoose.model('ReferralConfig', referralConfigSchema);
