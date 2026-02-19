const Cart = require("../model/Cart");

const fetchCartCount = async (req, res, next) => {
    if (req.session.userId) {
        try {
            const cart = await Cart.findOne({ userId: req.session.userId });
            let count = 0;
            if (cart && cart.items) {
                cart.items.forEach(item => {
                    count += item.quantity;
                });
            }
            res.locals.cartCount = count;
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
