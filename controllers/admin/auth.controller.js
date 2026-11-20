/**
 * @file controllers/admin/auth.controller.js
 * @description Controller handling administrator authentication: login page, credential verification, and session logout.
 */

const authService = require('../../services/auth.service');

/**
 * @desc    Render the admin login page (redirects to dashboard if already authenticated).
 * @route   GET /admin/login
 * @access  Public (isAdminLogout)
 */
exports.loadLogin = async (req, res) => {
  try {
    if (req.session && req.session.adminId) {
      return res.redirect('/admin/dashboard');
    }
    res.render('Admin/auth/login', { layout: false, message: null });
  } catch (error) {
    console.error('Load Admin Login Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
};

/**
 * @desc    Verify admin credentials and set session.
 * @route   POST /admin/login
 * @access  Public
 */
exports.verifyAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminData = await authService.verifyAdminLogin(email, password);

    req.session.adminId = adminData._id;
    req.session.save((err) => {
      if (err) {
        console.error('Admin session save error:', err);
      }
      return res.status(200).json({ success: true });
    });
  } catch (error) {
    const statusCode = error.statusCode || 401;
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Invalid email or password',
    });
  }
};

/**
 * @desc    Destroy admin session and clear portal cookies.
 * @route   GET /admin/logout
 * @access  Private (isAdminLogin)
 */
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Admin Logout Error:', err);
      return res.redirect('/admin/dashboard');
    }
    res.clearCookie('hoof.admin.sid');
    res.clearCookie('connect.sid');
    res.redirect('/admin/login');
  });
};
