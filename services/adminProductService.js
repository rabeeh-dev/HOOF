/**
 * @file services/adminProductService.js
 * @description Service layer for administrative product and category operations.
 */

const Product = require("../model/Product");
const Category = require("../model/Category");
const convert = require('heic-convert');
const fs = require('fs');
const path = require('path');

/**
 * Fetches all products with pagination and category details for admin.
 * @param {number} [page=1] - Current page number.
 * @param {number} [limit=10] - Number of products per page.
 * @returns {Promise<Object>} Object containing products, totalPages, and currentPage.
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
 * Adds a new product to the database with image processing and HEIC conversion.
 * @param {Object} productData - Data for the new product.
 * @param {Array<Object>} files - Array of uploaded image files.
 * @returns {Promise<Object>} The saved product document.
 * @throws {Error} If no valid variants are provided.
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
            const newPath = path.resolve('public/uploads/products', filename);
            fs.writeFileSync(newPath, outputBuffer);
            fs.unlinkSync(filePath);
        }

        imagePaths.push(`/uploads/products/${filename}`);
    }

    // 2. Process Variants
    const variants = [];
    if (!productData.variantSize || (Array.isArray(productData.variantSize) && productData.variantSize.length === 0)) {
        throw new Error("At least one variant (Size & Stock) is required.");
    }

    const sizes = Array.isArray(productData.variantSize) ? productData.variantSize : [productData.variantSize];
    const stocks = Array.isArray(productData.variantStock) ? productData.variantStock : [productData.variantStock];

    sizes.forEach((size, i) => {
        if (!size || !stocks[i]) return; // Basic skip for empty rows if any
        variants.push({
            size: size,
            quantity: parseInt(stocks[i]) || 0,
            status: parseInt(stocks[i]) > 0 ? "Available" : "Out of Stock"
        });
    });

    if (variants.length === 0) {
        throw new Error("At least one valid variant is required.");
    }

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
 * Fetches categories with pagination and search support for admin.
 * @param {number} [page=1] - Current page number.
 * @param {number} [limit=5] - Number of categories per page.
 * @param {string} [search=''] - Search term for category name.
 * @returns {Promise<Object>} Object containing categories, totalPages, currentPage, and totalCategories.
 */
async function getAllCategoriesAdmin(page = 1, limit = 5, search = '') {
    const skip = (page - 1) * limit;

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

/**
 * Retrieves a single product by its ID with populated category.
 * @param {string} id - Product ID.
 * @returns {Promise<Object|null>} The product document or null.
 */
async function getProductById(id) {
    return await Product.findById(id).populate('category');
}

/**
 * Updates an existing product with image handling and variant processing.
 * @param {string} id - Product ID.
 * @param {Object} productData - Updated product data.
 * @param {Array<Object>} files - New uploaded image files.
 * @returns {Promise<Object|null>} The updated product document.
 * @throws {Error} If no valid variants are provided.
 */
async function updateProduct(id, productData, files) {
    // 1. Process New Images
    const newImagePaths = [];
    if (files && files.length > 0) {
        for (const file of files) {
            let filename = file.filename;
            let filePath = file.path;

            if (file.originalname.toLowerCase().endsWith('.heic')) {
                const inputBuffer = fs.readFileSync(filePath);
                const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 1 });
                filename = `upd-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
                const newPath = path.resolve('public/uploads/products', filename);
                fs.writeFileSync(newPath, outputBuffer);
                fs.unlinkSync(filePath);
            }
            newImagePaths.push(`/uploads/products/${filename}`);
        }
    }

    // 2. Combine with Existing Images
    let finalImages = [];
    if (productData.existingImages) {
        try {
            finalImages = JSON.parse(productData.existingImages);
        } catch (e) {
            finalImages = Array.isArray(productData.existingImages) ? productData.existingImages : [productData.existingImages];
        }
    }
    finalImages = [...finalImages, ...newImagePaths];

    // 3. Process Variants
    const variants = [];
    if (!productData.variantSize || (Array.isArray(productData.variantSize) && productData.variantSize.length === 0)) {
        throw new Error("At least one variant (Size & Stock) is required.");
    }

    const sizes = Array.isArray(productData.variantSize) ? productData.variantSize : [productData.variantSize];
    const stocks = Array.isArray(productData.variantStock) ? productData.variantStock : [productData.variantStock];

    sizes.forEach((size, i) => {
        if (!size || !stocks[i]) return;
        variants.push({
            size: size,
            quantity: parseInt(stocks[i]) || 0,
            status: parseInt(stocks[i]) > 0 ? "Available" : "Out of Stock"
        });
    });

    if (variants.length === 0) {
        throw new Error("At least one valid variant is required.");
    }

    // 4. Update Database
    const updateFields = {
        productName: productData.productName,
        description: productData.description,
        brand: productData.brand,
        category: productData.category,
        regularPrice: parseFloat(productData.regularPrice),
        salePrice: parseFloat(productData.salePrice),
        quantity: parseInt(productData.quantity) || 0,
        productImage: finalImages,
        variants: variants
    };

    return await Product.findByIdAndUpdate(id, updateFields, { new: true });
}

module.exports = {
    getAllProductsAdmin,
    addProduct,
    getAllCategoriesAdmin,
    getProductById,
    updateProduct
};