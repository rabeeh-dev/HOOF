/**
 * @file routes/admin/auth.routes.js
 * @description Route definitions for administrator authentication: login and logout.
 */

const express = require('express');
const router = express.Router();
const authController = require('../../controllers/admin/auth.controller');
const { isAdminLogin, isAdminLogout } = require('../../middlewares/adminAuth.middleware');

// Portal root entry point (/admin or /admin/)
router.get('/', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.redirect('/admin/dashboard');
  }
  return res.redirect('/admin/login');
});

// Public guest routes
router.get('/login', isAdminLogout, authController.loadLogin);
router.post('/login', authController.verifyAdmin);

// Private authenticated routes
router.get('/logout', isAdminLogin, authController.logout);

module.exports = router;
