/**
 * @file middlewares/upload.middleware.js
 * @description Centralized Cloudinary upload middleware for user profile avatars and product images.
 */

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

/**
 * Storage configuration for user profile avatars.
 */
const userStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hoof/profiles',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'heic'],
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

/**
 * Storage configuration for admin product catalog images.
 */
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'hoof/products',
    allowed_formats: ['jpeg', 'jpg', 'png', 'webp', 'heic'],
    transformation: [
      { quality: 'auto', fetch_format: 'auto' },
    ],
  },
});

/**
 * File filter for validating image uploads.
 */
const imageFileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp|heic/;
  const isImageMime = file.mimetype.startsWith('image/');
  const isAllowedExt = allowed.test(file.originalname.toLowerCase());

  if (isImageMime || isAllowedExt) {
    return cb(null, true);
  }
  return cb(new Error('Only images (jpeg, jpg, png, webp, heic) are allowed!'), false);
};

const userUpload = multer({
  storage: userStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

const productUpload = multer({
  storage: productStorage,
  fileFilter: imageFileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = userUpload;
module.exports.userUpload = userUpload;
module.exports.productUpload = productUpload;
module.exports.cloudinary = cloudinary;
