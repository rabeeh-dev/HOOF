const productService = require("../services/productService");
const Category = require("../model/Category");

/**
 * @route   GET /products
 * @desc    Renders the shop/listing page with filters and sorting
 * @access  Public
 */
exports.listProducts = async (req, res) => {
    try {
        // 1. Get Data from Service
        const { products, totalPages, currentPage } = await productService.getAllProducts(req.query);

        // 2. Get Categories for the Sidebar filter
        const categories = await Category.find({ isListed: true });

        // 3. Render Page
        res.render('User/shop', {
            products,
            categories,
            totalPages,
            currentPage,
            selectedCategory: req.query.category || null,
            selectedSort: req.query.sort || 'newest',
            maxPrice: req.query.maxPrice || 20000,
            search: req.query.search || '',
            title: "Shop | HOOF"
        });
    } catch (error) {
        console.error("Shop Listing Error:", error);
        res.redirect('/user/home');
    }
};