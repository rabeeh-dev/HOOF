/**
 * @file routes/user/profile.routes.js
 * @description Route definitions for customer profile settings, address book management, avatar uploads, and email/password change flows.
 */

const express = require('express');
const router = express.Router();
const profileController = require('../../controllers/user/profile.controller');
const { isUser } = require('../../middlewares/auth.middleware');
const upload = require('../../middlewares/upload.middleware');

// ==========================================
// ADDRESS BOOK ROUTES
// ==========================================

/**
 * @desc    Render the dedicated address management page.
 * @route   GET /user/address
 * @access  Private (isUser)
 */
router.get('/address', isUser, profileController.getAddressPage);

/**
 * @desc    Create and save a new delivery address.
 * @route   POST /user/address/add
 * @access  Private (isUser)
 */
router.post('/address/add', isUser, profileController.addAddress);

/**
 * @desc    Update an existing delivery address.
 * @route   PUT /user/address/edit/:id
 * @access  Private (isUser)
 */
router.put('/address/edit/:id', isUser, profileController.editAddress);

/**
 * @desc    Remove a specific delivery address by ID.
 * @route   DELETE /user/address/delete/:id
 * @access  Private (isUser)
 */
router.delete('/address/delete/:id', isUser, profileController.deleteAddress);

// ==========================================
// USER PROFILE & ACCOUNT MANAGEMENT
// ==========================================

/**
 * @desc    Fetch and display user profile, addresses, and status flags.
 * @route   GET /user/profile
 * @access  Private (isUser)
 */
router.get('/profile', isUser, profileController.getProfile);

/**
 * @desc    Update text-based profile details via AJAX.
 * @route   POST /user/profile/update
 * @access  Private (isUser)
 */
router.post('/profile/update', isUser, profileController.updateProfile);

/**
 * @desc    Upload, crop, and save a new profile image.
 * @route   POST /user/profile/update-image
 * @access  Private (isUser)
 */
router.post(
  '/profile/update-image',
  isUser,
  upload.single('profileImage'),
  profileController.updateProfileImage
);

/**
 * @desc    Removes profile picture from server and database.
 * @route   DELETE /user/profile/delete-image
 * @access  Private (isUser)
 */
router.delete('/profile/delete-image', isUser, profileController.deleteProfileImage);

// ==========================================
// EMAIL & PASSWORD CHANGE FLOW
// ==========================================

/**
 * @desc    Sends verification OTP to current email to authorize change.
 * @route   GET /user/profile/change-email-start
 * @access  Private (isUser)
 */
router.get('/profile/change-email-start', isUser, profileController.getChangeEmailOtp);

/**
 * @desc    Render the form to submit new email address.
 * @route   GET /user/profile/change-email-form
 * @access  Private (isUser)
 */
router.get('/profile/change-email-form', isUser, profileController.renderChangeEmailForm);

/**
 * @desc    Sends verification OTP to the NEW email address.
 * @route   POST /user/profile/change-email-new-otp
 * @access  Private (isUser)
 */
router.post('/profile/change-email-new-otp', isUser, profileController.sendNewEmailOtp);

/**
 * @desc    Initiates password change via reset link sent to registered email.
 * @route   GET /user/profile/change-password-request
 * @access  Private (isUser)
 */
router.get('/profile/change-password-request', isUser, profileController.changePasswordRequest);

module.exports = router;
