const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const adminAuth = require('../middleware/adminAuth');

router.get('/login', adminAuth.isLogout, adminController.loadLogin);
router.post('/login', adminController.verifyAdmin);

router.get('/dashboard', adminAuth.isLogin, adminController.loadDashboard);
router.get('/logout', adminAuth.isLogin, adminController.logout); // Added logout route

module.exports = router;