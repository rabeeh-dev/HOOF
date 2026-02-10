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

    pathParts.forEach((part, index) => {
        // Skip 'user' prefix in URL if it exists, or handle it
        // The routes are mounted at /user, but the actual URL in browser is /user/shop
        // So we want to keep /user in the URL but maybe skip showing it as a breadcrumb name?
        // Actually, 'Home' is /user/home usually. Let's check routes.
        // / -> /user/home (landing page)

        currentUrl += `/${part}`;

        // Map path parts to readable names
        let name = part.charAt(0).toUpperCase() + part.slice(1);

        // Custom mappings
        if (part === 'user') return; // Skip 'user' in breadcrumb list if you want Home > Shop instead of Home > User > Shop
        if (part === 'product-details') name = 'Product Details';
        if (part === 'cart') name = 'Shopping Cart';
        if (part === 'checkout') name = 'Checkout';

        // If it's an ID (long string/number), try to make it generic or skip
        // Simple check for MongoID-like strings (24 hex chars)
        if (/^[0-9a-fA-F]{24}$/.test(part)) {
            // If previous part was product-details, maybe don't show ID?
            // Or we rely on the specific route handler to override this with the actual product name?
            // For now, let's just ignore IDs in the visual breadcrumb to keep it clean
            return;
        }

        breadcrumbs.push({ name, url: currentUrl });
    });

    res.locals.breadcrumbs = breadcrumbs;
    next();
};

module.exports = breadcrumbMiddleware;
