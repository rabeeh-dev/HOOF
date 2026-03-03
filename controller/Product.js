const productService = require("../services/Product");
const Category = require("../model/Category");
const Product = require("../model/Product");
const Wishlist = require("../model/Wishlist");
const Review = require("../model/Review");
const Order = require("../model/Order");

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

exports.addReview = async (req, res) => {
    try {
        const { productId, rating, comment } = req.body;
        const userId = req.session.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Please login to write a review" });
        }

        // Check if user has purchased and received this product
        const hasPurchased = await Order.exists({
            userId,
            'items.productId': productId,
            status: 'DELIVERED'
        });

        if (!hasPurchased) {
            return res.status(403).json({ success: false, message: "You can only review products you have purchased" });
        }

        // Check if user has already reviewed this product
        const existingReview = await Review.findOne({ userId, productId });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "You have already reviewed this product" });
        }

        const newReview = new Review({
            userId,
            productId,
            rating,
            comment
        });

        await newReview.save();
        res.json({ success: true, message: "Review added successfully!" });

    } catch (error) {
        console.error("Add Review Error:", error);
        res.status(500).json({ success: false, message: "Failed to add review" });
    }
};

exports.loadProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;

        if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.redirect('/user/shop');
        }

        const product = await Product.findById(productId).populate('category');

        if (!product) {
            return res.redirect('/user/shop');
        }

        const relatedProducts = await Product.find({
            category: product.category._id,
            _id: { $ne: productId },
            isBlocked: false,
            status: "Available"
        }).limit(4);

        // Fetch Reviews
        const reviews = await Review.find({ productId }).populate('userId', 'fullName').sort({ createdAt: -1 });

        let wishlistProductIds = [];
        let hasPurchased = false;
        let hasReviewed = false;
        if (req.session.userId) {
            const wishlist = await Wishlist.findOne({ userId: req.session.userId }).select('products');
            if (wishlist && wishlist.products) {
                wishlistProductIds = wishlist.products.map(id => id.toString());
            }

            // Check if user bought and received this product
            hasPurchased = !!(await Order.exists({
                userId: req.session.userId,
                'items.productId': productId,
                status: 'DELIVERED'
            }));

            // Check if user already reviewed this product
            if (hasPurchased) {
                hasReviewed = !!(await Review.findOne({ userId: req.session.userId, productId }));
            }
        }

        res.render("User/product-details", {
            product,
            relatedProducts,
            reviews,
            wishlistProductIds,
            hasPurchased,
            hasReviewed,
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