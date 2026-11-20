/**
 * @file controllers/user/wishlist.controller.js
 * @description Controller handling customer wishlist actions: view saved items, add, remove, clear, and transfer to cart.
 */

const wishlistService = require('../../services/wishlist.service');

/**
 * @desc    Render user's wishlist page with saved sneaker items.
 * @route   GET /user/wishlist
 * @access  Private (isUser)
 */
exports.getWishlist = async (req, res) => {
  try {
    const data = await wishlistService.getWishlist(req.session.userId);

    res.render('User/wishlist', {
      title: 'Wishlist - HOOF',
      layout: 'layouts/user',
      wishlistItems: data.wishlistItems,
    });
  } catch (err) {
    console.error('Wishlist Page Error:', err);
    res.render('User/wishlist', {
      title: 'Wishlist - HOOF',
      layout: 'layouts/user',
      wishlistItems: [],
    });
  }
};

/**
 * @desc    Save a product to the user's wishlist.
 * @route   POST /user/wishlist/add
 * @access  Private (isUser)
 */
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    const userId = req.session.userId;

    const result = await wishlistService.addToWishlist({
      userId,
      productId,
    });

    return res.json(result);
  } catch (err) {
    console.error('Add to Wishlist Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Could not add to wishlist',
    });
  }
};

/**
 * @desc    Remove an item from the user's wishlist.
 * @route   DELETE /user/wishlist/remove/:id
 * @access  Private (isUser)
 */
exports.removeFromWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.session.userId;

    const result = await wishlistService.removeFromWishlist({
      userId,
      productId,
    });

    return res.json(result);
  } catch (err) {
    console.error('Remove from Wishlist Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Could not remove item',
    });
  }
};

/**
 * @desc    Move all wishlist items to user's shopping bag.
 * @route   POST /user/wishlist/move-all
 * @access  Private (isUser)
 */
exports.moveAllToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await wishlistService.moveAllToCart(userId);
    return res.json(result);
  } catch (err) {
    console.error('Move All to Cart Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Could not move items',
    });
  }
};

/**
 * @desc    Clear all items from wishlist.
 * @route   DELETE /user/wishlist/clear
 * @access  Private (isUser)
 */
exports.clearWishlist = async (req, res) => {
  try {
    const userId = req.session.userId;
    const result = await wishlistService.clearWishlist(userId);
    return res.json(result);
  } catch (err) {
    console.error('Clear Wishlist Error:', err.message);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Could not clear wishlist',
    });
  }
};
