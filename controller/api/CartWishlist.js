/**
 * @file controller/api/CartWishlist.js
 * @description API Controller for User Cart and Wishlist operations.
 * Returns pure JSON responses suitable for the React frontend.
 */

const Cart = require("../../model/Cart");
const Wishlist = require("../../model/Wishlist");
const Product = require("../../model/Product");

/**
 * @desc    Get the current user's cart populated with product and category info.
 * @route   GET /api/user/cart
 * @access  Private (isUser)
 */
exports.getCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.session.userId })
            .populate({
                path: 'items.productId',
                populate: { path: 'category', select: 'name isListed' }
            });

        let cartItems = [];
        let totalAmount = 0;
        let totalItems = 0;
        let hasBlockedItems = false;

        if (cart && cart.items.length > 0) {
            // Filter out items with null products (deleted products)
            const validItems = cart.items.filter(item => item.productId);
            
            cartItems = validItems.map(item => {
                const product = item.productId;
                const variant = product.variants ? product.variants.find(v => String(v.size) === String(item.size)) : null;
                
                const isProductBlocked = product.isBlocked === true;
                const isCategoryUnlisted = product.category && product.category.isListed === false;
                const isOutOfStock = !variant || item.quantity > variant.quantity;

                const isItemInvalid = isProductBlocked || isCategoryUnlisted || isOutOfStock;
                
                let totalPrice = 0;
                if (!isItemInvalid) {
                    totalPrice = product.salePrice * item.quantity;
                    totalAmount += totalPrice;
                    totalItems += item.quantity;
                } else {
                    hasBlockedItems = true;
                }

                return {
                    _id: item._id,
                    productId: {
                        _id: product._id,
                        productName: product.productName,
                        brand: product.brand,
                        salePrice: product.salePrice,
                        regularPrice: product.regularPrice,
                        productImage: product.productImage,
                        status: product.status,
                        variants: product.variants
                    },
                    quantity: item.quantity,
                    size: item.size,
                    totalPrice,
                    isInvalid: isItemInvalid
                };
            });
        }

        return res.status(200).json({
            success: true,
            cart: {
                items: cartItems,
                totalAmount,
                totalItems,
                hasBlockedItems
            }
        });
    } catch (err) {
        console.error("API getCart error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch cart" });
    }
};

/**
 * @desc    Add an item to the cart (with stock and limit validations).
 * @route   POST /api/user/cart/add
 * @access  Private (isUser)
 */
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1, size } = req.body;

        if (!productId || !size) {
            return res.status(400).json({ success: false, message: 'Product ID and size are required' });
        }

        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.isBlocked || (product.category && !product.category.isListed)) {
            return res.status(400).json({ success: false, message: 'This product is currently unavailable.' });
        }

        const variant = product.variants.find(v => String(v.size) === String(size));
        if (!variant) {
            return res.status(400).json({ success: false, message: 'Size variant is unavailable' });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            cart = new Cart({ userId: req.session.userId, items: [] });
        }

        const existingItem = cart.items.find(
            item => item.productId.toString() === productId && String(item.size) === String(size)
        );

        let currentQty = existingItem ? existingItem.quantity : 0;
        const newTotalQty = currentQty + parseInt(quantity);

        if (newTotalQty > variant.quantity) {
            return res.status(400).json({
                success: false,
                message: `Stock limit exceeded. Only ${variant.quantity} items available.`
            });
        }

        if (newTotalQty > 5) {
            return res.status(400).json({ success: false, message: 'Max 5 items allowed per product.' });
        }

        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
        } else {
            cart.items.push({ productId, quantity: parseInt(quantity), size });
        }

        await cart.save();

        // Pull from wishlist if it exists there
        await Wishlist.updateOne(
            { userId: req.session.userId },
            { $pull: { products: productId } }
        );

        return res.status(200).json({ success: true, message: 'Added to bag!' });
    } catch (err) {
        console.error("API addToCart error:", err);
        return res.status(500).json({ success: false, message: "Could not add to cart" });
    }
};

/**
 * @desc    Update item quantity in cart.
 * @route   PUT /api/user/cart/update
 * @access  Private (isUser)
 */
exports.updateCart = async (req, res) => {
    try {
        const { productId, quantity, size } = req.body;

        if (!productId || !size || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Product ID, size and quantity are required' });
        }

        const cart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        const item = cart.items.find(
            i => i.productId._id.toString() === productId && String(i.size) === String(size)
        );

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }

        const product = await Product.findById(productId).populate('category');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.isBlocked || (product.category && !product.category.isListed)) {
            return res.status(400).json({ success: false, message: 'This product is currently unavailable.' });
        }

        const variant = product.variants.find(v => String(v.size) === String(size));
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

        item.quantity = parseInt(quantity);
        await cart.save();

        // Recalculate totals
        const populatedCart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        let totalAmount = 0;
        let totalItems = 0;
        populatedCart.items.forEach(i => {
            if (i.productId && !i.isInvalid) {
                totalAmount += i.productId.salePrice * i.quantity;
                totalItems += i.quantity;
            }
        });

        return res.status(200).json({
            success: true,
            cart: { totalAmount, totalItems }
        });
    } catch (err) {
        console.error("API updateCart error:", err);
        return res.status(500).json({ success: false, message: "Could not update cart" });
    }
};

/**
 * @desc    Remove an item from the cart.
 * @route   DELETE /api/user/cart/remove
 * @access  Private (isUser)
 */
exports.removeFromCart = async (req, res) => {
    try {
        const { productId, size } = req.body; // Pass size to handle variant removal

        const cart = await Cart.findOne({ userId: req.session.userId }).populate('items.productId');
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }

        cart.items = cart.items.filter(
            item => !(item.productId._id.toString() === productId && String(item.size) === String(size))
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

        return res.status(200).json({
            success: true,
            message: 'Removed from bag',
            cart: { totalAmount, totalItems }
        });
    } catch (err) {
        console.error("API removeFromCart error:", err);
        return res.status(500).json({ success: false, message: "Could not remove item" });
    }
};

/**
 * @desc    Get the current user's wishlist items.
 * @route   GET /api/user/wishlist
 * @access  Private (isUser)
 */
exports.getWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.session.userId })
            .populate({
                path: 'products',
                populate: { path: 'category' }
            });

        let wishlistItems = [];
        if (wishlist && wishlist.products.length > 0) {
            wishlistItems = wishlist.products.filter(p => p && !p.isBlocked);
        }

        return res.status(200).json({
            success: true,
            products: wishlistItems
        });
    } catch (err) {
        console.error("API getWishlist error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch wishlist" });
    }
};

/**
 * @desc    Add product to user's wishlist.
 * @route   POST /api/user/wishlist/add
 * @access  Private (isUser)
 */
exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        let wishlist = await Wishlist.findOne({ userId: req.session.userId });
        if (!wishlist) {
            wishlist = new Wishlist({ userId: req.session.userId, products: [] });
        }

        if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
            await wishlist.save();
        }

        return res.status(200).json({ success: true, message: 'Added to wishlist!' });
    } catch (err) {
        console.error("API addToWishlist error:", err);
        return res.status(500).json({ success: false, message: "Could not add to wishlist" });
    }
};

/**
 * @desc    Remove product from user's wishlist.
 * @route   DELETE /api/user/wishlist/remove
 * @access  Private (isUser)
 */
exports.removeFromWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        if (!productId) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        const wishlist = await Wishlist.findOne({ userId: req.session.userId });
        if (!wishlist) {
            return res.status(404).json({ success: false, message: 'Wishlist not found' });
        }

        wishlist.products = wishlist.products.filter(p => p.toString() !== productId.toString());
        await wishlist.save();

        return res.status(200).json({ success: true, message: 'Removed from wishlist' });
    } catch (err) {
        console.error("API removeFromWishlist error:", err);
        return res.status(500).json({ success: false, message: "Could not remove item" });
    }
};

/**
 * @desc    Move all wishlist items to the cart.
 * @route   POST /api/user/wishlist/move-all
 * @access  Private (isUser)
 */
exports.moveAllToCart = async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ userId: req.session.userId });
        if (!wishlist || wishlist.products.length === 0) {
            return res.status(200).json({ success: false, message: 'Wishlist is empty' });
        }

        let cart = await Cart.findOne({ userId: req.session.userId });
        if (!cart) {
            cart = new Cart({ userId: req.session.userId, items: [] });
        }

        // Fetch products to check variants/sizes.
        // Since EJS move-all just picks the first variant (or default size), we check variant availability.
        for (const productId of wishlist.products) {
            const product = await Product.findById(productId);
            if (!product || product.isBlocked) continue;

            const firstAvailableVariant = product.variants ? product.variants.find(v => v.quantity > 0) : null;
            if (!firstAvailableVariant) continue;

            const size = firstAvailableVariant.size;

            const existing = cart.items.find(
                item => item.productId.toString() === productId.toString() && String(item.size) === String(size)
            );

            if (existing) {
                if (existing.quantity < 5 && existing.quantity < firstAvailableVariant.quantity) {
                    existing.quantity += 1;
                }
            } else {
                cart.items.push({ productId, quantity: 1, size });
            }
        }

        await cart.save();

        // Clear wishlist
        wishlist.products = [];
        await wishlist.save();

        return res.status(200).json({ success: true, message: 'All items moved to bag!' });
    } catch (err) {
        console.error("API moveAllToCart error:", err);
        return res.status(500).json({ success: false, message: "Could not move items" });
    }
};

/**
 * @desc    Get live cart and wishlist item counts.
 * @route   GET /api/user/counts
 * @access  Private (isUser)
 */
exports.getCounts = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(200).json({ success: true, cartCount: 0, wishlistCount: 0 });
        }

        const [cart, wishlist] = await Promise.all([
            Cart.findOne({ userId: req.session.userId }),
            Wishlist.findOne({ userId: req.session.userId })
        ]);

        let cartCount = 0;
        if (cart && cart.items.length > 0) {
            // Count total items quantity in cart
            cartCount = cart.items.reduce((sum, item) => sum + (item.productId ? item.quantity : 0), 0);
        }

        let wishlistCount = 0;
        if (wishlist && wishlist.products.length > 0) {
            wishlistCount = wishlist.products.length;
        }

        return res.status(200).json({
            success: true,
            cartCount,
            wishlistCount
        });
    } catch (err) {
        console.error("API getCounts error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch counts" });
    }
};
