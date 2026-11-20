/**
 * @file middlewares/auth.middleware.js
 * @description Request guards for user authentication and active account status validation.
 */

const User = require('../models/User');
const { USER_COOKIE_NAME } = require('../config/session');

/**
 * Ensures the requester is an authenticated user.
 */
const isUser = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  // Handle AJAX / JSON clients
  if (req.xhr || req.headers.accept?.includes('application/json')) {
    return res.status(401).json({
      success: false,
      message: 'Login required',
      redirect: '/user/login',
    });
  }

  return res.redirect('/user/login');
};

/**
 * Ensures the user is a guest (logged out).
 */
const isLoggedOut = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/user/home');
  }
  return next();
};

/**
 * Ensures the user account is not blocked or suspended.
 */
const checkBlocked = async (req, res, next) => {
  try {
    if (req.session && req.session.userId) {
      let user = req.user;
      if (!user || user._id.toString() !== req.session.userId.toString()) {
        user = await User.findById(req.session.userId).select('isBlocked');
      }

      if (!user || user.isBlocked) {
        return req.session.destroy((err) => {
          if (err) console.error('Error destroying blocked session:', err);
          res.clearCookie(USER_COOKIE_NAME, { path: '/' });

          if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(403).json({
              success: false,
              message: 'Your account has been suspended. Please contact support.',
              redirect: '/user/login',
            });
          }

          return res.redirect('/user/login?error=account_blocked');
        });
      }
    }
    return next();
  } catch (err) {
    console.error('Middleware Block Check Error:', err);
    return next();
  }
};

/**
 * Ensures the session belongs to an authenticated administrator.
 */
const isAdmin = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.redirect('/admin/login');
};

module.exports = {
  isUser,
  isLoggedOut,
  checkBlocked,
  isAdmin,
};
