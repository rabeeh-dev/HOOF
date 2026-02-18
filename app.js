/**
 * @file app.js
 * @description Main application entry point for HOOF.
 * Sets up Express, middleware, view engine, session, and routes.
 */

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const MongoStore = require("connect-mongo");
const path = require("path");
const connectDB = require("./config/db");
const passport = require("./config/passport");
const { checkBlocked } = require("./middleware/auth");
const userController = require("./controller/User");
const morgan = require('morgan');



const app = express();

// Establish Database Connection
connectDB();

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
app.use(
  session({
    name: "hoof.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.default.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/hoof',
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// Proxy configuration if behind a load balancer
app.set('trust proxy', 1);

// Custom middleware to check if user is blocked
app.use(checkBlocked);

// ==========================================
// PASSPORT AUTHENTICATION
// ==========================================
app.use(passport.initialize());
app.use(passport.session());

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
const userRoutes = require("./routes/User");
const addressRoutes = require("./routes/Address");
const authRoutes = require("./routes/Auth");
const adminRoutes = require('./routes/Admin');

app.use("/user", userRoutes);
app.use("/user/address", addressRoutes);
app.use("/auth", authRoutes);
app.use(morgan('dev'));

// Admin routes with layout override
app.use('/admin', (req, res, next) => {
  res.locals.layout = false;
  next();
}, adminRoutes);

// ==========================================
// LANDING PAGE
// ==========================================
// ==========================================
// LANDING PAGE
// ==========================================
app.get("/", userController.landingPage);

// ==========================================
// SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
