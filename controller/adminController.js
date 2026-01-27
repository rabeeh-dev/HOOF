const Admin = require("../model/adminModel");
const User = require("../model/userModels");
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
                
                return res.status(200).json({ success: true });
            }
        }
        
        return res.status(401).json({ success: false, message: "Invalid email or password" });

    } catch (error) {
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// 3. Load Admin Dashboard (CRITICAL: Added this to fix your crash)
exports.loadDashboard = async (req, res) => {
    try {
        res.render('Admin/admin-dashboard', { 
            title: "Admin Dashboard | HOOF" 
        });
    } catch (error) {
        console.error("Load Dashboard Error:", error.message);
        res.redirect('/admin/login');
    }
};



//loadCustomers
exports.loadCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const totalUsers = await User.countDocuments({});
        
        
        const users = await User.find({})
            .select("-password") 
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

        res.render('Admin/user-management', {
            users,
            currentPage: page,
            totalPages: Math.ceil(totalUsers / limit) || 1,
            title: "Customers | HOOF Admin"
        });
    } catch (error) {
        console.error("Load Customers Error:", error.message);
        res.status(500).send("Error loading customer data");
    }
};

// Logic for Blocking/Unblocking
exports.toggleUserStatus = async (req, res) => {
    try {
        const { id, action } = req.params;

        const blockStatus = (action === 'block'); 

        const updatedUser = await User.findByIdAndUpdate(
            id, 
            { isBlocked: blockStatus }, 
            { new: true }
        );

        if (updatedUser) {
            res.json({ success: true });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Update Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// 4. Admin Logout
exports.logout = (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
      if (err) {
        console.log("Logout error:", err);
        return res.redirect('/admin/dashboard');
      }
      // Clear the cookie
      res.clearCookie('connect.sid'); 
      res.redirect('/admin/login');
    });
};