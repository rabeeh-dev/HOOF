require("dotenv").config();

const express = require("express");
const session = require("express-session");
const expressLayouts = require("express-ejs-layouts");
const MongoStore = require("connect-mongo");
const path = require("path");
const connectDB = require("./config/db");
const passport = require("./config/passport");
const { checkBlocked } = require("./middleware/auth");

const app = express();
connectDB();

// ================== VIEW ENGINE ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layouts/user");
app.set("layout extractMetas", true);
app.set("layout extractScripts", true);
app.set("layout extractStyles", true);

// ================== BODY PARSERS ==================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ================== STATIC FILES ==================
app.use(express.static(path.join(__dirname, "public")));
// ================== SESSION CONFIG ==================
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

app.set('trust proxy', 1);
app.use(checkBlocked);

// ================== PASSPORT ==================
app.use(passport.initialize());
app.use(passport.session());

// ================== GLOBAL LOCALS ==================
app.use((req, res, next) => {
  res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  res.header('Expires', '-1');
  res.header('Pragma', 'no-cache');

  res.locals.user = req.session.userId ? {
    id: req.session.userId,
    name: req.session.userName,
    email: req.session.userEmail
  } : null;
  next();
});
// ================== ROUTES ==================
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require('./routes/adminRoutes');

app.use("/user", userRoutes);
app.use("/auth", authRoutes);

app.use('/admin', (req, res, next) => {
  res.locals.layout = false;
  next();
}, adminRoutes);

// ================== HOME ==================
app.get("/", (req, res) => {
  res.render("User/landing", {
    title: "HOOF | Premium Sneakers",
    layout: "layouts/user",
  });
});

// ================== SERVER ==================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
