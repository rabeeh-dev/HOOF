// middleware/auth.js

const isUser = (req, res, next) => {
    // Check our custom session instead of Passport
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/user/login'); 
};

const isLoggedOut = (req, res, next) => {
    // If session exists, don't let them see Login/Signup
    if (req.session && req.session.userId) {
        return res.redirect('/user/home');
    }
    next();
};

// Middleware to check status on every page load
const checkBlocked = async (req, res, next) => {
    if (req.session.user) {
        const user = await User.findById(req.session.user._id);
        if (user && user.isBlocked) {
            req.session.destroy(); // Boot them out
            return res.redirect('/login?message=Account Suspended');
        }
    }
    next();
};

const isAdmin = (req, res, next) => {
    // Future implementation for Admin
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

module.exports = {
    isUser,
    isAdmin,
    isLoggedOut
};