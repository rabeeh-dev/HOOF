/**
 * @file controller/adminProductController.js
 * @description Controller for administrative product and category management.
 */

const Product = require("../model/Product");
const Category = require("../model/Category");
const adminProductService = require("../services/AdminProduct");

/**
 * @desc    Display product management table with pagination.
 * @route   GET /admin/products
 * @access  Private (Admin)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.listProductsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const { products, totalPages, currentPage } = await adminProductService.getAllProductsAdmin(page);

        res.render("Admin/product-management", {
            products,
            totalPages,
            currentPage,
            title: "Product Management | HOOF Admin",
            layout: false
        });
    } catch (error) {
        console.error("Admin Product List Error:", error);
        res.redirect("/admin/dashboard");
    }
};

/**
 * @desc    Load category management list with pagination and search.
 * @route   GET /admin/categories
 * @access  Private (Admin)
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
 * @desc    Create a new product.
 * @route   POST /admin/products/add
 * @access  Private (Admin)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.addProduct = async (req, res) => {
    try {
        const productData = req.body;
        const files = req.files; // Multer array of files

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "Please upload at least one image." });
        }

        await adminProductService.addProduct(productData, files);

        // Return JSON response for AJAX requests
        res.json({ success: true, message: "Product added successfully!" });

    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Toggle product blocked status (Block/Unblock).
 * @route   PATCH /admin/products/toggle-status/:id
 * @access  Private (Admin)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.toggleProductStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        product.isBlocked = !product.isBlocked;
        await product.save();

        res.json({ success: true, message: `Product ${product.isBlocked ? 'Blocked' : 'Unblocked'} successfully` });
    } catch (error) {
        console.error("Toggle Product Status Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Render the edit product form with existing product data.
 * @route   GET /admin/products/edit/:id
 * @access  Private (Admin)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadEditProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await adminProductService.getProductById(id);
        const categories = await Category.find({}); // Get all categories for the dropdown

        res.render("Admin/edit-product", {
            product,
            categories,
            title: "Edit Product | HOOF Admin",
            layout: false
        });
    } catch (error) {
        console.error("Load Edit Product Error:", error);
        res.redirect("/admin/products");
    }
};

/**
 * @desc    Update product details.
 * @route   PUT /admin/products/edit/:id
 * @access  Private (Admin)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await adminProductService.updateProduct(id, req.body, req.files);

        if (result) {
            res.json({ success: true, message: "Product updated successfully" });
        } else {
            res.status(404).json({ success: false, message: "Product not found" });
        }
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Render the add product form.
 * @route   GET /admin/products/add
 * @access  Private (Admin)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.loadAddProduct = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true });
        res.render("Admin/add-product", {
            categories,
            title: "Add Product | HOOF Admin",
            layout: false
        });
    } catch (error) {
        console.error("Load Add Product Error:", error);
        res.redirect("/admin/products");
    }
};