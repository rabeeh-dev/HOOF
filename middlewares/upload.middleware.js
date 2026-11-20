/**
 * @file middlewares/upload.middleware.js
 * @description Centralized upload middleware for user profile avatars and product images with HEIC support.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Storage configuration for user profile avatars.
 */
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = path.join(__dirname, '../public/uploads/profile');
    if (!fs.existsSync(folder)) {
      fs.mkdirSync(folder, { recursive: true });
    }
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `img-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

/**
 * File filter for user avatars (supports all standard images + HEIC).
 */
const userFileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.originalname.toLowerCase().endsWith('.heic')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed!'), false);
  }
};

const userUpload = multer({
  storage: userStorage,
  fileFilter: userFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

/**
 * Storage configuration for admin product catalog images.
 */
const productStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../public/uploads/products');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

/**
 * File filter for admin product catalog images.
 */
const productFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|webp|heic/;
  const mimetype = file.mimetype.startsWith('image/') || filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('Only images (jpeg, jpg, png, webp, heic) are allowed'));
};

const productUpload = multer({
  storage: productStorage,
  fileFilter: productFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = userUpload;
module.exports.userUpload = userUpload;
module.exports.productUpload = productUpload;
