const Admin = require("../model/Admin");
const User = require("../model/User");
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit-table");

/* =============================================================================
   ADMIN AUTHENTICATION SECTION
============================================================================= */

/**
 * @route   GET /admin/login
 * @desc    Renders the admin login page (Redirects if already logged in)
 * @access  Public (Guest Only)
 */
exports.loadLogin = async (req, res) => {
    try {
        if (req.session.adminId) {
            return res.redirect('/admin/dashboard');
        }
        res.render('Admin/auth/login', { message: null });
    } catch (error) {
        console.error("Load Login Error:", error.message);
        res.status(500).send("Internal Server Error");
    }
};

/**
 * @route   POST /admin/login
 * @desc    Verifies admin credentials and establishes an admin session
 * @access  Public
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
 * @route   GET /admin/logout
 * @desc    Destroys the admin session and clears local cookies
 * @access  Private (Admin Only)
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

/* =============================================================================
   ADMIN DASHBOARD & DASHBOARD METRICS
============================================================================= */

/**
 * @route   GET /admin/dashboard
 * @desc    Renders the main admin analytics dashboard
 * @access  Private (Admin Only)
 */
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

/* =============================================================================
   USER MANAGEMENT SECTION
============================================================================= */

/**
 * @route   GET /admin/users
 * @desc    Fetch and display all users with pagination support
 * @access  Private (Admin Only)
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
            title: "Customers | HOOF Admin"
        });
    } catch (error) {
        console.error("Load Customers Error:", error.message);
        res.status(500).send("Error loading customer data");
    }
};

/**
 * @route   PATCH /admin/users/:id/:action
 * @desc    Toggles the isBlocked status of a specific user
 * @access  Private (Admin Only)
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
 * @route   GET /admin/users/export-pdf
 * @desc    Generates and downloads a PDF report of all users
 * @access  Private (Admin Only)
 */
exports.exportUsersPDF = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });

        // Create a new PDF document
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

        // --- TABLE ---
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
        // pdfkit-table's table() method automatically handles new pages
        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, indexColumn, indexRow, rect, rowData) => {
                doc.font("Helvetica").fontSize(10);
                // Optional: Stripe rows
                if (indexRow % 2 === 0) {
                    doc.addBackground(rect, '#f0f0f0', 0.15); // light gray
                }

                // Color status text if needed (simulated by checking value in renderer - pdfkit-table is simpler)
            }
        });

        // Finalize the PDF and end the stream
        doc.end();

    } catch (error) {
        console.error("PDF Export Error:", error);
        res.status(500).send("Error generating PDF");
    }
};