/**
 * @file controllers/admin/coupon.controller.js
 * @description Controller handling administrative coupon management: listing, creation, updates, and active/blocked status toggles.
 */

const couponService = require('../../services/coupon.service');

/**
 * @desc    Load the coupon management page.
 * @route   GET /admin/coupons
 * @access  Private (isAdminLogin)
 */
exports.loadCoupons = async (req, res) => {
  try {
    const coupons = await couponService.getAllCoupons();
    res.render('Admin/coupon-management', {
      coupons,
      title: 'Coupon Management | HOOF Admin',
      layout: false,
    });
  } catch (err) {
    console.error('Load Coupons Error:', err.message);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * @desc    Add a new promo coupon.
 * @route   POST /admin/coupons/add
 * @access  Private (isAdminLogin)
 */
exports.addCoupon = async (req, res) => {
  try {
    await couponService.createCoupon(req.body);
    return res.status(200).json({ success: true, message: 'Coupon added successfully' });
  } catch (err) {
    console.error('Add Coupon Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to add coupon',
    });
  }
};

/**
 * @desc    Update an existing coupon.
 * @route   PATCH /admin/coupons/edit/:id
 * @access  Private (isAdminLogin)
 */
exports.updateCoupon = async (req, res) => {
  try {
    const couponId = req.params.id;
    const updatedCoupon = await couponService.updateCoupon(couponId, req.body);

    const io = req.app.get('io');
    if (io) {
      io.emit('coupon:statusChanged', {
        couponCode: updatedCoupon.couponCode,
        isBlocked: updatedCoupon.isBlocked,
        expiryDate: updatedCoupon.expiryDate,
      });
    }

    return res.status(200).json({ success: true, message: 'Coupon updated successfully' });
  } catch (err) {
    console.error('Update Coupon Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to update coupon',
    });
  }
};

/**
 * @desc    Toggle coupon blocked status.
 * @route   PATCH /admin/coupons/toggle-status/:id
 * @access  Private (isAdminLogin)
 */
exports.toggleCouponStatus = async (req, res) => {
  try {
    const couponId = req.params.id;
    const coupon = await couponService.toggleCouponStatus(couponId);

    const io = req.app.get('io');
    if (io) {
      io.emit('coupon:statusChanged', {
        couponCode: coupon.couponCode,
        isBlocked: coupon.isBlocked,
        expiryDate: coupon.expiryDate,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.isBlocked ? 'blocked' : 'unblocked'} successfully`,
      isBlocked: coupon.isBlocked,
    });
  } catch (err) {
    console.error('Toggle Coupon Status Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to update status',
    });
  }
};

/**
 * @desc    Get single coupon details for editing modal.
 * @route   GET /admin/coupons/:id
 * @access  Private (isAdminLogin)
 */
exports.getCoupon = async (req, res) => {
  try {
    const coupon = await couponService.getCouponById(req.params.id);
    return res.status(200).json({ success: true, coupon });
  } catch (err) {
    console.error('Get Coupon Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Failed to fetch coupon details',
    });
  }
};
