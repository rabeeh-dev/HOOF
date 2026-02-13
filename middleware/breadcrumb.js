/**
 * @file middleware/breadcrumb.js
 * @description Middleware for generating dynamic breadcrumbs for user navigation.
 */

/**
 * Middleware to generate breadcrumbs based on the request path.
 * Skips specific routes like admin, assets, and home page.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const breadcrumbMiddleware = (req, res, next) => {
    // Skip for admin routes, assets, landing page, and home page
    if (req.path.startsWith('/admin') ||
        req.path.startsWith('/user/css') ||
        req.path.startsWith('/user/js') ||
        req.path === '/' ||
        req.path === '/user/home') {
        return next();
    }

    const pathParts = req.path.split('/').filter(part => part !== '');
    const breadcrumbs = [{ name: 'Home', url: '/' }];

    let currentUrl = '';

    pathParts.forEach((part) => {
        currentUrl += `/${part}`;

        // Map path parts to readable names
        let name = part.charAt(0).toUpperCase() + part.slice(1);

        // Custom mappings for specific route segments
        if (part === 'user') return; // Skip 'user' prefix in visual breadcrumbs
        if (part === 'product-details') name = 'Product Details';
        if (part === 'cart') name = 'Shopping Cart';
        if (part === 'checkout') name = 'Checkout';

        // Skip MongoID-like strings (24 hex characters) for cleaner breadcrumbs
        if (/^[0-9a-fA-F]{24}$/.test(part)) {
            return;
        }

        breadcrumbs.push({ name, url: currentUrl });
    });

    res.locals.breadcrumbs = breadcrumbs;
    next();
};

module.exports = breadcrumbMiddleware;
