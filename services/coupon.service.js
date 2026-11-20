/**
 * @file services/coupon.service.js
 * @description Pure business logic for promo coupons: admin CRUD, toggle status, and checkout validation.
 */

const Coupon = require('../models/Coupon');
const AppError = require('../utils/AppError');

class CouponService {
  /**
   * Fetches all coupons sorted by newest first.
   * @returns {Promise<Array>}
   */
  async getAllCoupons() {
    return await Coupon.find().sort({ createdAt: -1 }).lean();
  }

  /**
   * Fetches a single coupon by its MongoDB ID.
   * @param {string} couponId
   * @returns {Promise<Object>}
   */
  async getCouponById(couponId) {
    if (!couponId || !couponId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid coupon ID format', 400);
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }
    return coupon;
  }

  /**
   * Creates a new promo coupon.
   * @param {Object} data
   * @returns {Promise<Object>} Created coupon
   */
  async createCoupon(data) {
    const {
      couponCode,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      expiryDate,
      usageLimit,
    } = data;

    if (!couponCode || !description || isNaN(discountValue) || !expiryDate) {
      throw new AppError('Missing or invalid required coupon fields', 400);
    }

    const normalizedCode = couponCode.trim().toUpperCase();

    const existingCoupon = await Coupon.findOne({ couponCode: normalizedCode });
    if (existingCoupon) {
      throw new AppError('Coupon code already exists', 400);
    }

    const newCoupon = new Coupon({
      couponCode: normalizedCode,
      description: description.trim(),
      discountType: discountType || 'percentage',
      discountValue: Number(discountValue),
      minPurchaseAmount: Number(minPurchaseAmount) || 0,
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      expiryDate: new Date(expiryDate),
      usageLimit: Number(usageLimit) || 1,
    });

    await newCoupon.save();
    return newCoupon;
  }

  /**
   * Updates an existing coupon by ID.
   * @param {string} couponId
   * @param {Object} updates
   * @returns {Promise<Object>} Updated coupon
   */
  async updateCoupon(couponId, updates) {
    if (!couponId || !couponId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid coupon ID format', 400);
    }

    const updatePayload = { ...updates };
    if (updatePayload.couponCode) {
      updatePayload.couponCode = updatePayload.couponCode.trim().toUpperCase();
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(couponId, updatePayload, { returnDocument: 'after' });
    if (!updatedCoupon) {
      throw new AppError('Coupon not found', 404);
    }

    return updatedCoupon;
  }

  /**
   * Toggles the blocked status of a coupon.
   * @param {string} couponId
   * @returns {Promise<Object>} Updated coupon
   */
  async toggleCouponStatus(couponId) {
    if (!couponId || !couponId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid coupon ID format', 400);
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      throw new AppError('Coupon not found', 404);
    }

    coupon.isBlocked = !coupon.isBlocked;
    await coupon.save();
    return coupon;
  }

  /**
   * Validates a coupon code against an active subtotal and calculates discount.
   * @param {Object} params
   * @param {string} params.couponCode
   * @param {number} params.subtotal
   * @returns {Promise<Object>}
   */
  async validateCoupon({ couponCode, subtotal }) {
    if (!couponCode || !couponCode.trim()) {
      throw new AppError('Coupon code is required', 400);
    }

    const coupon = await Coupon.findOne({ couponCode: couponCode.trim().toUpperCase() });
    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }

    if (!coupon.isValid()) {
      throw new AppError('Coupon is expired or inactive', 400);
    }

    if (subtotal < coupon.minPurchaseAmount) {
      throw new AppError(
        `Minimum purchase amount of ₹${coupon.minPurchaseAmount} required for this coupon.`,
        400
      );
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      valid: true,
      coupon,
      discountAmount,
    };
  }
}

module.exports = new CouponService();
