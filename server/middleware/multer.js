/**
 * @file middleware/multer.js
 * @description General-purpose Multer configuration for handling file uploads (e.g., profiles).
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Disk storage configuration for Multer.
 * Dynamically chooses the upload folder based on the request URL.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Default to profile uploads
        let folder = 'public/uploads/profile';

        // Use products folder if applicable
        if (req.originalUrl.includes('products')) {
            folder = 'public/uploads/products';
        }

        // Ensure the directory exists
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        // Use a unique suffix to prevent filename collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `img-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

/**
 * File filter to ensure only images are uploaded.
 * Supports common image formats and HEIC.
 */
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.originalname.toLowerCase().endsWith('.heic')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'), false);
    }
};

module.exports = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});