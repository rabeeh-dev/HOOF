const wishlistService = require("../services/wishlist.service");

const fetchWishlistCount = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            res.locals.wishlistCount = await wishlistService.getWishlistCount(req.session.userId);
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
