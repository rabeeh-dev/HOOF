/**
 * @file middlewares/upload.middleware.js
 * @description Centralized upload middleware for user profile avatars and product images.
 */

const userUpload = require('../middleware/multer');
const productUpload = require('../middleware/productMulter');

module.exports = userUpload;
module.exports.userUpload = userUpload;
module.exports.productUpload = productUpload;
