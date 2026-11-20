/**
 * @file middlewares/adminAuth.middleware.js
 * @description Authentication guards for the administrative portal.
 */

/**
 * Ensures admin has an active session (req.session.adminId).
 * Redirects to /admin/login if unauthenticated.
 */
const isAdminLogin = (req, res, next) => {
  try {
    if (req.session && req.session.adminId) {
      return next();
    }
    return res.redirect('/admin/login');
  } catch (error) {
    console.error('Admin Auth Middleware Error (isAdminLogin):', error.message);
    return res.status(500).send('Internal Server Error');
  }
};

/**
 * Prevents logged-in admins from accessing guest pages (like admin login).
 * Redirects to /admin/dashboard if already authenticated.
 */
const isAdminLogout = (req, res, next) => {
  try {
    if (req.session && req.session.adminId) {
      return res.redirect('/admin/dashboard');
    }
    return next();
  } catch (error) {
    console.error('Admin Auth Middleware Error (isAdminLogout):', error.message);
    return res.status(500).send('Internal Server Error');
  }
};

module.exports = {
  isAdminLogin,
  isAdminLogout,
  // Backward-compatibility aliases
  isLogin: isAdminLogin,
  isLogout: isAdminLogout,
};
