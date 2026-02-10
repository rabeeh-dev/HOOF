const Product = require("../model/Product");

/**
 * ProductService handles logic for fetching, filtering, and 
 * managing product data for the store.
 */
class ProductService {
    /**
     * Fetches products based on filters, sorting, and pagination.
     * @param {Object} query - Object containing category, sort, and page.
     * @param {number} limit - Number of products per page.
     * @returns {Promise<Object>} Products, total count, and pagination info.
     */


    async getAllProducts(query, limit = 12) {
        const { category, sort, page = 1, search, maxPrice } = query;
        const skip = (page - 1) * limit;

        // 1. Build Filter Object - Adjusted to match your actual Model
        // Removed 'isActive' and 'isDeleted' as they don't exist in your schema
        let filter = { 
            isBlocked: false, 
            status: "Available" 
        };
        
        if (category) filter.category = category;
        if (search) filter.productName = { $regex: search, $options: 'i' };
        
        if (maxPrice) {
            filter.salePrice = { $lte: parseInt(maxPrice) };
        }

        // 2. Build Sort Object
        let sortOrder = {};
        if (sort === 'price-low') sortOrder.salePrice = 1;
        else if (sort === 'price-high') sortOrder.salePrice = -1;
        else if (sort === 'newest') sortOrder.createdAt = -1;

        // 3. Execute Queries
        const products = await Product.find(filter)
            .populate({
                path: 'category',
                match: { isListed: true } // Ensuring we only show products from listed categories
            })
            .sort(sortOrder)
            .skip(skip)
            .limit(limit);

        // Filter out products where the category is unlisted (populate returns null)
        const finalProducts = products.filter(p => p.category !== null);

        const totalProducts = await Product.countDocuments(filter);

        return {
            products: finalProducts,
            totalCount: totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: parseInt(page)
        };
    }
}

module.exports = new ProductService();