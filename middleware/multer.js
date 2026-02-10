const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Dynamically choose folder based on the route
        let folder = 'public/uploads/profile';
        
        if (req.originalUrl.includes('products')) {
            folder = 'public/uploads/products';
        }

        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder, { recursive: true });
        }
        cb(null, folder);
    },
    filename: (req, file, cb) => {
        // Use a random suffix to prevent filename collisions for multiple uploads
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `img-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    // Allow standard images and HEIC
    if (file.mimetype.startsWith('image/') || file.originalname.toLowerCase().endsWith('.heic')) {
        cb(null, true);
    } else {
        cb(new Error('Only images are allowed!'), false);
    }
};

module.exports = multer({ 
    storage, 
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});