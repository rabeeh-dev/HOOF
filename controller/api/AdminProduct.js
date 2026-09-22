/**
 * @file controller/api/AdminProduct.js
 * @description API controller for admin product and category management.
 * Returns pure JSON responses suitable for the React admin panel.
 * Reuses existing service layer and multer middleware without changes.
 */

const Product = require("../../model/Product");
const Category = require("../../model/Category");
const adminProductService = require("../../services/AdminProduct");

/**
 * @desc    List products with pagination and search (JSON).
 * @route   GET /api/admin/products
 */
exports.listProducts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const { products, totalPages, currentPage } =
            await adminProductService.getAllProductsAdmin(page, limit, search);

        const totalProducts = await Product.countDocuments(
            search ? { $or: [
                { productName: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } }
            ]} : {}
        );

        return res.json({
            success: true,
            products,
            totalPages,
            currentPage,
            totalProducts
        });
    } catch (err) {
        console.error("API listProducts error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch products." });
    }
};

/**
 * @desc    Get single product details for editing.
 * @route   GET /api/admin/products/:id
 */
exports.getProduct = async (req, res) => {
    try {
        const product = await adminProductService.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.json({ success: true, product });
    } catch (err) {
        console.error("API getProduct error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch product." });
    }
};

/**
 * @desc    Add new product (multipart/form-data with images).
 * @route   POST /api/admin/products
 */
exports.addProduct = async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ success: false, message: "Please upload at least one image." });
        }
        await adminProductService.addProduct(req.body, files);
        return res.status(201).json({ success: true, message: "Product added successfully!" });
    } catch (err) {
        console.error("API addProduct error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Update product (multipart/form-data with images).
 * @route   PUT /api/admin/products/:id
 */
exports.updateProduct = async (req, res) => {
    try {
        const result = await adminProductService.updateProduct(req.params.id, req.body, req.files);
        if (result) {
            return res.json({ success: true, message: "Product updated successfully" });
        }
        return res.status(404).json({ success: false, message: "Product not found" });
    } catch (err) {
        console.error("API updateProduct error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Toggle product blocked status.
 * @route   PATCH /api/admin/products/:id/toggle-status
 */
exports.toggleProductStatus = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        product.isBlocked = !product.isBlocked;
        await product.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('product:statusChanged', {
                productId: product._id.toString(),
                isBlocked: product.isBlocked
            });
        }

        return res.json({
            success: true,
            message: `Product ${product.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            isBlocked: product.isBlocked
        });
    } catch (err) {
        console.error("API toggleProductStatus error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Delete a product permanently.
 * @route   DELETE /api/admin/products/:id
 */
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.json({ success: true, message: "Product deleted successfully" });
    } catch (err) {
        console.error("API deleteProduct error:", err);
        return res.status(500).json({ success: false, message: "Failed to delete product" });
    }
};

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================

/**
 * @desc    List categories with pagination and search (JSON).
 * @route   GET /api/admin/categories
 */
exports.listCategories = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';

        const result = await adminProductService.getAllCategoriesAdmin(page, limit, search);

        return res.json({
            success: true,
            categories: result.categories,
            totalPages: result.totalPages,
            currentPage: result.currentPage,
            totalCategories: result.totalCategories
        });
    } catch (err) {
        console.error("API listCategories error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch categories." });
    }
};

/**
 * @desc    Get all categories (for dropdowns, no pagination).
 * @route   GET /api/admin/categories/all
 */
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isListed: true }).sort({ name: 1 });
        return res.json({ success: true, categories });
    } catch (err) {
        console.error("API getAllCategories error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch categories." });
    }
};

/**
 * @desc    Add new category.
 * @route   POST /api/admin/categories
 */
exports.addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const normalizedName = name.trim();

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
        return res.status(201).json({ success: true, message: "Category added successfully", category: newCategory });
    } catch (err) {
        console.error("API addCategory error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Update category.
 * @route   PUT /api/admin/categories/:id
 */
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;
        const normalizedName = name.trim();

        const existingCategory = await Category.findOne({
            name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
            _id: { $ne: id }
        });

        if (existingCategory) {
            return res.status(400).json({ success: false, message: "Another category with this name already exists" });
        }

        const updated = await Category.findByIdAndUpdate(id, {
            name: normalizedName,
            description: description.trim()
        }, { new: true });

        return res.json({ success: true, message: "Category updated successfully", category: updated });
    } catch (err) {
        console.error("API updateCategory error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * @desc    Toggle category listing status.
 * @route   PATCH /api/admin/categories/:id/toggle-status
 */
exports.toggleCategoryStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        category.isListed = !category.isListed;
        await category.save();

        const io = req.app.get('io');
        if (io) {
            io.emit('category:statusChanged', {
                categoryId: category._id.toString(),
                isListed: category.isListed
            });
        }

        return res.json({
            success: true,
            message: `Category ${category.isListed ? 'listed' : 'unlisted'} successfully`,
            isListed: category.isListed
        });
    } catch (err) {
        console.error("API toggleCategoryStatus error:", err);
        return res.status(500).json({ success: false, message: "Error toggling category status" });
    }
};

/**
 * @desc    Delete a category.
 * @route   DELETE /api/admin/categories/:id
 */
exports.deleteCategory = async (req, res) => {
    try {
        // Check if any products use this category
        const productCount = await Product.countDocuments({ category: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete: ${productCount} product(s) are still using this category.`
            });
        }

        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: "Category not found" });
        }
        return res.json({ success: true, message: "Category deleted successfully" });
    } catch (err) {
        console.error("API deleteCategory error:", err);
        return res.status(500).json({ success: false, message: "Failed to delete category" });
    }
};
