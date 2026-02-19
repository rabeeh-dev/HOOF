const Wishlist = require("../model/Wishlist");

const fetchWishlistCount = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const wishlist = await Wishlist.findOne({ userId: req.session.userId });
            res.locals.wishlistCount = wishlist ? wishlist.products.length : 0;
        } catch (error) {
            console.error("Error fetching wishlist count:", error);
            res.locals.wishlistCount = 0;
        }
    } else {
        res.locals.wishlistCount = 0;
    }
    next();
};

module.exports = fetchWishlistCount;
