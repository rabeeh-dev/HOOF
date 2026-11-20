/**
 * @file app.js
 * @description Main application entry point for HOOF.
 * Sets up Express, middleware, view engine, session, and routes.
 */

const env = require("./config/env");
const helmet = require('helmet');
const compression = require('compression');
const express = require("express");
const http = require("http");
const expressLayouts = require("express-ejs-layouts");
const path = require("path");
const connectDB = require("./config/db");
const passport = require("./config/passport");
const { sessionDispatcher } = require("./config/session");
const { checkBlocked } = require("./middlewares/auth.middleware");
const routes = require("./routes/index");

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const { Server } = require('socket.io');
const io = new Server(server);
app.set('io', io);
app.use(compression());

// Establish Database Connection
connectDB();

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// ==========================================
// VIEW ENGINE SETUP
// ==========================================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/user");
app.set("layout extractMetas", true);
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// ==========================================
// BODY PARSING MIDDLEWARE
// ==========================================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ==========================================
// STATIC FILES
// ==========================================
app.use(express.static(path.join(__dirname, "public")));

// ==========================================
// SESSION CONFIGURATION
// ==========================================
app.use(sessionDispatcher);

// Proxy configuration if behind a load balancer
app.set('trust proxy', 1);

// ==========================================
// PASSPORT AUTHENTICATION
// ==========================================
app.use(passport.initialize());
app.use(passport.session());

// Custom middleware to check if user is blocked
app.use(checkBlocked);

// Header Cart Count Middleware
const fetchCartCount = require("./middleware/cartCount");
app.use(fetchCartCount);

// Header Wishlist Count Middleware
const fetchWishlistCount = require("./middleware/wishlistCount");
app.use(fetchWishlistCount);

// ==========================================
// GLOBAL LOCALS & CACHE CONTROL
// ==========================================
app.use((req, res, next) => {
  // Prevent browser caching for sensitive pages
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  // Make user data available across all views
  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    email: req.session.userEmail
  } : null;
  next();
});

// Breadcrumb logic
const breadcrumbMiddleware = require("./middleware/breadcrumb");
app.use(breadcrumbMiddleware);

// ==========================================
// ROUTE DEFINITIONS
// ==========================================
app.use("/", routes);

// ==========================================
// CATCH-ALL 404 HANDLER
// ==========================================
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/admin')) {
    res.status(404).render('Admin/404', { layout: false, title: '404 - Page Not Found' });
  } else {
    res.status(404).render('User/404', { title: '404 - Page Not Found' });
  }
});

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const PORT = env.PORT || 8080;
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = { app, server };
