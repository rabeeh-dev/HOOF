/**
 * @file controller/adminController.js
 * @description Controller for administrative operations, including authentication, dashboard metrics, customer management, and category management.
 */

const Admin = require("../model/Admin");
const User = require("../model/User");
const Category = require("../model/Category");
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit-table");
const adminProductService = require("../services/AdminProduct");

// ==========================================
// ADMIN AUTHENTICATION SECTION
// ==========================================

/**
 * @desc    Renders the admin login page (Redirects if already logged in).
 * @route   GET /admin/login
 * @access  Public (Guest Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadLogin = async (req, res) => {
    try {
        if (req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        res.render('Admin/auth/login', { layout: false, message: null });
    } catch (error) {
        console.error("Load Login Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

/**
 * @desc    Verifies admin credentials and establishes an admin session.
 * @route   POST /admin/login
 * @access  Public
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
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

/**
 * @desc    Destroys the admin session and clears local cookies.
 * @route   GET /admin/logout
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log("Logout error:", err);
            return res.redirect('/admin/dashboard');
        }
        res.clearCookie('connect.sid');
        res.redirect('/admin/login');
    });
};

// ==========================================
// ADMIN DASHBOARD & METRICS
// ==========================================

/**
 * @desc    Renders the main admin analytics dashboard.
 * @route   GET /admin/dashboard
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadDashboard = async (req, res) => {
    try {
        res.render('Admin/admin-dashboard', {
            title: "Admin Dashboard | HOOF",
            layout: false
        });
    } catch (error) {
        console.error("Load Dashboard Error:", error.message);
        res.redirect('/admin/login');
    }
};

// ==========================================
// USER MANAGEMENT SECTION
// ==========================================

/**
 * @desc    Fetch and display all users with pagination support.
 * @route   GET /admin/users
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
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
            title: "Customers | HOOF Admin",
            layout: false
        });
    } catch (error) {
        console.error("Load Customers Error:", error.message);
        res.status(500).send("Error loading customer data");
    }
};

/**
 * @desc    Toggles the isBlocked status of a specific user.
 * @route   PATCH /admin/users/:id/:action
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
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

/**
 * @desc    Generates and downloads a PDF report of all users.
 * @route   GET /admin/users/export-pdf
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.exportUsersPDF = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });

        // Create a new PDF document using pdfkit-table
        const doc = new PDFDocument({ margin: 30, size: 'A4' });

        // Set response headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", "attachment; filename=customers-report.pdf");

        // Pipe the PDF into the response
        doc.pipe(res);

        // --- HEADER ---
        doc.fontSize(20).text("HOOF - Customer Report", { align: "center" });
        doc.moveDown();
        doc.fontSize(10).text(`Generated on: ${new Date().toLocaleString()}`, { align: "center" });
        doc.moveDown(2);

        // --- TABLE DEFINITION ---
        const table = {
            title: "User List",
            headers: [
                { label: "Name", property: "name", width: 100 },
                { label: "Email", property: "email", width: 150 },
                { label: "Phone", property: "phone", width: 100 },
                { label: "Joined Date", property: "date", width: 100 },
                { label: "Status", property: "status", width: 80 }
            ],
            rows: users.map(user => [
                user.fullName || "N/A",
                user.email || "N/A",
                user.phone || "N/A",
                new Date(user.createdAt).toLocaleDateString(),
                user.isBlocked ? "Blocked" : "Active"
            ])
        };

        // Draw the table
        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, indexColumn, indexRow, rect, rowData) => {
                doc.font("Helvetica").fontSize(10);
                // Alternate background color for rows
                if (indexRow % 2 === 0) {
                    doc.addBackground(rect, '#f0f0f0', 0.15);
                }
            }
        });

        // Finalize the PDF
        doc.end();

    } catch (error) {
        console.error("PDF Export Error:", error);
        res.status(500).send("Error generating PDF");
    }
};

// ==========================================
// CATEGORY MANAGEMENT SECTION
// ==========================================

/**
 * @desc    Fetch and display all categories with pagination and search.
 * @route   GET /admin/categories
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';

        const { categories, totalPages, currentPage } =
            await adminProductService.getAllCategoriesAdmin(page, 5, search);

        res.render("Admin/category-management", {
            categories,
            totalPages,
            currentPage,
            search,
            title: "Category Management | HOOF Admin",
            layout: false
        });
    } catch (error) {
        console.error("Load Categories Error:", error);
        res.redirect("/admin/dashboard");
    }
};

/**
 * @desc    Create a new category.
 * @route   POST /admin/categories/add
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const normalizedName = name.trim();

        // Case-insensitive check for existing category
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${normalizedName}$`, 'i') }
        });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Category already exists" });
        }

        const newCategory = new Category({
            name: normalizedName,
            description: description.trim()
        });

        await newCategory.save();
        res.status(201).json({ success: true, message: "Category added successfully" });

    } catch (error) {
        console.error("Add Category Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Update an existing category's details.
 * @route   PATCH /admin/categories/edit/:id
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const normalizedName = name.trim();

        // Check if new name exists in another category
        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Another category with this name already exists" });
        }

        await Category.findByIdAndUpdate(id, {
            name: normalizedName,
            description: description.trim()
        });

        res.json({ success: true, message: "Category updated successfully" });

    } catch (error) {
        console.error("Update Category Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Toggle the isListed status of a category.
 * @route   PATCH /admin/categories/toggle-status/:id
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }

        category.isListed = !category.isListed;
        await category.save();

        res.json({ success: true, message: `Category ${category.isListed ? 'listed' : 'unlisted'} successfully` });

    } catch (error) {
        console.error("Toggle Category Status Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};