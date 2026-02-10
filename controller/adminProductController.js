const Product = require("../model/Product");
const Category = require("../model/Category");
const adminProductService = require("../services/adminProductService");

/**
 * @route   GET /admin/products
 * @desc    Display product management table with pagination
 * @access  Private (Admin)
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
 * @route   GET /admin/categories
 * @desc    Load category management list
 * @access  Private (Admin)
 */
exports.loadCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';

        const { categories, totalPages, currentPage } =
            await adminProductService.getAllCategoriesAdmin(page, 5, search);

        // CHANGE THIS LINE:
        // From: res.render("Admin/categories", ...
        // To:   res.render("Admin/category-management", ...
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
 * @route   POST /admin/products/add
 * @desc    Create a new product
 * @access  Private (Admin)
 */
exports.addProduct = async (req, res) => {
    try {
        const productData = req.body;
        const files = req.files; // Multer array of files

        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "Please upload at least one image." });
        }

        // Pass BOTH arguments to the service
        // Argument 1: Text data (req.body)
        // Argument 2: File data (req.files)
        await adminProductService.addProduct(productData, files);

        // Since your EJS uses Fetch/AJAX, we should return JSON, not a redirect
        res.json({ success: true, message: "Product added successfully!" });

    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PATCH /admin/products/toggle-status/:id
 * @desc    Toggle product blocked status
 * @access  Private (Admin)
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

// controller/adminProductController.js
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
 * @route   GET /admin/products/add
 * @desc    Render the add product form
 * @access  Private (Admin)
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