const isLogin = async (req, res, next) => {
    try {
        if (req.session.adminId) {
            next(); // Admin is logged in, proceed
        } else {
            res.redirect('/admin/login'); // Not logged in, send to login page
        }
    } catch (error) {
        console.log(error.message);
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.adminId) {
            res.redirect('/admin/dashboard'); // Already logged in, skip login page
        } else {
            next();
        }
    } catch (error) {
        console.log(error.message);
    }
};

module.exports = { isLogin, isLogout };