/**
 * @file middleware/adminAuth.js
 * @description Authentication middleware for ensuring administrative access.
 */

/**
 * Middleware to check if an admin is logged in.
 * If not logged in, redirects to the admin login page.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const isLogin = async (req, res, next) => {
    try {
        if (req.session.adminId) {
            next();
        } else {
            res.redirect('/admin/login');
        }
    } catch (error) {
        console.error("Admin Auth Middleware Error (isLogin):", error.message);
        res.status(500).send("Internal Server Error");
    }
};


/**
 * Middleware to check if an admin is already logged in (used on login page).
 * If logged in, redirects to the admin dashboard.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const isLogout = async (req, res, next) => {
    try {
        if (req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        next();
    } catch (error) {
        console.error("Admin Auth Middleware Error (isLogout):", error.message);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { isLogin, isLogout };