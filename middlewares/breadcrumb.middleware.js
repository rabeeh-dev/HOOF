/**
 * @file middlewares/breadcrumb.middleware.js
 * @description Middleware for generating dynamic breadcrumbs for user navigation.
 */

const breadcrumbMiddleware = (req, res, next) => {
  // Skip for admin routes, assets, landing page, and home page
  if (
    req.path.startsWith('/admin') ||
    req.path.startsWith('/user/css') ||
    req.path.startsWith('/user/js') ||
    req.path === '/' ||
    req.path === '/user/home'
  ) {
    return next();
  }

  const pathParts = req.path.split('/').filter((part) => part !== '');
  const breadcrumbs = [{ name: 'Home', url: '/' }];

  let currentUrl = '';

  pathParts.forEach((part) => {
    currentUrl += `/${part}`;

    let name = part.charAt(0).toUpperCase() + part.slice(1);

    if (part === 'user') return;
    if (part === 'product-details') name = 'Product Details';
    if (part === 'cart') name = 'Shopping Cart';
    if (part === 'checkout') name = 'Checkout';

    if (/^[0-9a-fA-F]{24}$/.test(part)) {
      return;
    }

    breadcrumbs.push({ name, url: currentUrl });
  });

  res.locals.breadcrumbs = breadcrumbs;
  next();
};

module.exports = breadcrumbMiddleware;
