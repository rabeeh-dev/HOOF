/**
 * @file controllers/user/cart.controller.js
 * @description Controller handling shopping cart HTTP requests: view bag, add items, update quantities, and removal.
 */

const cartService = require('../../services/cart.service');

/**
 * @desc    Render user's shopping bag with availability checks and pricing summaries.
 * @route   GET /user/cart
 * @access  Private (isUser)
 */
exports.getCart = async (req, res) => {
  try {
    const data = await cartService.getCart(req.session.userId);

    res.render('User/cart', {
      title: 'Your Bag - HOOF',
      layout: 'layouts/user',
      cartItems: data.cartItems,
      totalAmount: data.totalAmount,
      totalItems: data.totalItems,
      hasBlockedItems: data.hasBlockedItems,
    });
  } catch (err) {
    console.error('Cart Page Error:', err);
    res.render('User/cart', {
      title: 'Your Bag - HOOF',
      layout: 'layouts/user',
      cartItems: [],
      totalAmount: 0,
      totalItems: 0,
      hasBlockedItems: false,
    });
  }
};

/**
 * @desc    Add a product with variant size to the cart.
 * @route   POST /user/cart/add
 * @access  Private (isUser)
 */
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size } = req.body;
    const userId = req.session.userId;

    const result = await cartService.addToCart({
      userId,
      productId,
      quantity,
      size,
    });

    return res.json(result);
  } catch (err) {
    console.error('Add to Cart Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Could not add to cart',
    });
  }
};

/**
 * @desc    Update quantity of an existing item in cart.
 * @route   PUT /user/cart/update
 * @access  Private (isUser)
 */
exports.updateQuantity = async (req, res) => {
  try {
    const { productId, quantity, size } = req.body;
    const userId = req.session.userId;

    const totals = await cartService.updateQuantity({
      userId,
      productId,
      quantity,
      size,
    });

    return res.json({
      success: true,
      cart: totals,
    });
  } catch (err) {
    console.error('Update Cart Quantity Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Could not update cart',
    });
  }
};

/**
 * @desc    Remove an item completely from cart.
 * @route   DELETE /user/cart/remove/:id
 * @access  Private (isUser)
 */
exports.removeItem = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.userId;

    const totals = await cartService.removeItem({
      userId,
      productId,
    });

    return res.json({
      success: true,
      message: 'Removed from bag',
      cart: totals,
    });
  } catch (err) {
    console.error('Remove Item From Cart Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Could not remove item',
    });
  }
};

/**
 * @desc    Apply promo code at bag level (placeholder).
 * @route   POST /user/cart/promo
 * @access  Private (isUser)
 */
exports.applyPromo = async (req, res) => {
  return res.json({ success: false, message: 'Invalid promo code' });
};
