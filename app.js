require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const connectDB = require("./config/db");
const passport = require("./config/passport");

// ================== INITIAL SETUP ==================
const app = express();

// Connect Database (before server starts)
connectDB();

// ================== VIEW ENGINE ==================
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// ================== BODY PARSERS ==================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ================== STATIC FILES ==================
app.use(express.static(path.join(__dirname, "public")));

// ================== SESSION CONFIG ==================
app.use(
  session({
    name: "hoof.sid", // explicit cookie name (good practice)
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.default.create({ // Added .default here
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/hoof',
    }),

    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      httpOnly: true,
      sameSite: "lax",
    },
  })
);

// ================== PASSPORT ==================
app.use(passport.initialize());
app.use(passport.session());

// ================== GLOBAL LOCALS ==================
app.use((req, res, next) => {
    // This tells the browser: "Do not save this page in history/cache"
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
const testMailRoutes = require("./routes/testMail");

app.use("/user", userRoutes);
app.use("/auth", authRoutes);
app.use("/", testMailRoutes);

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
