/**
 * @file controllers/user/shop.controller.js
 * @description Controller handling public and customer storefront discovery: catalog, details, landing, home, reviews, and contact.
 */

const productService = require('../../services/product.service');
const { sendContactEmail } = require('../../utils/sendEmail');
const { appendContactLead } = require('../../utils/googleSheets');
const AppError = require('../../utils/AppError');

/**
 * @desc    Render public storefront landing page.
 * @route   GET /
 * @access  Public
 */
exports.landingPage = async (req, res) => {
  try {
    const newArrivals = await productService.getNewArrivals(4);
    res.render('User/landing', {
      title: 'HOOF | Premium Sneakers',
      layout: 'layouts/user',
      newArrivals,
    });
  } catch (err) {
    console.error('Landing Page Error:', err);
    res.render('User/landing', {
      title: 'HOOF | Premium Sneakers',
      layout: 'layouts/user',
      newArrivals: [],
    });
  }
};

/**
 * @desc    Render authenticated user home page.
 * @route   GET /user/home
 * @access  Private (isUser)
 */
exports.homePage = async (req, res) => {
  try {
    const newArrivals = await productService.getNewArrivals(4);
    res.render('User/home', {
      title: 'Home - HOOF',
      layout: 'layouts/user',
      newArrivals,
    });
  } catch (err) {
    console.error('Home Page Error:', err);
    res.render('User/home', {
      title: 'Home - HOOF',
      layout: 'layouts/user',
      newArrivals: [],
    });
  }
};

/**
 * @desc    Display the main shop catalog with category filtering, searching, sorting, and pagination.
 * @route   GET /user/shop
 * @access  Public
 */
exports.listProducts = async (req, res) => {
  try {
    // 1. Fetch filtered and paginated products
    const { products, totalPages, currentPage } = await productService.getAllProducts(req.query, 6);

    // 2. Fetch categories for sidebar filter
    const categories = await productService.getActiveCategories();

    // 3. Define sizes
    const availableSizes = ['6', '7', '8', '9', '10', '11', '12'];

    // 4. Fetch wishlist if user is authenticated
    let wishlistProductIds = [];
    if (req.session?.userId) {
      const Wishlist = require('../../models/Wishlist');
      const wishlist = await Wishlist.findOne({ userId: req.session.userId }).select('products').lean();
      if (wishlist?.products) {
        wishlistProductIds = wishlist.products.map((id) => id.toString());
      }
    }

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
      wishlistProductIds,
      title: 'Shop | HOOF',
    });
  } catch (error) {
    console.error('Shop Listing Error:', error);
    res.redirect('/user/home');
  }
};

/**
 * @desc    View details of a specific product, customer reviews, and related items.
 * @route   GET /user/product-details/:id
 * @access  Public
 */
exports.loadProductDetails = async (req, res) => {
  try {
    const productId = req.params.id;
    const details = await productService.getProductDetails(productId, req.session?.userId);

    res.render('User/product-details', {
      product: details.product,
      relatedProducts: details.relatedProducts,
      reviews: details.reviews,
      wishlistProductIds: details.wishlistProductIds,
      hasPurchased: details.hasPurchased,
      hasReviewed: details.hasReviewed,
      title: `${details.product.productName} | HOOF`,
      breadcrumbs: [
        { name: 'Home', url: '/' },
        { name: 'Shop', url: '/user/shop' },
        { name: details.product.productName, url: '' },
      ],
    });
  } catch (error) {
    console.error('Load Product Details Error:', error);
    res.redirect('/user/shop');
  }
};

/**
 * @desc    Submit a rating and review for a delivered product.
 * @route   POST /user/product/:id/review
 * @access  Private (isUser)
 */
exports.addReview = async (req, res) => {
  try {
    const productId = req.params.id || req.body.productId;
    const { rating, comment } = req.body;
    const userId = req.session?.userId;

    await productService.addProductReview({
      userId,
      productId,
      rating,
      comment,
    });

    return res.json({ success: true, message: 'Review added successfully!' });
  } catch (error) {
    console.error('Add Review Error:', error.message);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || 'Failed to add review' });
  }
};

/**
 * @desc    Render the About Us page.
 * @route   GET /user/about
 * @access  Public
 */
exports.aboutPage = (req, res) => {
  res.render('User/about', { title: 'About - HOOF', layout: 'layouts/user' });
};

/**
 * @desc    Render the Contact Us page.
 * @route   GET /user/contact
 * @access  Public
 */
exports.contactPage = (req, res) => {
  res.render('User/contact', { title: 'Contact - HOOF', layout: 'layouts/user' });
};

/**
 * @desc    Process contact form submission, email notification, and Google Sheets lead logging.
 * @route   POST /user/contact
 * @access  Public
 */
exports.handleContactSubmit = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    // 1. Dispatch email notification
    await sendContactEmail(name, email, subject, message);

    // 2. Log lead to Google Sheets (non-blocking)
    appendContactLead(name, email, subject, message);

    return res.json({ success: true, message: 'Message received! We will get back to you soon.' });
  } catch (err) {
    console.error('Contact Form Error:', err);
    return res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};
