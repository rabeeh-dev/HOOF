/**
 * @file controller/productController.js
 * @description Controller for handled product-related operations for the end-user (shop and product details).
 */

const productService = require("../services/Product");
const Category = require("../model/Category");
const Product = require("../model/Product");
const Wishlist = require("../model/Wishlist");

/**
 * @desc    Renders the shop/listing page with filters, sorting, and pagination.
 * @route   GET /user/shop
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.listProducts = async (req, res) => {
    try {
        // 1. Get Data from Service (Filter, Sort, Paginate)
        const { products, totalPages, currentPage } = await productService.getAllProducts(req.query);

        // 2. Get Categories for the Sidebar filter
        const categories = await Category.find({ isListed: true });

        // 3. Define available sizes (static for now)
        const availableSizes = ["6", "7", "8", "9", "10", "11", "12"];

        // 3.5 Fetch User's Wishlist (if logged in)
        let wishlistProductIds = [];
        if (req.session.userId) {
            const wishlist = await Wishlist.findOne({ userId: req.session.userId }).select('products');
            if (wishlist && wishlist.products) {
                wishlistProductIds = wishlist.products.map(id => id.toString());
            }
        }

        // 4. Render Page with all necessary parameters
        res.render('User/shop', {
            products,
            categories,
            totalPages,
            currentPage,
            selectedCategory: req.query.category || null,
            selectedSort: req.query.sort || 'newest',
            minPrice: req.query.minPrice || 0,
            maxPrice: req.query.maxPrice || 300000,
            selectedSize: req.query.size || null,
            availableSizes,
            search: req.query.search || '',
            wishlistProductIds, // Pass the wishlist IDs to the view
            title: "Shop | HOOF"
        });
    } catch (error) {
        console.error("Shop Listing Error:", error);
        res.redirect('/user/home');
    }
};

/**
 * @desc    Render single product details page.
 * @route   GET /user/product-details/:id
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;

        // Validate if productId is a valid MongoDB ObjectId
        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.redirect('/user/shop');
        }

        const product = await Product.findById(productId).populate('category');

        if (!product) {
            return res.redirect('/user/shop');
        }

        // Fetch related products (same category, exclude current, only active products)
        // Fetch related products (same category, exclude current, only active products)
        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: productId },
            isBlocked: false,
            status: "Available"
        }).limit(4);

        // Fetch User's Wishlist (if logged in)
        let wishlistProductIds = [];
        if (req.session.userId) {
            const wishlist = await Wishlist.findOne({ userId: req.session.userId }).select('products');
            if (wishlist && wishlist.products) {
                wishlistProductIds = wishlist.products.map(id => id.toString());
            }
        }

        res.render("User/product-details", {
            product,
            relatedProducts,
            wishlistProductIds,
            title: `${product.productName} | HOOF`,

            breadcrumbs: [
                { name: 'Home', url: '/' },
                { name: 'Shop', url: '/user/shop' },
                { name: product.productName, url: '' }
            ]
        });

    } catch (error) {
        console.error("Load Product Details Error:", error);
        res.redirect('/user/shop');
    }
};