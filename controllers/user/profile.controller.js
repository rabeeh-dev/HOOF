/**
 * @file controllers/user/profile.controller.js
 * @description Controller handling customer profile management, address book CRUD operations, avatar management, and email/password change requests.
 */

const path = require('path');
const crypto = require('crypto');
const userService = require('../../services/user.service');
const authService = require('../../services/auth.service');
const { sendResetPasswordEmail } = require('../../utils/sendEmail');
const User = require('../../models/User');

// ==========================================
// ADDRESS BOOK CONTROLLER METHODS
// ==========================================

/**
 * @desc    Render the customer address management page.
 * @route   GET /user/address
 * @access  Private (isUser)
 */
exports.getAddressPage = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/user/login');

    const { user, addresses } = await userService.getAddressPageData(userId);

    res.render('User/user-address', {
      user,
      addresses,
      title: 'My Addresses | HOOF',
      layout: 'layouts/user',
    });
  } catch (err) {
    console.error('Address Page Error:', err.message);
    res.redirect('/user/profile');
  }
};

/**
 * @desc    Add and validate a new customer delivery address.
 * @route   POST /user/address/add
 * @access  Private (isUser)
 */
exports.addAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const newAddress = await userService.addAddress(userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Address added successfully!',
      address: {
        _id: newAddress._id,
        fullName: newAddress.fullName,
        mobile: newAddress.mobile,
        houseName: newAddress.houseName,
        city: newAddress.city,
        state: newAddress.state,
        pincode: newAddress.pincode,
        addressType: newAddress.addressType,
        isDefault: newAddress.isDefault,
      },
    });
  } catch (error) {
    console.error('Add Address Error:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to add address.',
    });
  }
};

/**
 * @desc    Update an existing customer delivery address.
 * @route   PUT /user/address/edit/:id
 * @access  Private (isUser)
 */
exports.editAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    await userService.editAddress(userId, req.params.id, req.body);

    res.status(200).json({
      success: true,
      message: 'Address updated successfully!',
    });
  } catch (error) {
    console.error('Edit Address Error:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to update address.',
    });
  }
};

/**
 * @desc    Permanently delete a customer address.
 * @route   DELETE /user/address/delete/:id
 * @access  Private (isUser)
 */
exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    await userService.deleteAddress(userId, req.params.id);

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully.',
    });
  } catch (error) {
    console.error('Delete Address Error:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to delete address.',
    });
  }
};

// ==========================================
// USER PROFILE CONTROLLER METHODS
// ==========================================

/**
 * @desc    Render user profile page with saved addresses and notification status.
 * @route   GET /user/profile
 * @access  Private (isUser)
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/user/login');

    const { user, addresses, successMessage } = await userService.getProfilePageData(
      userId,
      req.query
    );

    res.render('User/user-profile', {
      user,
      addresses,
      title: 'My Profile | HOOF',
      layout: 'layouts/user',
      successMessage,
    });
  } catch (err) {
    console.error('Profile Error:', err.message);
    res.redirect('/user/home');
  }
};

/**
 * @desc    Update text profile information (fullName, phone, dob).
 * @route   POST /user/profile/update
 * @access  Private (isUser)
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    const updatedUser = await userService.updateProfileData(userId, req.body);

    req.session.userName = updatedUser.fullName;

    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (err) {
    console.error('Update Profile Error:', err.message);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({ success: false, message: err.message });
  }
};

/**
 * @desc    Upload, replace, and save avatar profile image.
 * @route   POST /user/profile/update-image
 * @access  Private (isUser)
 */
exports.updateProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const userId = req.session.userId;
    const publicRoot = path.join(__dirname, '../../public');

    const newImagePath = await userService.updateUserProfileImage(
      userId,
      req.file.filename,
      publicRoot
    );

    if (req.session.user) {
      req.session.user.profileImage = newImagePath;
    }

    req.session.save((err) => {
      if (err) throw err;
      res.json({
        success: true,
        message: 'Profile picture updated!',
        imagePath: newImagePath,
      });
    });
  } catch (error) {
    console.error('Profile Image Upload Error:', error.message);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error during upload',
    });
  }
};

/**
 * @desc    Remove avatar profile picture.
 * @route   DELETE /user/profile/delete-image
 * @access  Private (isUser)
 */
exports.deleteProfileImage = async (req, res) => {
  try {
    const userId = req.session.userId;
    const publicRoot = path.join(__dirname, '../../public');

    await userService.removeUserProfileImage(userId, publicRoot);

    if (req.session.user) {
      req.session.user.profileImage = '';
    }

    return res.json({ success: true, message: 'Profile image deleted' });
  } catch (error) {
    console.error('Delete Image Error:', error.message);
    const statusCode = error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// ==========================================
// EMAIL & PASSWORD CHANGE FLOW
// ==========================================

/**
 * @desc    Send verification OTP to current email to authorize change.
 * @route   GET /user/profile/change-email-start
 * @access  Private (isUser)
 */
exports.getChangeEmailOtp = async (req, res) => {
  try {
    const currentEmail = await authService.initiateEmailChangeCurrent(req.session.userId);
    req.session.changeEmailFlow = true;
    req.session.currentEmailToVerify = currentEmail;
    req.session.otpEmail = currentEmail;

    res.render('User/auth/verify-otp', {
      layout: 'layouts/user',
      email: currentEmail,
      message: null,
    });
  } catch (err) {
    console.error('Change Email Start Error:', err.message);
    res.redirect('/user/profile');
  }
};

/**
 * @desc    Render the form to submit new email address.
 * @route   GET /user/profile/change-email-form
 * @access  Private (isUser)
 */
exports.renderChangeEmailForm = (req, res) => {
  if (!req.session.emailVerifiedForChange) {
    return res.redirect('/user/profile');
  }
  res.render('User/change-email', { layout: 'layouts/user', message: null });
};

/**
 * @desc    Send verification OTP to the new email address.
 * @route   POST /user/profile/change-email-new-otp
 * @access  Private (isUser)
 */
exports.sendNewEmailOtp = async (req, res) => {
  try {
    if (!req.session.emailVerifiedForChange) {
      return res.redirect('/user/profile');
    }

    const { newEmail } = req.body;
    const normalizedNewEmail = await authService.initiateEmailChangeNew(
      req.session.userId,
      newEmail
    );

    req.session.tempNewEmail = normalizedNewEmail;
    req.session.newEmailOtpSent = true;
    req.session.otpEmail = normalizedNewEmail;

    res.render('User/auth/verify-otp', {
      layout: 'layouts/user',
      email: normalizedNewEmail,
      message: null,
    });
  } catch (err) {
    console.error('Send New Email OTP Error:', err.message);
    res.render('User/change-email', {
      layout: 'layouts/user',
      message: { type: 'error', text: err.message || 'Failed to send verification code.' },
    });
  }
};

/**
 * @desc    Initiate password change via reset link sent to registered email.
 * @route   GET /user/profile/change-password-request
 * @access  Private (isUser)
 */
exports.changePasswordRequest = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || user.authProvider !== 'local') {
      return res.redirect('/user/profile');
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendResetPasswordEmail(user.email, resetToken);

    res.redirect('/user/profile?message=reset_link_sent');
  } catch (err) {
    console.error('Change Password Request Error:', err.message);
    res.redirect('/user/profile');
  }
};
