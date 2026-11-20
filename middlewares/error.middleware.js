/**
 * @file middlewares/error.middleware.js
 * @description Centralized Express error handler for 404 Not Found and 500 Server Errors.
 */

/**
 * 404 Not Found Middleware Handler
 */
const notFoundHandler = (req, res, next) => {
  const isApi = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

  if (isApi) {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  if (req.originalUrl.startsWith('/admin')) {
    return res.status(404).render('Admin/404', { layout: false, title: '404 - Page Not Found' });
  }

  return res.status(404).render('User/404', { title: '404 - Page Not Found' });
};

/**
 * Global 500 / Centralized Error Handler Middleware
 */
const globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isApi = req.xhr || (req.headers.accept && req.headers.accept.includes('application/json'));

  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message || err);

  if (res.headersSent) {
    return next(err);
  }

  if (isApi) {
    return res.status(statusCode).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  }

  if (req.originalUrl.startsWith('/admin')) {
    return res.status(statusCode).render('Admin/404', {
      layout: false,
      title: 'Error | HOOF Admin',
      message: err.message || 'An error occurred',
    });
  }

  return res.status(statusCode).render('User/404', {
    title: 'Error | HOOF',
    message: err.message || 'An unexpected error occurred',
  });
};

module.exports = {
  notFoundHandler,
  globalErrorHandler,
};
