/**
 * @file services/user.service.js
 * @description Pure business logic for user management: profile data, avatar upload/removal, search, addresses, and referral reward programs.
 */

const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Product = require('../models/Product');
const ReferralConfig = require('../models/ReferralConfig');
const walletService = require('./wallet.service');
const AppError = require('../utils/AppError');

class UserService {
  /**
   * Updates basic profile details for a user.
   * @param {string} userId
   * @param {Object} updateData
   * @returns {Promise<Object>}
   */
  async updateProfileData(userId, updateData) {
    const { fullName, phoneNumber, dateOfBirth } = updateData;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        phone: phoneNumber,
        dob: dateOfBirth,
      },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    return updatedUser;
  }

  /**
   * Handles profile image upload and deletes old avatar.
   * @param {string} userId
   * @param {string} filename
   * @param {string} publicRoot
   * @returns {Promise<string>}
   */
  async updateUserProfileImage(userId, filename, publicRoot) {
    const newImagePath = `/uploads/profile/${filename}`;

    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    if (user.profileImage && user.profileImage.startsWith('/uploads/profile/')) {
      const oldPath = path.join(publicRoot, user.profileImage);
      try {
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      } catch (err) {
        console.warn('Warning: Could not delete old avatar:', err.message);
      }
    }

    user.profileImage = newImagePath;
    await user.save();
    return newImagePath;
  }

  /**
   * Removes current profile avatar.
   * @param {string} userId
   * @param {string} publicRoot
   * @returns {Promise<boolean>}
   */
  async removeUserProfileImage(userId, publicRoot) {
    const user = await User.findById(userId);
    if (!user || !user.profileImage) {
      throw new AppError('No profile image found to delete', 404);
    }

    const imagePath = path.join(publicRoot, user.profileImage);
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    } catch (fileErr) {
      console.warn('File already missing or could not be deleted:', fileErr.message);
    }

    user.profileImage = '';
    await user.save();
    return true;
  }

  // ==========================================
  // REFERRAL PROGRAM METHODS
  // ==========================================

  /**
   * Fetches data required for the customer referral program page.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getReferralPageData(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const [user, referralConfig, referredCount] = await Promise.all([
      User.findById(userId),
      ReferralConfig.getConfig(),
      User.countDocuments({ referredBy: userId }),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return { user, referralConfig, referredCount };
  }

  /**
   * Converts and withdraws customer referral points to wallet cash.
   * @param {string} userId
   * @returns {Promise<Object>} Withdrawal result with credited amount and remaining balance
   */
  async withdrawReferralPoints(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const [user, refConfig] = await Promise.all([
      User.findById(userId),
      ReferralConfig.getConfig(),
    ]);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!refConfig.isActive) {
      throw new AppError('Referral program is currently inactive', 400);
    }

    const points = user.referralPoints || 0;
    if (points < refConfig.minWithdrawPoints) {
      throw new AppError(
        `Minimum ${refConfig.minWithdrawPoints} points required to withdraw (You have ${points} points)`,
        400
      );
    }

    const pointsPerRupee = refConfig.pointsPerRupee || 100;
    const withdrawablePoints = Math.floor(points / pointsPerRupee) * pointsPerRupee;
    const rupees = withdrawablePoints / pointsPerRupee;

    if (rupees <= 0) {
      throw new AppError('Not enough points to convert to currency', 400);
    }

    // Credit funds directly to user's wallet
    await walletService.creditWallet(
      userId,
      rupees,
      `Referral reward withdrawal (${withdrawablePoints} points)`
    );

    user.referralPoints = points - withdrawablePoints;
    await user.save();

    return {
      success: true,
      message: `Successfully withdrawn ₹${rupees} to your wallet!`,
      withdrawnAmount: rupees,
      remainingPoints: user.referralPoints,
    };
  }

  /**
   * Fetches referral statistics and top referrers for the administrative dashboard.
   * @returns {Promise<Object>}
   */
  async getAdminReferralSettings() {
    const config = await ReferralConfig.getConfig();

    const totalReferrals = await User.countDocuments({ referredBy: { $ne: null } });

    const totalPointsEarned = await User.aggregate([
      { $group: { _id: null, total: { $sum: '$referralPoints' } } },
    ]);

    const topReferrers = await User.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'referredBy',
          as: 'referrals',
        },
      },
      { $addFields: { referralCount: { $size: '$referrals' } } },
      { $match: { referralCount: { $gt: 0 } } },
      { $sort: { referralCount: -1 } },
      { $limit: 10 },
      {
        $project: {
          fullName: 1,
          email: 1,
          referralCode: 1,
          referralPoints: 1,
          referralCount: 1,
        },
      },
    ]);

    return {
      config,
      stats: {
        totalReferrals,
        totalPointsEarned: totalPointsEarned[0]?.total || 0,
        topReferrers,
      },
    };
  }

  /**
   * Updates administrative referral reward policies.
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updateAdminReferralSettings(data) {
    const { pointsPerReferral, pointsPerRupee, minWithdrawPoints, isActive } = data;

    if (pointsPerReferral < 0) {
      throw new AppError('Points per referral cannot be negative', 400);
    }
    if (pointsPerRupee < 1) {
      throw new AppError('Points per rupee must be at least 1', 400);
    }
    if (minWithdrawPoints < 1) {
      throw new AppError('Minimum withdrawal points must be at least 1', 400);
    }

    const config = await ReferralConfig.getConfig();
    config.pointsPerReferral = Number(pointsPerReferral);
    config.pointsPerRupee = Number(pointsPerRupee);
    config.minWithdrawPoints = Number(minWithdrawPoints);
    config.isActive = isActive === true || isActive === 'true';
    await config.save();

    return config;
  }

  // Legacy catalog discovery delegates
  async searchProducts(searchQuery, page = 1, limit = 12) {
    const productService = require('./product.service');
    return await productService.getAllProducts({ search: searchQuery, page }, limit);
  }

  async getShopProducts(params) {
    const productService = require('./product.service');
    return await productService.getAllProducts(params, params.limit);
  }

  async getNewArrivals(limit = 6) {
    const productService = require('./product.service');
    return await productService.getNewArrivals(limit);
  }
}

module.exports = new UserService();
