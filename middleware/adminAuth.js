const isLogin = async (req, res, next) => {
    try {
        if (req.session.adminId) {
            next(); 
        } else {
            res.redirect('/admin/login'); 
        }
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

const isLogout = async (req, res, next) => {
    try {
        if (req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

module.exports = { isLogin, isLogout };