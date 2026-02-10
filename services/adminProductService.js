const Product = require("../model/Product");
const convert = require('heic-convert');
const Category = require("../model/Category");
const fs = require('fs');
const path = require('path');

/**
 * Fetches all products with pagination and category details.
 */
async function getAllProductsAdmin(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const products = await Product.find({})
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalProducts = await Product.countDocuments({});

    return {
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page
    };
}

/**
 * Adds a new product to the database with HEIC conversion support.
 * @param {Object} productData - The text details from req.body.
 * @param {Array} files - The image files from req.files (Multer).
 */
async function addProduct(productData, files) {
    const imagePaths = [];

    // 1. Process Images & HEIC
    for (const file of files) {
        let filename = file.filename;
        let filePath = file.path;

        if (file.originalname.toLowerCase().endsWith('.heic')) {
            const inputBuffer = fs.readFileSync(filePath);
            const outputBuffer = await convert({
                buffer: inputBuffer,
                format: 'JPEG',
                quality: 1
            });

            filename = `conv-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            // Use path.resolve to ensure it finds your public folder correctly on macOS
            const newPath = path.resolve('public/uploads/products', filename);
            fs.writeFileSync(newPath, outputBuffer);
            fs.unlinkSync(filePath); // Delete HEIC
        }
        
        imagePaths.push(`/uploads/products/${filename}`);
    }

    // 2. Process Variants (Moved from Controller to Service)
    const variants = [];
    if (productData.variantSize) {
        const sizes = Array.isArray(productData.variantSize) ? productData.variantSize : [productData.variantSize];
        const colors = Array.isArray(productData.variantColor) ? productData.variantColor : [productData.variantColor];
        const stocks = Array.isArray(productData.variantStock) ? productData.variantStock : [productData.variantStock];

        sizes.forEach((size, i) => {
            variants.push({
                size: size,
                color: colors[i],
                quantity: parseInt(stocks[i]) || 0,
                status: parseInt(stocks[i]) > 0 ? "Available" : "Out of Stock"
            });
        });
    }

    // 3. Save Product
    const newProduct = new Product({
        productName: productData.productName,
        description: productData.description,
        brand: productData.brand,
        category: productData.category,
        regularPrice: parseFloat(productData.regularPrice),
        salePrice: parseFloat(productData.salePrice),
        quantity: parseInt(productData.quantity) || 0,
        productImage: imagePaths,
        variants: variants
    });

    return await newProduct.save();
}

/**
 * Fetches categories with pagination and search support
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {string} search - Optional search query
 */
async function getAllCategoriesAdmin(page = 1, limit = 5, search = '') {
    const skip = (page - 1) * limit;
    
    // Build search filter
    let query = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalCategories = await Category.countDocuments(query);

    return {
        categories,
        totalPages: Math.ceil(totalCategories / limit),
        currentPage: page,
        totalCategories
    };
}

// Add this to your module.exports
module.exports = {
    // ... other functions
    getAllCategoriesAdmin
};

module.exports = {
    getAllProductsAdmin,
    addProduct,
    getAllCategoriesAdmin
};