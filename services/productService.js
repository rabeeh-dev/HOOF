/**
 * @file services/productService.js
 * @description Service layer for user-facing product operations, including listing, filtering, and sorting.
 */

const Product = require("../model/Product");
const Category = require("../model/Category");

class ProductService {
    /**
     * Fetches products based on filters, sorting, and pagination for the shop listing.
     * @param {Object} query - Query parameters from the request.
     * @param {string} [query.category] - Category ID filter.
     * @param {string} [query.sort] - Sorting criteria (e.g., price-low, newest).
     * @param {number} [query.page=1] - Current page number.
     * @param {string} [query.search] - Search term for product names.
     * @param {string} [query.minPrice] - Minimum price filter.
     * @param {string} [query.maxPrice] - Maximum price filter.
     * @param {string} [query.size] - Product size filter.
     * @param {number} [limit=12] - Number of products per page.
     * @returns {Promise<Object>} Object containing products, totalCount, totalPages, and currentPage.
     */
    async getAllProducts(query, limit = 12) {
        const { category, sort, page = 1, search, minPrice, maxPrice, size } = query;
        const skip = (page - 1) * limit;

        // 1. Get all listed categories first to ensure we only show products from them
        const listedCategories = await Category.find({ isListed: true }).select('_id');
        const listedCategoryIds = listedCategories.map(cat => cat._id);

        // 2. Build Filter Object
        let filter = {
            isBlocked: false,
            status: "Available",
            category: { $in: listedCategoryIds }
        };

        if (category) {
            // If a specific category is requested, double check it's in the listed ones
            if (listedCategoryIds.some(id => String(id) === String(category))) {
                filter.category = category;
            } else {
                // If it's not listed, return empty
                return { products: [], totalCount: 0, totalPages: 0, currentPage: parseInt(page) };
            }
        }

        if (search) filter.productName = { $regex: search, $options: 'i' };

        // Handle Price Range
        if (minPrice || maxPrice) {
            filter.salePrice = {};
            if (minPrice) filter.salePrice.$gte = parseInt(minPrice);
            if (maxPrice) filter.salePrice.$lte = parseInt(maxPrice);
        }

        // Handle Size Filter
        if (size) {
            filter.variants = {
                $elemMatch: { size: size, quantity: { $gt: 0 } }
            };
        }

        // 3. Build Sort Object
        let sortOrder = {};
        if (sort === 'price-low') sortOrder.salePrice = 1;
        else if (sort === 'price-high') sortOrder.salePrice = -1;
        else if (sort === 'a-z') sortOrder.productName = 1;
        else if (sort === 'z-a') sortOrder.productName = -1;
        else if (sort === 'newest') sortOrder.createdAt = -1;


        // 4. Execute Queries
        const [products, totalCount] = await Promise.all([
            Product.find(filter)
                .populate('category')
                .sort(sortOrder)
                .skip(skip)
                .limit(limit),
            Product.countDocuments(filter)
        ]);

        return {
            products,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            currentPage: parseInt(page)
        };
    }
}

module.exports = new ProductService();