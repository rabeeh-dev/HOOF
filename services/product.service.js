/**
 * @file services/product.service.js
 * @description Pure business logic for product catalog, filtering, sorting, pagination, reviews, and discovery.
 */

const fs = require('fs');
const path = require('path');
const convert = require('heic-convert');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');

class ProductService {
  /**
   * Fetches paginated, filtered, and sorted products for the shop catalog.
   * @param {Object} query - Query parameters from request.
   * @param {number} [limit=6] - Number of items per page.
   * @returns {Promise<Object>} Catalog page data
   */
  async getAllProducts(query, limit = 6) {
    const { category, sort, page = 1, search, minPrice, maxPrice, size } = query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const skip = (pageNum - 1) * limit;

    // 1. Build Base Filter (Only available and unblocked products)
    const filter = {
      status: 'Available',
    };

    if (category) {
      filter.category = category;
    }

    if (search && search.trim()) {
      filter.productName = { $regex: search.trim(), $options: 'i' };
    }

    // Handle Price Range
    if (minPrice || maxPrice) {
      filter.salePrice = {};
      if (minPrice) filter.salePrice.$gte = Number(minPrice);
      if (maxPrice) filter.salePrice.$lte = Number(maxPrice);
    }

    // Handle Size Variant Filter
    if (size) {
      filter.variants = {
        $elemMatch: { size: String(size), quantity: { $gt: 0 } },
      };
    }

    // 2. Build Sort Order
    const sortOrder = {};
    if (sort === 'price-low') sortOrder.salePrice = 1;
    else if (sort === 'price-high') sortOrder.salePrice = -1;
    else if (sort === 'a-z') sortOrder.productName = 1;
    else if (sort === 'z-a') sortOrder.productName = -1;
    else if (sort === 'newest') sortOrder.createdAt = -1;
    else sortOrder.createdAt = -1; // Default newest

    // 3. Execute Queries in parallel
    const [products, totalCount] = await Promise.all([
      Product.find(filter)
        .populate('category')
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return {
      products,
      totalCount,
      totalPages: Math.ceil(totalCount / limit) || 1,
      currentPage: pageNum,
    };
  }

  /**
   * Fetches full product details, reviews, related items, and user purchase/review eligibility.
   * @param {string} productId
   * @param {string|null} userId
   * @returns {Promise<Object>}
   */
  async getProductDetails(productId, userId = null) {
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
      throw new AppError('Invalid product ID format', 400);
    }

    const product = await Product.findById(productId).populate('category');
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // 1. Fetch related products in the same category
    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: productId },
      isBlocked: false,
      status: 'Available',
    })
      .limit(4)
      .lean();

    // 2. Fetch customer reviews
    const reviews = await Review.find({ productId })
      .populate('userId', 'fullName')
      .sort({ createdAt: -1 })
      .lean();

    // 3. Check user-specific interactions if logged in
    let wishlistProductIds = [];
    let hasPurchased = false;
    let hasReviewed = false;

    if (userId) {
      const wishlist = await Wishlist.findOne({ userId }).select('products').lean();
      if (wishlist?.products) {
        wishlistProductIds = wishlist.products.map((id) => id.toString());
      }

      const deliveredStatuses = [
        'DELIVERED',
        'Return Requested',
        'Return Approved',
        'Picked Up',
        'Returned',
        'Partially Refunded',
      ];

      hasPurchased = !!(await Order.exists({
        userId,
        'items.productId': productId,
        status: { $in: deliveredStatuses },
      }));

      if (hasPurchased) {
        hasReviewed = !!(await Review.exists({ userId, productId }));
      }
    }

    return {
      product,
      relatedProducts,
      reviews,
      wishlistProductIds,
      hasPurchased,
      hasReviewed,
    };
  }

  /**
   * Submits a customer review after verifying purchase history.
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.productId
   * @param {number} params.rating
   * @param {string} params.comment
   * @returns {Promise<Object>} Created review
   */
  async addProductReview({ userId, productId, rating, comment }) {
    if (!userId) {
      throw new AppError('Please log in to write a review', 401);
    }

    if (!rating || rating < 1 || rating > 5) {
      throw new AppError('Rating must be between 1 and 5 stars', 400);
    }

    const deliveredStatuses = [
      'DELIVERED',
      'Return Requested',
      'Return Approved',
      'Picked Up',
      'Returned',
      'Partially Refunded',
    ];

    const hasPurchased = await Order.exists({
      userId,
      'items.productId': productId,
      status: { $in: deliveredStatuses },
    });

    if (!hasPurchased) {
      throw new AppError('You can only review products that have been delivered to you', 403);
    }

    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      throw new AppError('You have already submitted a review for this product', 409);
    }

    const newReview = await Review.create({
      userId,
      productId,
      rating: Number(rating),
      comment: (comment || '').trim(),
    });

    return newReview;
  }

  /**
   * Fetches latest fresh arrivals for landing and home showcases.
   * @param {number} [limit=4]
   * @returns {Promise<Array>}
   */
  async getNewArrivals(limit = 4) {
    return await Product.find({ isBlocked: false, status: 'Available' })
      .populate('category')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Fetches all active listed categories for catalog navigation & filters.
   * @returns {Promise<Array>}
   */
  async getActiveCategories() {
    return await Category.find({ isListed: true }).lean();
  }

  // ==========================================
  // ADMIN CATALOG & CATEGORY METHODS
  // ==========================================

  async getAllProductsAdmin(page = 1, limit = 5, search = '') {
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query = {
        $or: [
          { productName: { $regex: search, $options: 'i' } },
          { brand: { $regex: search, $options: 'i' } },
        ],
      };
    }

    const products = await Product.find(query)
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalProducts = await Product.countDocuments(query);

    return {
      products,
      totalPages: Math.ceil(totalProducts / limit) || 1,
      currentPage: page,
    };
  }

  async addProduct(productData, files) {
    const imagePaths = [];

    for (const file of files) {
      let filename = file.filename;
      let filePath = file.path;

      if (file.originalname && file.originalname.toLowerCase().endsWith('.heic')) {
        const inputBuffer = fs.readFileSync(filePath);
        const outputBuffer = await convert({
          buffer: inputBuffer,
          format: 'JPEG',
          quality: 1,
        });

        filename = `conv-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
        const newPath = path.resolve('public/uploads/products', filename);
        fs.writeFileSync(newPath, outputBuffer);
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
      }

      imagePaths.push(`/uploads/products/${filename}`);
    }

    const variants = [];
    if (
      !productData.variantSize ||
      (Array.isArray(productData.variantSize) && productData.variantSize.length === 0)
    ) {
      throw new AppError('At least one variant (Size & Stock) is required.', 400);
    }

    const sizes = Array.isArray(productData.variantSize)
      ? productData.variantSize
      : [productData.variantSize];
    const stocks = Array.isArray(productData.variantStock)
      ? productData.variantStock
      : [productData.variantStock];

    sizes.forEach((size, i) => {
      if (!size || !stocks[i]) return;
      variants.push({
        size,
        quantity: parseInt(stocks[i], 10) || 0,
        status: parseInt(stocks[i], 10) > 0 ? 'Available' : 'Out of Stock',
      });
    });

    if (variants.length === 0) {
      throw new AppError('At least one valid variant is required.', 400);
    }

    const totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0);

    const regPrice = parseFloat(productData.regularPrice);
    const inputSalePrice = parseFloat(productData.salePrice);

    const productOffer = Math.round(100 - (inputSalePrice / regPrice) * 100);

    const categoryDoc = await Category.findById(productData.category);
    const categoryOffer = categoryDoc ? categoryDoc.categoryOffer || 0 : 0;

    const effectiveOffer = Math.max(productOffer, categoryOffer);
    const finalSalePrice = Math.round(regPrice - (regPrice * effectiveOffer) / 100);

    const newProduct = new Product({
      productName: productData.productName,
      description: productData.description,
      brand: productData.brand,
      category: productData.category,
      regularPrice: regPrice,
      salePrice: finalSalePrice,
      productOffer,
      quantity: totalQuantity,
      productImage: imagePaths,
      variants,
    });

    return await newProduct.save();
  }

  async getAllCategoriesAdmin(page = 1, limit = 5, search = '') {
    const skip = (page - 1) * limit;

    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    const categories = await Category.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCategories = await Category.countDocuments(query);

    return {
      categories,
      totalPages: Math.ceil(totalCategories / limit) || 1,
      currentPage: page,
      totalCategories,
    };
  }

  async getProductById(id) {
    return await Product.findById(id).populate('category');
  }

  async updateProduct(id, productData, files) {
    if (!productData.productName || productData.productName.trim() === '') {
      throw new AppError('Product name cannot be empty.', 400);
    }
    if (!productData.category || productData.category.trim() === '') {
      throw new AppError('Category cannot be empty.', 400);
    }

    const regPrice = parseFloat(productData.regularPrice);
    const salePrice = parseFloat(productData.salePrice);

    if (isNaN(regPrice) || regPrice <= 0) {
      throw new AppError('Regular price must be a positive number.', 400);
    }
    if (isNaN(salePrice) || salePrice <= 0) {
      throw new AppError('Sale price must be a positive number.', 400);
    }
    if (salePrice > regPrice) {
      throw new AppError('Sale price cannot be greater than regular price.', 400);
    }

    const newImagePaths = [];
    if (files && files.length > 0) {
      for (const file of files) {
        let filename = file.filename;
        let filePath = file.path;

        if (file.originalname && file.originalname.toLowerCase().endsWith('.heic')) {
          const inputBuffer = fs.readFileSync(filePath);
          const outputBuffer = await convert({ buffer: inputBuffer, format: 'JPEG', quality: 1 });
          filename = `upd-${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
          const newPath = path.resolve('public/uploads/products', filename);
          fs.writeFileSync(newPath, outputBuffer);
          try {
            fs.unlinkSync(filePath);
          } catch (_) {}
        }
        newImagePaths.push(`/uploads/products/${filename}`);
      }
    }

    let finalImages = [];
    if (productData.existingImages) {
      try {
        finalImages = JSON.parse(productData.existingImages);
      } catch (e) {
        finalImages = Array.isArray(productData.existingImages)
          ? productData.existingImages
          : [productData.existingImages];
      }
    }
    finalImages = [...finalImages, ...newImagePaths];

    const variants = [];
    if (
      !productData.variantSize ||
      (Array.isArray(productData.variantSize) && productData.variantSize.length === 0)
    ) {
      throw new AppError('At least one variant (Size & Stock) is required.', 400);
    }

    const sizes = Array.isArray(productData.variantSize)
      ? productData.variantSize
      : [productData.variantSize];
    const stocks = Array.isArray(productData.variantStock)
      ? productData.variantStock
      : [productData.variantStock];

    sizes.forEach((size, i) => {
      if (!size || !stocks[i]) return;

      if (/[a-zA-Z]/.test(size)) {
        throw new AppError(`Variant size "${size}" must not contain alphabetic characters.`, 400);
      }

      const qty = parseInt(stocks[i], 10);
      if (isNaN(qty) || qty <= 0) {
        throw new AppError(`Variant stock must be a positive number (found: ${stocks[i]}).`, 400);
      }

      variants.push({
        size,
        quantity: qty,
        status: qty > 0 ? 'Available' : 'Out of Stock',
      });
    });

    if (variants.length === 0) {
      throw new AppError('At least one valid variant is required.', 400);
    }

    const totalQuantity = variants.reduce((sum, v) => sum + v.quantity, 0);

    const productOffer = Math.round(100 - (salePrice / regPrice) * 100);

    const categoryDoc = await Category.findById(productData.category);
    const categoryOffer = categoryDoc ? categoryDoc.categoryOffer || 0 : 0;

    const effectiveOffer = Math.max(productOffer, categoryOffer);
    const finalSalePrice = Math.round(regPrice - (regPrice * effectiveOffer) / 100);

    const updateFields = {
      productName: productData.productName,
      description: productData.description,
      brand: productData.brand,
      category: productData.category,
      regularPrice: regPrice,
      salePrice: finalSalePrice,
      productOffer,
      quantity: totalQuantity,
      productImage: finalImages,
      variants,
    };

    return await Product.findByIdAndUpdate(id, updateFields, { returnDocument: 'after' });
  }
}

module.exports = new ProductService();
