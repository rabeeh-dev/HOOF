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

        // 3. Define available sizes (you can also query these from variants in DB)
        const availableSizes = ["6", "7", "8", "9", "10", "11", "12"];

        // 4. Render Page
        res.render('User/shop', {
            products,
            categories,
            totalPages,
            currentPage,
            selectedCategory: req.query.category || null,
            selectedSort: req.query.sort || 'newest',
            minPrice: req.query.minPrice || 0,
            maxPrice: req.query.maxPrice || 20000,
            selectedSize: req.query.size || null,
            availableSizes,
            search: req.query.search || '',
            title: "Shop | HOOF"
        });
    } catch (error) {
        console.error("Shop Listing Error:", error);
        res.redirect('/user/home');
    }
};