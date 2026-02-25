/**
 * @file routes/userRoutes.js
 * @description Route definitions for user-related features, including authentication, profile settings, and shop browsing.
 */

const express = require("express");
const router = express.Router();
const userController = require("../controller/User");
const checkoutController = require("../controller/UserCheckout");
const couponController = require("../controller/Coupon");
const { isUser, isLoggedOut } = require("../middleware/auth");
const upload = require('../middleware/multer');
const passport = require("../config/passport");

// ==========================================
// AUTHENTICATION ROUTES (Signup, Login, OTP)
// ==========================================

/**
 * @desc    Render signup page for new users.
 * @route   GET /user/signup
 * @access  Public (Guest Only)
 */
router.get("/signup", isLoggedOut, userController.signupPage);

/**
 * @desc    Handle user registration submitted via form.
 * @route   POST /user/signup
 * @access  Public
 */
router.post("/signup", isLoggedOut, userController.signup);

/**
 * @desc    Render OTP verification page.
 * @route   GET /user/verify-otp
 * @access  Public (Session-based)
 */
router.get("/verify-otp", (req, res) => {
  res.render("User/auth/verify-otp", {
    layout: "layouts/user",
    error: null,
  });
});

/**
 * @desc    Verify the submitted OTP code.
 * @route   POST /user/verify-otp
 * @access  Public
 */
router.post("/verify-otp", userController.verifyOtp);

/**
 * @desc    Trigger a new OTP email (resend).
 * @route   POST /user/resend-otp
 * @access  Public
 */
router.post("/resend-otp", userController.resendOtp);

/**
 * @desc    Render login page.
 * @route   GET /user/login
 * @access  Public (Guest Only)
 */
router.get("/login", isLoggedOut, userController.loginPage);

/**
 * @desc    Authenticate user credentials and create session.
 * @route   POST /user/login
 * @access  Public
 */
router.post("/login", isLoggedOut, userController.login);

// ==========================================
// GOOGLE OAUTH ROUTES
// ==========================================

/**
 * @desc    Redirect to Google OAuth consent screen.
 * @route   GET /user/auth/google
 * @access  Public / Social Auth
 */
router.get("/auth/google", isLoggedOut,
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @desc    Handle Google authentication callback and session creation.
 * @route   GET /user/auth/google/callback
 * @access  Public
 */
router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/user/login" }),
  (req, res) => {
    // Populate session with authenticated user data
    req.session.userId = req.user._id;
    req.session.userName = req.user.fullName;
    req.session.userEmail = req.user.email;

    req.session.save((err) => {
      if (err) {
        console.error("Session Save Error:", err);
        return res.redirect("/user/login");
      }
      res.redirect("/user/home");
    });
  }
);

// ==========================================
// PASSWORD RECOVERY ROUTES
// ==========================================

/**
 * @desc    Render forgot password request page.
 * @route   GET /user/forgot-password
 * @access  Public
 */
router.get("/forgot-password", isLoggedOut, userController.forgotPasswordPage);

/**
 * @desc    Handle forgot password email submission.
 * @route   POST /user/forgot-password
 * @access  Public
 */
router.post("/forgot-password", isLoggedOut, userController.forgotPassword);

/**
 * @desc    Render reset password form via token link from email.
 * @route   GET /user/reset-password/:token
 * @access  Public (Token-based)
 */
router.get("/reset-password/:token", userController.resetPasswordPage);

/**
 * @desc    Process the password update after successful reset.
 * @route   POST /user/reset-password/:token
 * @access  Public
 */
router.post("/reset-password/:token", userController.resetPassword);

// ==========================================
// USER PROFILE & ACCOUNT MANAGEMENT
// ==========================================

/**
 * @desc    User homepage (Landing after login).
 * @route   GET /user/home
 * @access  Private (isUser)
 */
router.get('/home', isUser, userController.getHome);

/**
 * @desc    Render user profile dashboard with addresses and details.
 * @route   GET /user/profile
 * @access  Private (isUser)
 */
router.get('/profile', isUser, userController.getProfile);

/**
 * @desc    Update text-based profile details (Full Name, Phone, etc.) via AJAX.
 * @route   POST /user/profile/update
 * @access  Private (isUser)
 */
router.post('/profile/update', isUser, userController.updateProfile);

/**
 * @desc    Upload, crop, and set a new profile image.
 * @route   POST /user/profile/update-image
 * @access  Private (isUser)
 */
router.post('/profile/update-image', isUser, upload.single('profileImage'), userController.updateProfileImage);

/**
 * @desc    Remove current profile image and revert to default.
 * @route   DELETE /user/profile/delete-image
 * @access  Private (isUser)
 */
router.delete('/profile/delete-image', isUser, userController.deleteProfileImage);

// ==========================================
// EMAIL & PASSWORD CHANGE FLOW (Inside Profile)
// ==========================================

/**
 * @desc    Initiate email change (sends OTP to old email).
 * @route   GET /user/profile/change-email-start
 * @access  Private (isUser)
 */
router.get('/profile/change-email-start', isUser, userController.getChangeEmailOtp);

/**
 * @desc    Render form to enter new email address (requires OTP verification).
 * @route   GET /user/profile/change-email-form
 * @access  Private (isUser, Session-protected)
 */
router.get('/profile/change-email-form', isUser, (req, res) => {
  if (!req.session.emailVerifiedForChange) return res.redirect('/user/profile');
  res.render('User/change-email', { layout: 'layouts/user' });
});

/**
 * @desc    Send OTP to the new email address for confirmation.
 * @route   POST /user/profile/change-email-new-otp
 * @access  Private (isUser)
 */
router.post('/profile/change-email-new-otp', isUser, userController.sendNewEmailOtp);

/**
 * @desc    Initiate password change flow via reset link from profile settings.
 * @route   GET /user/profile/change-password-request
 * @access  Private (isUser)
 */
router.get('/profile/change-password-request', isUser, userController.changePasswordRequest);

// ==========================================
// ADDRESS MANAGEMENT
// ==========================================




// ==========================================
// LOGOUT
// ==========================================

/**
 * @desc    End user session and clear authentication flags.
 * @route   POST /user/logout
 * @access  Private (isUser)
 */
router.post("/logout", userController.logout);

// ==========================================
// ABOUT & CONTACT PAGES
// ==========================================

/**
 * @desc    Render the About page.
 * @route   GET /user/about
 * @access  Public
 */
router.get('/about', (req, res) => {
  res.render('User/about', { title: 'About - HOOF', layout: 'layouts/user' });
});

/**
 * @desc    Render the Contact page.
 * @route   GET /user/contact
 * @access  Public
 */
router.get('/contact', (req, res) => {
  res.render('User/contact', { title: 'Contact - HOOF', layout: 'layouts/user' });
});

/**
 * @desc    Handle contact form submission.
 * @route   POST /user/contact
 * @access  Public
 */
const { sendContactEmail } = require("../utils/sendEmail");

router.post('/contact', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    await sendContactEmail(name, email, subject, message);
    res.json({ success: true, message: 'Message received! We will get back to you soon.' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
});

// ==========================================
// SHOP / PRODUCT LISTING
// ==========================================
const productController = require("../controller/Product");

/**
 * @desc    Display the main shop page with filtering, sorting, and pagination.
 * @route   GET /user/shop
 * @access  Public / Private
 */
router.get('/shop', productController.listProducts);

/**
 * @desc    View details of a specific product and related items.
 * @route   GET /user/product-details/:id
 * @access  Public / Private
 */
router.get('/product-details/:id', productController.loadProductDetails);
router.post('/product/:id/review', isUser, productController.addReview);

// ==========================================
// CART ROUTES
// ==========================================
const Cart = require("../model/Cart");
const Wishlist = require("../model/Wishlist");

/**
 * @desc    Render the cart page with populated items.
 * @route   GET /user/cart
 * @access  Private (isUser)
 */
router.get('/cart', isUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.userId })
      .populate({
        path: 'items.productId',
        populate: { path: 'category', select: 'name' }
      });

    let cartItems = [];
    let totalAmount = 0;
    let totalItems = 0;

    if (cart && cart.items.length > 0) {
      // Filter out items with null products (deleted products)
      cartItems = cart.items.filter(item => item.productId);
      cartItems.forEach(item => {
        item.totalPrice = item.productId.salePrice * item.quantity;
        totalAmount += item.totalPrice;
        totalItems += item.quantity;
      });
    }

    res.render('User/cart', {
      title: 'Your Bag - HOOF',
      layout: 'layouts/user',
      cartItems,
      totalAmount,
      totalItems,
    });
  } catch (err) {
    console.error('Cart page error:', err);
    res.render('User/cart', {
      title: 'Your Bag - HOOF',
      layout: 'layouts/user',
      cartItems: [],
      totalAmount: 0,
      totalItems: 0,
    });
  }
});

const Product = require("../model/Product");

/**
 * @desc    Add a product to cart (or increment quantity).
 * @route   POST /user/cart/add
 * @access  Private (isUser)
 */
router.post('/cart/add', isUser, async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;

    // 1. Validate Product and Variant Stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const variant = product.variants.find(v => v.size === size);
    if (!variant) {
      return res.status(404).json({ success: false, message: 'Size not available' });
    }

    let cart = await Cart.findOne({ userId: req.session.userId });
    if (!cart) {
      cart = new Cart({ userId: req.session.userId, items: [] });
    }

    const existingItem = cart.items.find(
      item => item.productId.toString() === productId && item.size === size
    );

    let currentQty = existingItem ? existingItem.quantity : 0;
    const newTotalQty = currentQty + quantity;

    if (newTotalQty > variant.quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock limit exceeded. Only ${variant.quantity} available.`
      });
    }

    // Max limit per item check (optional, e.g., 5)
    if (newTotalQty > 5) {
      return res.status(400).json({ success: false, message: 'Max 5 items allowed per product.' });
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, size }); // Ensure size is saved in cart item
    }

    await cart.save();

    // Remove from wishlist if exists
    await Wishlist.updateOne(
      { userId: req.session.userId },
      { $pull: { products: productId } }
    );

    res.json({ success: true, message: 'Added to bag!' });
  } catch (err) {
    console.error('Add to cart error:', err);
    res.status(500).json({ success: false, message: 'Could not add to cart' });
  }
});

/**
 * @desc    Update item quantity in cart.
 * @route   PUT /user/cart/update
 * @access  Private (isUser)
 */
router.put('/cart/update', isUser, async (req, res) => {
  try {
    const { productId, quantity, size } = req.body; // Ensure size is passed or fetched

    // We need to know the size to check stock. 
    // If size isn't passed in body, we might need to fetch it from cart first.
    // For now, let's assume the frontend passes the size or we look it up.

    const cart = await Cart.findOne({ userId: req.session.userId })
      .populate('items.productId'); // Minimal populate to get product ID if needed

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    const item = cart.items.find(
      i => i.productId._id.toString() === productId
      // Note: Ideally we should match by size too if we support multiple sizes of same product
      // && i.size === size 
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    // Get the product details (fresh from DB to get stock)
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // We use the size from the cart item if not passed
    const itemSize = size || item.size;
    const variant = product.variants.find(v => v.size == itemSize); // weak check for string/number match

    if (!variant) {
      return res.status(400).json({ success: false, message: 'Variant unavailable' });
    }

    if (quantity > variant.quantity) {
      return res.status(400).json({
        success: false,
        message: `Stock limit exceeded. Only ${variant.quantity} available.`
      });
    }

    if (quantity > 5) {
      return res.status(400).json({ success: false, message: 'Max 5 items allowed per product.' });
    }

    item.quantity = quantity;
    await cart.save();

    // Recalculate totals
    // Need to populate properly for price calc
    const populatedCart = await Cart.findOne({ userId: req.session.userId })
      .populate('items.productId');

    let totalAmount = 0;
    let totalItems = 0;
    populatedCart.items.forEach(i => {
      if (i.productId) {
        totalAmount += i.productId.salePrice * i.quantity;
        totalItems += i.quantity;
      }
    });

    res.json({
      success: true,
      cart: { totalAmount, totalItems }
    });
  } catch (err) {
    console.error('Update cart error:', err);
    res.status(500).json({ success: false, message: 'Could not update cart' });
  }
});

/**
 * @desc    Remove a single item from cart.
 * @route   DELETE /user/cart/remove/:id
 * @access  Private (isUser)
 */
router.delete('/cart/remove/:id', isUser, async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.session.userId })
      .populate({
        path: 'items.productId',
        populate: { path: 'category', select: 'name' }
      });

    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }

    cart.items = cart.items.filter(
      item => item.productId._id.toString() !== req.params.id
    );
    await cart.save();

    // Recalculate totals
    let totalAmount = 0;
    let totalItems = 0;
    cart.items.forEach(i => {
      if (i.productId) {
        totalAmount += i.productId.salePrice * i.quantity;
        totalItems += i.quantity;
      }
    });

    res.json({
      success: true,
      message: 'Removed from bag',
      cart: { totalAmount, totalItems }
    });
  } catch (err) {
    console.error('Remove from cart error:', err);
    res.status(500).json({ success: false, message: 'Could not remove item' });
  }
});

/**
 * @desc    Apply promo code (placeholder).
 * @route   POST /user/cart/promo
 * @access  Private (isUser)
 */
router.post('/cart/promo', isUser, async (req, res) => {
  const { code } = req.body;
  // TODO: Implement promo code validation
  res.json({ success: false, message: 'Invalid promo code' });
});

// ==========================================
// WISHLIST ROUTES
// ==========================================

/**
 * @desc    Render the wishlist page.
 * @route   GET /user/wishlist
 * @access  Private (isUser)
 */
router.get('/wishlist', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId })
      .populate({
        path: 'products',
        populate: { path: 'category', select: 'name' }
      });

    let wishlistItems = [];
    if (wishlist && wishlist.products.length > 0) {
      // Map to match expected template shape
      wishlistItems = wishlist.products
        .filter(p => p) // filter deleted products
        .map(product => ({ productId: product }));
    }

    res.render('User/wishlist', {
      title: 'Wishlist - HOOF',
      layout: 'layouts/user',
      wishlistItems,
    });
  } catch (err) {
    console.error('Wishlist page error:', err);
    res.render('User/wishlist', {
      title: 'Wishlist - HOOF',
      layout: 'layouts/user',
      wishlistItems: [],
    });
  }
});

/**
 * @desc    Add a product to wishlist.
 * @route   POST /user/wishlist/add
 * @access  Private (isUser)
 */
router.post('/wishlist/add', isUser, async (req, res) => {
  try {
    const { productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.session.userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.session.userId, products: [] });
    }

    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    res.json({ success: true, message: 'Added to wishlist!' });
  } catch (err) {
    console.error('Add to wishlist error:', err);
    res.status(500).json({ success: false, message: 'Could not add to wishlist' });
  }
});

/**
 * @desc    Remove a product from wishlist.
 * @route   DELETE /user/wishlist/remove/:id
 * @access  Private (isUser)
 */
router.delete('/wishlist/remove/:id', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.filter(
      p => p.toString() !== req.params.id
    );
    await wishlist.save();

    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Remove from wishlist error:', err);
    res.status(500).json({ success: false, message: 'Could not remove item' });
  }
});

/**
 * @desc    Move all wishlist items to cart.
 * @route   POST /user/wishlist/move-all
 * @access  Private (isUser)
 */
router.post('/wishlist/move-all', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId });
    if (!wishlist || wishlist.products.length === 0) {
      return res.json({ success: false, message: 'Wishlist is empty' });
    }

    let cart = await Cart.findOne({ userId: req.session.userId });
    if (!cart) {
      cart = new Cart({ userId: req.session.userId, items: [] });
    }

    wishlist.products.forEach(productId => {
      const existing = cart.items.find(
        item => item.productId.toString() === productId.toString()
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.items.push({ productId, quantity: 1 });
      }
    });

    await cart.save();

    // Clear wishlist
    wishlist.products = [];
    await wishlist.save();

    res.json({ success: true, message: 'All items moved to bag!' });
  } catch (err) {
    console.error('Move all to cart error:', err);
    res.status(500).json({ success: false, message: 'Could not move items' });
  }
});

/**
 * @desc    Clear entire wishlist.
 * @route   DELETE /user/wishlist/clear
 * @access  Private (isUser)
 */

router.delete('/wishlist/clear', isUser, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.session.userId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }
    res.json({ success: true, message: 'Wishlist cleared' });
  } catch (err) {
    console.error('Clear wishlist error:', err);
    res.status(500).json({ success: false, message: 'Could not clear wishlist' });
  }
});


//Checkout page 
router.get('/checkout', isUser, checkoutController.loadCheckout);
router.post('/checkout', isUser, checkoutController.placeOrder);
router.post('/checkout/place-order', isUser, checkoutController.placeOrderApi);
router.get('/order-success/:id', isUser, checkoutController.loadOrderSuccess);

// Coupons
router.get('/available-coupons', isUser, couponController.getAvailableCoupons);
router.post('/apply-coupon', isUser, couponController.applyCoupon);


router.get('/orders', isUser, userController.loadOrders);
router.get('/orders/:id', isUser, userController.loadOrderDetails);
router.put('/orders/cancel/:id', isUser, userController.cancelOrder);
router.put('/orders/return/:id', isUser, userController.returnOrder);
router.get('/orders/invoice/:id', isUser, userController.downloadInvoice);

module.exports = router;