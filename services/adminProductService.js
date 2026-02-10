const Product = require("../model/Product");
const Category = require("../model/Category");
const convert = require('heic-convert');
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
} // <--- Fixed: Added missing closing brace here

async function getProductById(id) {
    return await Product.findById(id).populate('category');
}

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