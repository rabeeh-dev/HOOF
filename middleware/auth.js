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