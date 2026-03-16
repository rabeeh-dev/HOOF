/**
 * @file controller/adminController.js
 * @description Controller for administrative operations, including authentication, dashboard metrics, customer management, and category management.
 */

const Admin = require("../model/Admin");
const User = require("../model/User");
const Category = require("../model/Category");
const Order = require("../model/Order");
const Product = require("../model/Product");

const PDFDocument = require('pdfkit-table');
const bcrypt = require("bcrypt");
const adminProductService = require("../services/AdminProduct");
const walletService = require("../services/Wallet");

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
 * @desc    Renders the main admin analytics dashboard with real data.
 * @route   GET /admin/dashboard
 * @access  Private (Admin Only)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadDashboard = async (req, res) => {
    try {
        const { filter = 'daily', startDate, endDate, ajax = false } = req.query;

        // Match condition for date filtering
        let matchStage = { status: 'DELIVERED' };
        let dateFilter = {};
        const now = new Date();

        if (filter === 'daily') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            dateFilter = { $match: { createdAt: { $gte: startOfDay } } };
        } else if (filter === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            dateFilter = { $match: { createdAt: { $gte: lastWeek } } };
        } else if (filter === 'yearly') {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            dateFilter = { $match: { createdAt: { $gte: oneYearAgo } } };
        } else if (filter === 'custom' && startDate && endDate) {
            dateFilter = {
                $match: {
                    createdAt: {
                        $gte: new Date(startDate),
                        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
                    }
                }
            };
        }

        // --- Stats Cards ---
        const revenueAggregation = [
            { $match: { status: 'DELIVERED' } }
        ];
        if (Object.keys(dateFilter).length > 0) revenueAggregation.push(dateFilter);
        revenueAggregation.push({ $group: { _id: null, total: { $sum: '$totalAmount' } } });

        const [revenueResult] = await Order.aggregate(revenueAggregation);
        const totalRevenue = revenueResult ? revenueResult.total : 0;

        const orderCountAggregation = [];
        if (Object.keys(dateFilter).length > 0) orderCountAggregation.push(dateFilter);
        orderCountAggregation.push({ $count: 'total' });

        const [orderCountResult] = await Order.aggregate(orderCountAggregation);
        const totalOrders = orderCountResult ? orderCountResult.total : 0;

        const totalCustomers = await User.countDocuments({});
        const totalProducts = await Product.countDocuments({ isBlocked: false });

        // --- Chart Data Generation ---
        let chartData = [];
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        if (filter === 'daily') {
            const hourlySalesRaw = await Order.aggregate([
                { $match: { status: 'DELIVERED', createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: { hour: { $hour: '$createdAt' } },
                        revenue: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.hour': 1 } }
            ]);

            for (let i = 23; i >= 0; i--) {
                const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
                const hour = hourDate.getHours();
                const found = hourlySalesRaw.find(h => h._id.hour === hour);
                chartData.push({
                    label: `${hour}:00`,
                    revenue: found ? found.revenue : 0,
                    count: found ? found.count : 0
                });
            }
        } else if (filter === 'weekly') {
            const dailySalesRaw = await Order.aggregate([
                { $match: { status: 'DELIVERED', createdAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } } },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        revenue: { $sum: '$totalAmount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);

            for (let i = 6; i >= 0; i--) {
                const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                const day = d.getDate();
                const month = d.getMonth() + 1;
                const year = d.getFullYear();
                const found = dailySalesRaw.find(ds => ds._id.year === year && ds._id.month === month && ds._id.day === day);
                chartData.push({
                    label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
                    revenue: found ? found.revenue : 0,
                    count: found ? found.count : 0
                });
            }
        } else {
            const aggregationPipeline = [
                { $match: { status: 'DELIVERED' } }
            ];
            if (Object.keys(dateFilter).length > 0) aggregationPipeline.push(dateFilter);

            aggregationPipeline.push({
                $group: {
                    _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
                    revenue: { $sum: '$totalAmount' },
                    count: { $sum: 1 }
                }
            });
            aggregationPipeline.push({ $sort: { '_id.year': 1, '_id.month': 1 } });

            const monthlySalesRaw = await Order.aggregate(aggregationPipeline);

            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const year = d.getFullYear();
                const month = d.getMonth() + 1;
                const found = monthlySalesRaw.find(m => m._id.year === year && m._id.month === month);
                chartData.push({
                    label: `${monthNames[month - 1]} ${year}`,
                    revenue: found ? found.revenue : 0,
                    count: found ? found.count : 0
                });
            }
        }
        const monthlySales = chartData;

        // --- Order Status Breakdown ---
        const statusBreakdownRaw = await Order.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const statusBreakdown = {};
        statusBreakdownRaw.forEach(s => { statusBreakdown[s._id] = s.count; });

        // --- Top 5 Selling Products ---
        const topProducts = await Order.aggregate([
            { $match: { status: { $nin: ['CANCELLED'] } } },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.productName' },
                    image: { $first: '$items.productImage' },
                    totalSold: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } }
                }
            },
            { $sort: { totalSold: -1 } },
            { $limit: 5 }
        ]);

        // --- Recent 5 Orders ---
        const recentOrders = await Order.find({})
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .limit(5);

        // --- Low Stock Alerts (variants with quantity <= 5) ---
        const lowStockProducts = await Product.aggregate([
            { $match: { isBlocked: false } },
            { $unwind: '$variants' },
            { $match: { 'variants.quantity': { $lte: 5 } } },
            {
                $project: {
                    productName: 1,
                    variantSize: '$variants.size',
                    variantQty: '$variants.quantity',
                    productImage: { $arrayElemAt: ['$productImage', 0] }
                }
            },
            { $sort: { variantQty: 1 } },
            { $limit: 6 }
        ]);

        // --- Category-wise Sales ---
        const categorySalesRaw = await Order.aggregate([
            { $match: { status: 'DELIVERED' } },
            { $unwind: '$items' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'items.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'product.category',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$category.name',
                    totalRevenue: { $sum: { $multiply: ['$items.priceAtPurchase', '$items.quantity'] } },
                    totalSold: { $sum: '$items.quantity' }
                }
            },
            { $sort: { totalRevenue: -1 } },
            { $limit: 8 }
        ]);
        const categorySales = categorySalesRaw.filter(c => c._id != null);

        if (ajax) {
            return res.json({
                stats: {
                    totalRevenue,
                    totalOrders,
                    totalCustomers,
                    totalProducts
                },
                monthlySales,
                statusBreakdown,
                categorySales
            });
        }

        res.render('Admin/admin-dashboard', {
            title: "Admin Dashboard | HOOF",
            layout: false,
            stats: {
                totalRevenue,
                totalOrders,
                totalCustomers,
                totalProducts
            },
            monthlySales,
            statusBreakdown,
            topProducts,
            recentOrders,
            lowStockProducts,
            categorySales,
            activeFilter: filter,
            query: req.query
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
        const limit = 5;
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

// ==========================================
// ORDER MANAGEMENT SECTION
// ==========================================

/**
 * @desc    Load order management list with filters, search, and stats.
 * @route   GET /admin/orders
 * @access  Private (Admin Only)
 */
exports.loadOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const { status, payment, search } = req.query;
        let query = {
            // Exclude UPI orders where payment was never completed
            $nor: [{ paymentMethod: 'upi', paymentStatus: 'Pending' }]
        };

        if (status) query.status = status;
        if (payment) query.paymentMethod = payment;
        if (search) {
            const cleanSearch = search.replace('#', '').trim();
            const searchRegex = new RegExp(cleanSearch, 'i');

            // Build the base $or array for string fields
            query.$or = [
                { 'shippingAddress.fullName': searchRegex },
                { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: searchRegex } } }
            ];

            // If the search string is a valid 24-character hex string, we can search by exact _id
            if (/^[0-9a-fA-F]{24}$/.test(cleanSearch)) {
                query.$or.push({ _id: cleanSearch });
            }
        }

        const totalOrders = await Order.countDocuments(query);
        const orders = await Order.find(query)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        // Stats aggregation
        const stats = {
            total: await Order.countDocuments({}),
            pending: await Order.countDocuments({ status: 'Pending' }),
            processing: await Order.countDocuments({ status: 'Processing' }),
            delivered: await Order.countDocuments({ status: 'DELIVERED' }),
            totalRevenue: (await Order.aggregate([
                { $match: { status: 'DELIVERED' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]))[0]?.total || 0
        };

        res.render('Admin/admin-orders', {
            orders,
            currentPage: page,
            totalPages: Math.ceil(totalOrders / limit) || 1,
            totalOrders,
            selectedStatus: status || '',
            selectedPayment: payment || '',
            search: search || '',
            stats,
            title: "Orders | HOOF Admin",
            layout: false
        });
    } catch (error) {
        console.error("Load Orders Error:", error.message);
        res.status(500).send("Error loading orders");
    }
};

/**
 * @desc    Render a dedicated order detail page.
 * @route   GET /admin/orders/:id
 * @access  Private (Admin Only)
 */
exports.loadOrderDetailPage = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'fullName email phone')
            .populate('items.productId');
        if (!order) return res.redirect('/admin/orders');

        // Enrich items with variant info
        const enrichedItems = order.items.map(item => {
            const obj = item.toObject();
            let displaySize = obj.variantSize || '';
            // Fallback for older orders that didn't save variant size
            if (!displaySize && obj.productId && obj.productId.variants) {
                if (obj.productId.variants.length === 1) {
                    displaySize = obj.productId.variants[0].size;
                }
            }
            obj.displaySize = displaySize;
            return obj;
        });

        // Convert order to plain object and attach enriched items
        const orderObj = order.toObject();
        orderObj.items = enrichedItems;
        // Keep the _id as proper ObjectId string for template usage
        orderObj._id = order._id;
        orderObj.userId = order.userId;

        res.render('Admin/admin-order-detail', {
            order: orderObj,
            title: `Order #${String(order._id).slice(-8).toUpperCase()} | HOOF Admin`,
            layout: false
        });
    } catch (error) {
        console.error("Load Order Detail Error:", error.message);
        res.redirect('/admin/orders');
    }
};

/**
 * @desc    Fetch single order details for modal.
 * @route   GET /admin/orders/:id/detail
 * @access  Private (Admin Only)
 */
exports.getOrderDetail = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('userId', 'fullName email')
            .populate('items.productId');
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });
        res.json({ success: true, order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update order status and history.
 * @route   PATCH /admin/orders/:id/status
 * @access  Private (Admin Only)
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const { status, notes } = req.body;
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const currentStatus = order.status;

        // Define allowed transitions (allowing forward jumps)
        const allowedTransitions = {
            'Pending': ['Processing', 'SHIPPED', 'Out for Delivery', 'DELIVERED', 'CANCELLED'],
            'Processing': ['SHIPPED', 'Out for Delivery', 'DELIVERED', 'CANCELLED'],
            'SHIPPED': ['Out for Delivery', 'DELIVERED', 'CANCELLED'],
            'Out for Delivery': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': ['DELIVERED'], // Allow self-transition to trigger payment updates
            'CANCELLED': ['CANCELLED'], // Allow self-transition
            'Return Requested': ['Return Approved', 'Returned', 'CANCELLED'],
            'Return Approved': ['Picked Up', 'Returned', 'CANCELLED'],
            'Picked Up': ['Returned', 'CANCELLED'],
            'Returned': ['Returned']   // Terminal self-transition
        };

        const allowed = allowedTransitions[currentStatus] || [];

        if (!allowed.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid transition: cannot change status from "${currentStatus}" to "${status}".`
            });
        }

        order.status = status;
        order.statusHistory.push({
            status,
            note: notes || `Status updated to ${status} by admin`
        });

        // Auto-update payment status if delivered
        if (status === 'DELIVERED') {
            if (order.paymentMethod === 'COD') {
                order.paymentStatus = 'SUCCESS';
            } else {
                order.paymentStatus = 'Paid';
            }
        }

        // Credit wallet when order is returned (refund)
        if (status === 'Returned') {
            const shortId = String(order._id).slice(-8).toUpperCase();
            await walletService.creditWallet(
                order.userId,
                order.totalAmount,
                `Refund for returned order #${shortId}`,
                order._id
            );
            order.paymentStatus = 'Refunded';
        }

        await order.save();
        res.json({ success: true, message: "Status updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Cancel order from admin side.
 * @route   PATCH /admin/orders/:id/cancel
 * @access  Private (Admin Only)
 */
exports.cancelOrderAdmin = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        // Cannot cancel a delivered or already cancelled order
        if (order.status === 'DELIVERED') {
            return res.status(400).json({ success: false, message: "Delivered orders cannot be cancelled." });
        }
        if (order.status === 'CANCELLED') {
            return res.status(400).json({ success: false, message: "Order is already cancelled." });
        }

        order.status = 'CANCELLED';
        order.statusHistory.push({
            status: 'CANCELLED',
            note: 'Cancelled by administrator'
        });

        // Refund to wallet if payment was already made
        if (order.paymentStatus === 'SUCCESS' || order.paymentStatus === 'Paid') {
            const shortId = String(order._id).slice(-8).toUpperCase();
            await walletService.creditWallet(
                order.userId,
                order.totalAmount,
                `Refund for cancelled order #${shortId} (by admin)`,
                order._id
            );
            order.paymentStatus = 'Refunded';
        }

        await order.save();
        res.json({ success: true, message: "Order cancelled successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Export Sales Report as PDF.
 * @route   GET /admin/dashboard/export
 * @access  Private (Admin Only)
 */
exports.exportSalesReport = async (req, res) => {
    try {
        const { filter, startDate, endDate } = req.query;
        let matchStage = {
            status: { $in: ['DELIVERED', 'SHIPPED', 'Processing'] }
        };

        const now = new Date();
        if (filter === 'daily') {
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            matchStage.createdAt = { $gte: startOfDay };
        } else if (filter === 'weekly') {
            const lastWeek = new Date();
            lastWeek.setDate(now.getDate() - 7);
            matchStage.createdAt = { $gte: lastWeek };
        } else if (filter === 'yearly') {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(now.getFullYear() - 1);
            matchStage.createdAt = { $gte: oneYearAgo };
        } else if (filter === 'custom' && startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
            };
        }

        const orders = await Order.find(matchStage).populate('userId', 'fullName').sort({ createdAt: -1 });

        const totalRevenue = orders.reduce((acc, order) => acc + (order.status === 'DELIVERED' ? order.totalAmount : 0), 0);
        const totalSalesCount = orders.length;

        const doc = new PDFDocument({ margin: 30, size: 'A4' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales-report-${Date.now()}.pdf`);

        doc.pipe(res);

        doc.fontSize(20).text('HOOF Sales Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Generated on: ${new Date().toLocaleString()}`);
        doc.text(`Filter: ${filter || 'All'}`);
        doc.moveDown();

        const table = {
            title: "Orders Summary",
            headers: ["Order ID", "Date", "Customer", "Amount", "Status"],
            rows: orders.map(order => [
                order._id.toString().slice(-8).toUpperCase(),
                order.createdAt.toLocaleDateString(),
                order.userId ? order.userId.fullName : 'Guest',
                `INR ${order.totalAmount}`,
                order.status
            ])
        };

        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(10),
            prepareRow: (row, indexColumn, indexRow, rectRow, rectCell) => doc.font("Helvetica").fontSize(9),
        });

        doc.moveDown();
        doc.fontSize(12).font("Helvetica-Bold").text(`Total Orders: ${totalSalesCount}`);
        doc.text(`Total Revenue (Delivered): INR ${totalRevenue}`);

        doc.end();

    } catch (error) {
        console.error("Export Report Error:", error);
        res.status(500).send("Error generating report");
    }
};

/**
 * @desc    Export orders as PDF.
 * @route   GET /admin/orders/export
 * @access  Private (Admin Only)
 */
exports.exportOrders = async (req, res) => {
    try {
        const { status, payment, search } = req.query;
        let query = {};

        if (status) query.status = status;
        if (payment) query.paymentMethod = payment;
        if (search) {
            const cleanSearch = search.replace('#', '').trim();
            const searchRegex = new RegExp(cleanSearch, 'i');
            query.$or = [
                { 'shippingAddress.fullName': searchRegex },
                { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: searchRegex } } }
            ];
        }

        const orders = await Order.find(query)
            .populate('userId', 'fullName email')
            .sort({ createdAt: -1 });

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=orders-report-${Date.now()}.pdf`);
        doc.pipe(res);

        // Title
        doc.fontSize(22).font("Helvetica-Bold").text('HOOF — Orders Report', { align: 'center' });
        doc.moveDown(0.3);
        doc.fontSize(10).font("Helvetica").fillColor('#666')
            .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });

        // Filter info
        const filters = [];
        if (status) filters.push(`Status: ${status}`);
        if (payment) filters.push(`Payment: ${payment}`);
        if (search) filters.push(`Search: "${search}"`);
        if (filters.length > 0) {
            doc.text(`Filters: ${filters.join(' | ')}`, { align: 'center' });
        }
        doc.moveDown(0.5);

        // Summary
        const totalRevenue = orders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
        const cancelledCount = orders.filter(o => o.status === 'CANCELLED').length;

        doc.fontSize(10).font("Helvetica-Bold").fillColor('#333');
        doc.text(`Total Orders: ${orders.length}   |   Delivered: ${deliveredCount}   |   Cancelled: ${cancelledCount}   |   Total Amount: INR ${totalRevenue.toLocaleString('en-IN')}`);
        doc.moveDown(0.5);

        // Table
        const table = {
            headers: [
                { label: "Order ID", width: 70, align: 'center' },
                { label: "Date", width: 85 },
                { label: "Customer", width: 130 },
                { label: "Items", width: 90, align: 'center' },
                { label: "Amount", width: 80, align: 'right' },
                { label: "Payment", width: 70, align: 'center' },
                { label: "Pay Status", width: 70, align: 'center' },
                { label: "Status", width: 90, align: 'center' }
            ],
            rows: orders.map(order => {
                let pStatus = order.paymentStatus || 'Pending';
                if (order.status === 'DELIVERED') pStatus = order.paymentMethod === 'COD' ? 'SUCCESS' : 'Paid';

                const itemCount = order.items ? order.items.length : 0;
                let itemLabel;
                if (itemCount === 1) {
                    const name = (order.items[0].productName || 'Item').substring(0, 14);
                    const size = order.items[0].variantSize ? ` (${order.items[0].variantSize})` : '';
                    itemLabel = name + size;
                } else if (itemCount > 1) {
                    itemLabel = `${itemCount} items`;
                } else {
                    itemLabel = 'N/A';
                }

                return [
                    '#' + String(order._id).slice(-8).toUpperCase(),
                    new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                    order.userId ? order.userId.fullName : (order.shippingAddress?.fullName || 'Guest'),
                    itemLabel,
                    `INR ${order.totalAmount.toLocaleString('en-IN')}`,
                    order.paymentMethod,
                    pStatus,
                    order.status
                ];
            })
        };

        await doc.table(table, {
            prepareHeader: () => doc.font("Helvetica-Bold").fontSize(8),
            prepareRow: (row, indexColumn, indexRow) => {
                doc.font("Helvetica").fontSize(8);
            },
        });

        doc.end();
    } catch (error) {
        console.error("Export Orders Error:", error);
        res.status(500).send("Error generating orders report");
    }
};