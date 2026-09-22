/**
 * @file controller/api/Product.js
 * @description API Controller for user-facing product and category operations.
 * Returns pure JSON responses suitable for the React frontend.
 */

const productService = require("../../services/Product");
const Category = require("../../model/Category");
const Product = require("../../model/Product");

/**
 * @desc    Get listed products with filtering, searching, sorting, and pagination.
 * @route   GET /api/user/products
 * @access  Public
 */
exports.listProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 8;
        const result = await productService.getAllProducts(req.query, limit);
        
        return res.status(200).json({
            success: true,
            products: result.products,
            pagination: {
                total: result.totalCount,
                page: result.currentPage,
                pages: result.totalPages,
                limit
            }
        });
    } catch (error) {
        console.error("API listProducts error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
};

/**
 * @desc    Get new arrivals (featured/latest products).
 * @route   GET /api/user/products/new-arrivals
 * @access  Public
 */
exports.getNewArrivals = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 4;
        const products = await Product.find({ isBlocked: false, status: "Available" })
            .populate('category')
            .sort({ createdAt: -1 })
            .limit(limit);
            
        return res.status(200).json({ success: true, products });
    } catch (error) {
        console.error("API getNewArrivals error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch new arrivals" });
    }
};

/**
 * @desc    Get details for a single product plus related items.
 * @route   GET /api/user/product/:id
 * @access  Public
 */
exports.getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: "Invalid product ID format" });
        }

        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: productId },
            isBlocked: false,
            status: "Available"
        }).limit(4);

        return res.status(200).json({
            success: true,
            product,
            relatedProducts
        });
    } catch (error) {
        console.error("API getProductDetails error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch product details" });
    }
};

/**
 * @desc    Get list of all listed categories.
 * @route   GET /api/user/categories
 * @access  Public
 */
exports.listCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });
        return res.status(200).json({ success: true, categories });
    } catch (error) {
        console.error("API listCategories error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch categories" });
    }
};
