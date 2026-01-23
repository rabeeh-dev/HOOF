const Admin = require("../model/adminModel"); // Ensure the path matches your folder name (model or models)
const bcrypt = require("bcrypt");

// 1. Load the existing sign-in page
exports.loadLogin = async (req, res) => {
    try {
        // If already logged in as admin, don't show login page
        if (req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        res.render('Admin/auth/login', { message: null }); 
    } catch (error) {
        console.error("Load Login Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

// 2. Handle the sign-in logic
exports.verifyAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const adminData = await Admin.findOne({ email: email.trim() });

        if (adminData) {
            const passwordMatch = await bcrypt.compare(password, adminData.password);
            if (passwordMatch) {
                req.session.adminId = adminData._id;
                // Send JSON for the fetch call
                return res.status(200).json({ success: true });
            }
        }
        
        // If it fails, send JSON error
        return res.status(401).json({ success: false, message: "Invalid email or password" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 3. Load Admin Dashboard (CRITICAL: Added this to fix your crash)
exports.loadDashboard = async (req, res) => {
    try {
        // You can fetch stats here later (total users, total orders, etc.)
        res.render('Admin/admin-dashboard', { 
            title: "Admin Dashboard | HOOF" 
        });
    } catch (error) {
        console.error("Load Dashboard Error:", error.message);
        res.redirect('/admin/login');
    }
};

// 4. Admin Logout
exports.logout = async (req, res) => {
    try {
        // Specifically delete only the admin session ID
        delete req.session.adminId;
        res.redirect('/admin/login');
    } catch (error) {
        console.error("Logout Error:", error.message);
        res.redirect('/admin/dashboard');
    }
};