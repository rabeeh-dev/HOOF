/**
 * @file middleware/auth.js
 * @description General authentication middleware for users and common access checks.
 */

const User = require("../model/User");

/**
 * Middleware to ensure the requester is a logged-in user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const isUser = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    // For AJAX/fetch requests, return JSON so frontend can handle redirect
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.status(401).json({ success: false, message: 'Login required', redirect: '/user/login' });
    }
    res.redirect('/user/login');
};

/**
 * Middleware to ensure the user is logged out (e.g., to access login page).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const isLoggedOut = (req, res, next) => {
    if (req.session && req.session.userId) {
        return res.redirect('/user/home');
    }
    next();
};

/**
 * Middleware to check if the session belongs to an admin.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const isAdmin = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.redirect('/admin/login');
};

/**
 * Middleware to check if the active user is blocked.
 * If blocked, destroys the session and redirects to a 404 page.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const checkBlocked = async (req, res, next) => {
    try {
        if (req.session.userId) {
            const user = await User.findById(req.session.userId);

            if (!user || user.isBlocked) {
                return req.session.destroy((err) => {
                    if (err) console.log("Error destroying session:", err);
                    res.clearCookie("hoof.sid");

                    // Render 404 page for blocked accounts
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

module.exports = {
    isUser,
    isAdmin,
    isLoggedOut,
    checkBlocked
};