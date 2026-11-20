/**
 * @file controllers/admin/product.controller.js
 * @description Controller handling administrator product and category management: CRUD, status toggling, and category offers.
 */

const Product = require('../../models/Product');
const Category = require('../../models/Category');
const adminProductService = require('../../services/AdminProduct');

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================

/**
 * @desc    Load category management list with pagination and search.
 * @route   GET /admin/categories
 * @access  Private (isAdminLogin)
 */
exports.loadCategories = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const search = req.query.search || '';

    const { categories, totalPages, currentPage } =
      await adminProductService.getAllCategoriesAdmin(page, 5, search);

    res.render('Admin/category-management', {
      categories,
      totalPages,
      currentPage,
      search,
      title: 'Category Management | HOOF Admin',
      layout: false,
    });
  } catch (error) {
    console.error('Load Categories Error:', error.message);
    res.redirect('/admin/dashboard');
  }
};

/**
 * @desc    Create a new category.
 * @route   POST /admin/categories/add
 * @access  Private (isAdminLogin)
 */
exports.addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const normalizedName = (name || '').trim();

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
    });

    if (existingCategory) {
      return res.status(400).json({ success: false, message: 'Category already exists' });
    }

    const newCategory = new Category({
      name: normalizedName,
      description: (description || '').trim(),
    });

    await newCategory.save();
    return res.status(201).json({ success: true, message: 'Category added successfully' });
  } catch (error) {
    console.error('Add Category Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * @desc    Update an existing category's details.
 * @route   PATCH /admin/categories/edit/:id
 * @access  Private (isAdminLogin)
 */
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const normalizedName = (name || '').trim();

    const existingCategory = await Category.findOne({
      name: { $regex: new RegExp(`^${normalizedName}$`, 'i') },
      _id: { $ne: id },
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Another category with this name already exists',
      });
    }

    await Category.findByIdAndUpdate(id, {
      name: normalizedName,
      description: (description || '').trim(),
    });

    return res.json({ success: true, message: 'Category updated successfully' });
  } catch (error) {
    console.error('Update Category Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * @desc    Toggle the isListed status of a category.
 * @route   PATCH /admin/categories/toggle-status/:id
 * @access  Private (isAdminLogin)
 */
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);

    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    category.isListed = !category.isListed;
    await category.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('category:statusChanged', {
        categoryId: category._id.toString(),
        isListed: category.isListed,
      });
    }

    return res.json({
      success: true,
      message: `Category ${category.isListed ? 'listed' : 'unlisted'} successfully`,
    });
  } catch (error) {
    console.error('Toggle Category Status Error:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Error toggling category status', error: error.message });
  }
};

/**
 * @desc    Apply an offer percentage to a category and update its products.
 * @route   POST /admin/categories/offer/:id
 * @access  Private (isAdminLogin)
 */
exports.applyCategoryOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { offerPercentage } = req.body;

    const percentage = parseInt(offerPercentage, 10);
    if (isNaN(percentage) || percentage < 1 || percentage > 99) {
      return res.status(400).json({ success: false, message: 'Invalid offer percentage (1-99)' });
    }

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    category.categoryOffer = percentage;
    await category.save();

    const products = await Product.find({ category: category._id });

    for (const product of products) {
      const effectiveOffer = Math.max(product.productOffer || 0, category.categoryOffer);
      const discountAmount = (product.regularPrice * effectiveOffer) / 100;
      product.salePrice = Math.round(product.regularPrice - discountAmount);
      await product.save();
    }

    return res.json({
      success: true,
      message: `Applied ${percentage}% offer to ${category.name} and updated ${products.length} products.`,
    });
  } catch (error) {
    console.error('Apply Category Offer Error:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Error applying category offer', error: error.message });
  }
};

/**
 * @desc    Remove an offer from a category and restore product prices.
 * @route   POST /admin/categories/remove-offer/:id
 * @access  Private (isAdminLogin)
 */
exports.removeCategoryOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    category.categoryOffer = 0;
    await category.save();

    const products = await Product.find({ category: category._id });

    for (const product of products) {
      const effectiveOffer = product.productOffer || 0;
      const discountAmount = (product.regularPrice * effectiveOffer) / 100;
      product.salePrice = Math.round(product.regularPrice - discountAmount);
      await product.save();
    }

    return res.json({
      success: true,
      message: `Removed offer from ${category.name} and updated ${products.length} products.`,
    });
  } catch (error) {
    console.error('Remove Category Offer Error:', error.message);
    return res
      .status(500)
      .json({ success: false, message: 'Error removing category offer', error: error.message });
  }
};

// ==========================================
// PRODUCT MANAGEMENT
// ==========================================

/**
 * @desc    Display product management table with pagination.
 * @route   GET /admin/products
 * @access  Private (isAdminLogin)
 */
exports.listProductsAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const search = req.query.search || '';
    const { products, totalPages, currentPage } = await adminProductService.getAllProductsAdmin(
      page,
      5,
      search
    );

    res.render('Admin/product-management', {
      products,
      totalPages,
      currentPage,
      search,
      title: 'Product Management | HOOF Admin',
      layout: false,
    });
  } catch (error) {
    console.error('Admin Product List Error:', error.message);
    res.redirect('/admin/dashboard');
  }
};

/**
 * @desc    Render the add product form.
 * @route   GET /admin/products/add
 * @access  Private (isAdminLogin)
 */
exports.loadAddProduct = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true });
    res.render('Admin/add-product', {
      categories,
      title: 'Add Product | HOOF Admin',
      layout: false,
    });
  } catch (error) {
    console.error('Load Add Product Error:', error.message);
    res.redirect('/admin/products');
  }
};

/**
 * @desc    Add a new product with multiple images.
 * @route   POST /admin/products/add
 * @access  Private (isAdminLogin)
 */
exports.addProduct = async (req, res) => {
  try {
    const productData = req.body;
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image.' });
    }

    await adminProductService.addProduct(productData, files);

    return res.json({ success: true, message: 'Product added successfully!' });
  } catch (error) {
    console.error('Add Product Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Toggle product blocked status (Block/Unblock).
 * @route   PATCH /admin/products/toggle-status/:id
 * @access  Private (isAdminLogin)
 */
exports.toggleProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.isBlocked = !product.isBlocked;
    await product.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('product:statusChanged', {
        productId: product._id.toString(),
        isBlocked: product.isBlocked,
      });
    }

    return res.json({
      success: true,
      message: `Product ${product.isBlocked ? 'Blocked' : 'Unblocked'} successfully`,
    });
  } catch (error) {
    console.error('Toggle Product Status Error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

/**
 * @desc    Render the edit product form with existing product data.
 * @route   GET /admin/products/edit/:id
 * @access  Private (isAdminLogin)
 */
exports.loadEditProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await adminProductService.getProductById(id);
    const categories = await Category.find({});

    res.render('Admin/edit-product', {
      product,
      categories,
      title: 'Edit Product | HOOF Admin',
      layout: false,
    });
  } catch (error) {
    console.error('Load Edit Product Error:', error.message);
    res.redirect('/admin/products');
  }
};

/**
 * @desc    Update product details.
 * @route   POST /admin/products/edit/:id
 * @access  Private (isAdminLogin)
 */
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await adminProductService.updateProduct(id, req.body, req.files);

    if (result) {
      return res.json({ success: true, message: 'Product updated successfully' });
    }
    return res.status(404).json({ success: false, message: 'Product not found' });
  } catch (error) {
    console.error('Update Product Error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
