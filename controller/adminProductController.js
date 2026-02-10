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

/**
 * @route   POST /admin/products/add
 * @desc    Create a new product
 * @access  Private (Admin)
 */
exports.addProduct = async (req, res) => {
    try {
        const productData = req.body;
        const files = req.files;

        // Process images
        const imagePaths = files.map(file => `/uploads/products/${file.filename}`);
        productData.productImage = imagePaths;

        // Process variants if any
        if (productData.variantSize) {
            const variants = [];
            if (Array.isArray(productData.variantSize)) {
                for (let i = 0; i < productData.variantSize.length; i++) {
                    variants.push({
                        size: productData.variantSize[i],
                        color: productData.variantColor[i],
                        quantity: productData.variantStock[i],
                        status: parseInt(productData.variantStock[i]) > 0 ? "Available" : "Out of Stock"
                    });
                }
            } else {
                variants.push({
                    size: productData.variantSize,
                    color: productData.variantColor,
                    quantity: productData.variantStock,
                    status: parseInt(productData.variantStock) > 0 ? "Available" : "Out of Stock"
                });
            }
            productData.variants = variants;
        }

        await adminProductService.addProduct(productData);

        res.redirect("/admin/products?success=true");
    } catch (error) {
        console.error("Add Product Error:", error);
        res.redirect("/admin/products/add?error=true");
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