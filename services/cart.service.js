/**
 * @file services/cart.service.js
 * @description Pure business logic for shopping bag operations: retrieval, stock validation, adding, quantity adjustments, and removal.
 */

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Wishlist = require('../models/Wishlist');
const AppError = require('../utils/AppError');
const wishlistService = require('./wishlist.service');

class CartService {
  /**
   * Fetches user cart with populated product details and availability checks.
   * @param {string} userId - User ObjectId string
   * @returns {Promise<Object>} Cart items, totals, and blocked status
   */
  async getCart(userId) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'category', select: 'name isListed' },
    });

    let cartItems = [];
    let totalAmount = 0;
    let totalItems = 0;
    let hasBlockedItems = false;

    if (cart && cart.items && cart.items.length > 0) {
      // Filter out deleted products
      cartItems = cart.items.filter((item) => item.productId);

      cartItems.forEach((item) => {
        const product = item.productId;
        const variant = product.variants
          ? product.variants.find((v) => String(v.size) === String(item.size))
          : null;

        const isProductBlocked = product.isBlocked === true;
        const isCategoryUnlisted = product.category && product.category.isListed === false;
        const isOutOfStock = !variant || item.quantity > variant.quantity;

        const isItemInvalid = isProductBlocked || isCategoryUnlisted || isOutOfStock;

        // Dynamic flag consumed by view
        item.isInvalid = isItemInvalid;

        if (!isItemInvalid) {
          item.totalPrice = product.salePrice * item.quantity;
          totalAmount += item.totalPrice;
          totalItems += item.quantity;
        } else {
          hasBlockedItems = true;
        }
      });
    }

    return {
      cartItems,
      totalAmount,
      totalItems,
      hasBlockedItems,
    };
  }

  /**
   * Adds an item to the user's cart or increments quantity if already present.
   * Also removes the item from the user's wishlist upon successful addition.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.productId
   * @param {number} [params.quantity=1]
   * @param {string} params.size
   * @returns {Promise<Object>} Result message
   */
  async addToCart({ userId, productId, quantity = 1, size }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid product ID', 400);
    }

    const qty = parseInt(quantity, 10) || 1;
    if (qty < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    // 1. Validate Product and Category status
    const product = await Product.findById(productId).populate('category');
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.isBlocked || (product.category && !product.category.isListed)) {
      throw new AppError('This product is currently unavailable.', 400);
    }

    // 2. Validate Variant Stock
    const variant = product.variants ? product.variants.find((v) => String(v.size) === String(size)) : null;
    if (!variant) {
      throw new AppError('Selected size is not available', 404);
    }

    // 3. Find or create Cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && String(item.size) === String(size)
    );

    const currentQty = existingItem ? existingItem.quantity : 0;
    const newTotalQty = currentQty + qty;

    if (newTotalQty > variant.quantity) {
      throw new AppError(`Stock limit exceeded. Only ${variant.quantity} available.`, 400);
    }

    if (newTotalQty > 5) {
      throw new AppError('Max 5 items allowed per product.', 400);
    }

    if (existingItem) {
      existingItem.quantity += qty;
    } else {
      cart.items.push({ productId, quantity: qty, size });
    }

    await cart.save();

    // 4. Remove from wishlist if exists
    await Wishlist.updateOne(
      { userId },
      { $pull: { products: productId } }
    );

    return { success: true, message: 'Added to bag!' };
  }

  /**
   * Updates the quantity of a specific item in the user's cart.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.productId
   * @param {number} params.quantity
   * @param {string} [params.size]
   * @returns {Promise<Object>} Updated cart totals
   */
  async updateQuantity({ userId, productId, quantity, size }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const targetQty = parseInt(quantity, 10);
    if (!targetQty || targetQty < 1) {
      throw new AppError('Quantity must be at least 1', 400);
    }

    if (targetQty > 5) {
      throw new AppError('You can only add a maximum of 5 items per product.', 400);
    }

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    const item = cart.items.find(
      (i) => i.productId && i.productId._id.toString() === productId
    );

    if (!item) {
      throw new AppError('Item not found in cart', 404);
    }

    // Fresh lookup for product and stock validation
    const product = await Product.findById(productId).populate('category');
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.isBlocked || (product.category && !product.category.isListed)) {
      throw new AppError('This product is currently unavailable.', 400);
    }

    const itemSize = size || item.size;
    const variant = product.variants
      ? product.variants.find((v) => String(v.size) === String(itemSize))
      : null;

    if (!variant) {
      throw new AppError('Variant unavailable', 400);
    }

    if (targetQty > variant.quantity) {
      throw new AppError(`Stock limit exceeded. Only ${variant.quantity} available.`, 400);
    }

    item.quantity = targetQty;
    await cart.save();

    // Recalculate totals
    const populatedCart = await Cart.findOne({ userId }).populate('items.productId');
    let totalAmount = 0;
    let totalItems = 0;

    populatedCart.items.forEach((i) => {
      if (i.productId) {
        totalAmount += i.productId.salePrice * i.quantity;
        totalItems += i.quantity;
      }
    });

    return {
      totalAmount,
      totalItems,
    };
  }

  /**
   * Removes an item from the cart and recalculates totals.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.productId
   * @returns {Promise<Object>} Updated cart totals
   */
  async removeItem({ userId, productId }) {
    if (!userId) {
      throw new AppError('User authentication required', 401);
    }

    const cart = await Cart.findOne({ userId }).populate({
      path: 'items.productId',
      populate: { path: 'category', select: 'name' },
    });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    cart.items = cart.items.filter(
      (item) => item.productId && item.productId._id.toString() !== productId
    );
    await cart.save();

    let totalAmount = 0;
    let totalItems = 0;

    cart.items.forEach((i) => {
      if (i.productId) {
        totalAmount += i.productId.salePrice * i.quantity;
        totalItems += i.quantity;
      }
    });

    return {
      totalAmount,
      totalItems,
    };
  }

  /**
   * Retrieves quick total item count in user's cart (used for badges).
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async getCartCount(userId) {
    if (!userId) return 0;
    const cart = await Cart.findOne({ userId }).select('items.quantity').lean();
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((acc, item) => acc + (item.quantity || 0), 0);
  }

  /**
   * Empties user's cart items.
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async clearCart(userId) {
    if (!userId) return;
    await Cart.updateOne({ userId }, { $set: { items: [] } });
  }

  // ==========================================
  // WISHLIST DOMAIN METHODS (Delegated to WishlistService)
  // ==========================================
  getWishlist(userId) {
    return wishlistService.getWishlist(userId);
  }

  addToWishlist(params) {
    return wishlistService.addToWishlist(params);
  }

  removeFromWishlist(params) {
    return wishlistService.removeFromWishlist(params);
  }

  moveAllWishlistToCart(userId) {
    return wishlistService.moveAllToCart(userId);
  }

  clearWishlist(userId) {
    return wishlistService.clearWishlist(userId);
  }

  getWishlistCount(userId) {
    return wishlistService.getWishlistCount(userId);
  }
}

module.exports = new CartService();
