/**
 * @file app.js
 * @description Main application configuration for HOOF.
 * Sets up Express, view engine, security headers, sessions, middlewares, and routes.
 */

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');

const env = require('./config/env');
const passport = require('./config/passport');
const { sessionDispatcher } = require('./config/session');
const { checkBlocked } = require('./middlewares/auth.middleware');
const navCountsMiddleware = require('./middlewares/navCounts.middleware');
const breadcrumbMiddleware = require('./middlewares/breadcrumb.middleware');
const { notFoundHandler, globalErrorHandler } = require('./middlewares/error.middleware');
const routes = require('./routes/index');

const app = express();

// Proxy configuration if behind a reverse proxy (e.g. Nginx, Cloudflare, AWS ALB)
app.set('trust proxy', 1);

// Performance compression
app.use(compression());

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// View engine setup & layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/user');
app.set('layout extractMetas', true);
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

// Cross-platform case-insensitive view path resolver (Linux/AWS compatibility)
app.use((req, res, next) => {
  const origRender = res.render;
  res.render = function (view, options, callback) {
    let normalizedView = view;
    if (typeof normalizedView === 'string') {
      if (normalizedView.startsWith('user/')) {
        normalizedView = 'User/' + normalizedView.slice(5);
      } else if (normalizedView.startsWith('admin/')) {
        normalizedView = 'Admin/' + normalizedView.slice(6);
      }
    }
    return origRender.call(this, normalizedView, options, callback);
  };
  next();
});

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static file hosting
app.use(express.static(path.join(__dirname, 'public')));

// Session dispatch (splits user and admin cookies)
app.use(sessionDispatcher);

// Passport OAuth & Session
app.use(passport.initialize());
app.use(passport.session());

// Customer access guards
app.use(checkBlocked);

// Dynamic navbar badges (cartCount & wishlistCount)
app.use(navCountsMiddleware);

// Global locals & cache control
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  res.locals.user =
    req.session && req.session.userId
      ? {
          id: req.session.userId,
          name: req.session.userName,
          email: req.session.userEmail,
        }
      : null;

  next();
});

// Dynamic visual breadcrumbs
app.use(breadcrumbMiddleware);

// Master route tree
app.use('/', routes);

// 404 Not Found handler
app.use(notFoundHandler);

// Centralized 500 Server Error handler
app.use(globalErrorHandler);

module.exports = app;

// Backward-compatible direct execution (boots server.js when run via `node app.js`)
if (require.main === module) {
  require('./server');
}
