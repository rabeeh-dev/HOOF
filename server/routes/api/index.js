/**
 * @file routes/api/index.js
 * @description Central routing entry point for the REST API namespace (/api).
 */

const express = require('express');
const router = express.Router();

const authApiRoutes = require('./auth');
const userApiRoutes = require('./user');
const adminApiRoutes = require('./admin');

// Mount sub-routers
router.use('/auth', authApiRoutes);
router.use('/user', userApiRoutes);
router.use('/admin', adminApiRoutes);

// Base /api test route
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'HOOF REST API is active.'
    });
});

module.exports = router;
