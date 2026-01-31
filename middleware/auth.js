const User = require("../model/User");

const isUser = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/user/login');
};

const isLoggedOut = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/user/home');
    }
    next();
};

const isAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

const checkBlocked = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);

            if (!user || user.isBlocked) {
                return req.session.destroy((err) => {
                    if (err) console.log("Error destroying session:", err);
                    res.clearCookie("hoof.sid");

                    // Show the 404 page as requested
                    return res.status(404).render("User/404", {
                        layout: "layouts/user",
                        title: "404 Not Found"
                    });
                });
            }
        }
        next();
    } catch (err) {
        console.error("Middleware Block Check Error:", err);
        next();
    }
};

// Export all of them at once
module.exports = {
    isUser,
    isAdmin,
    isLoggedOut,
    checkBlocked
};