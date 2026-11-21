/**
 * @file config/cloudinary.js
 * @description Centralized Cloudinary SDK configuration.
 */

const cloudinary = require('cloudinary').v2;
const env = require('./env');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;
