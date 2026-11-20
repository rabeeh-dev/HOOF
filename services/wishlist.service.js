/**
 * @file services/wishlist.service.js
 * @description Pure business logic for customer wishlist management: viewing saved items, adding, removing, clearing, and bulk transfer to bag.
 */

const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');

class WishlistService {
  /**
   * Fetches user's saved items with populated product details and category info.
   * @param {string} userId - User ObjectId string
   * @returns {Promise<Object>} Formatted wishlist items matching view template
   */
  async getWishlist(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: 'products',
      populate: { path: 'category', select: 'name' },
    });

    let wishlistItems = [];
    if (wishlist && wishlist.products && wishlist.products.length > 0) {
      // Filter out deleted products and shape as expected by template
      wishlistItems = wishlist.products
        .filter((p) => p)
        .map((product) => ({ productId: product }));
    }

    return { wishlistItems };
  }

  /**
   * Adds a product to user's wishlist if not already present.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.productId
   * @returns {Promise<Object>}
   */
  async addToWishlist({ userId, productId }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid product ID', 400);
    }

    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
      throw new AppError('Product not found', 404);
    }

    let wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const alreadyInWishlist = wishlist.products.some(
      (id) => id.toString() === productId
    );

    if (!alreadyInWishlist) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    return { success: true, message: 'Added to wishlist!' };
  }

  /**
   * Removes a single product from user's wishlist.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.productId
   * @returns {Promise<Object>}
   */
  async removeFromWishlist({ userId, productId }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist) {
      throw new AppError('Wishlist not found', 404);
    }

    wishlist.products = wishlist.products.filter(
      (p) => p.toString() !== productId
    );
    await wishlist.save();

    return { success: true, message: 'Removed from wishlist' };
  }

  /**
   * Moves all products from user's wishlist to their shopping cart.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async moveAllToCart(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
      return { success: false, message: 'Wishlist is empty' };
    }

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    wishlist.products.forEach((productId) => {
      const existing = cart.items.find(
        (item) => item.productId.toString() === productId.toString()
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

    return { success: true, message: 'All items moved to bag!' };
  }

  /**
   * Clears all products from user's wishlist.
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async clearWishlist(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const wishlist = await Wishlist.findOne({ userId });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    return { success: true, message: 'Wishlist cleared' };
  }

  /**
   * Gets quick count of products in user's wishlist for header badges.
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getWishlistCount(userId) {
    if (!userId) return 0;
    const wishlist = await Wishlist.findOne({ userId }).select('products').lean();
    return wishlist?.products ? wishlist.products.length : 0;
  }
}

module.exports = new WishlistService();
