const cartService = require("../services/cart.service");

const fetchCartCount = async (req, res, next) => {
    if (req.session && req.session.userId) {
        try {
            res.locals.cartCount = await cartService.getCartCount(req.session.userId);
        } catch (error) {
            console.error("Error fetching cart count:", error);
            res.locals.cartCount = 0;
        }
    } else {
        res.locals.cartCount = 0;
    }
    next();
};

module.exports = fetchCartCount;
