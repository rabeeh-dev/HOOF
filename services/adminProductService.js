const Product = require("../model/Product");

/**
 * Fetches all products with pagination and category details.
 * @param {number} page - Current page number.
 * @param {number} limit - Items per page.
 * @returns {Promise<Object>} Products and pagination metadata.
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
 * Adds a new product to the database.
 * @param {Object} productData - The product details.
 * @returns {Promise<Object>} The created product.
 */
async function addProduct(productData) {
    const newProduct = new Product({
        productName: productData.productName,
        description: productData.description,
        brand: productData.brand,
        category: productData.category,
        regularPrice: productData.regularPrice,
        salePrice: productData.salePrice,
        quantity: productData.quantity,
        productImage: productData.productImage,
        variants: productData.variants || []
    });

    return await newProduct.save();
}

module.exports = {
    getAllProductsAdmin,
    addProduct
};