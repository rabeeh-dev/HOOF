/**
 * @file middleware/productMulter.js
 * @description Specialized Multer configuration for handling product image uploads.
 */

const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Storage configuration dedicated to product images.
 */
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "public/uploads/products";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Preserve original filename with a timestamp prefix
        cb(null, Date.now() + "-" + file.originalname);
    }
});

/**
 * Multer instance for product uploads with specific image type validation.
 */
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error("Only images (jpeg, jpg, png, webp) are allowed"));
    }
});

module.exports = upload;
