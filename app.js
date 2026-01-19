
const express = require('express')
const mongoose = require('mongoose')
const session = require('express-session')
const path = require('path')
const dotenv = require('dotenv')
const connectDB = require('./config/db')
dotenv.config()


connectDB()


const app = express()



// Session middleware (Add this BEFORE routes)
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
}));

// Middleware to make user data available in all views
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        name: req.session.userName,
        email: req.session.userEmail,
        role: req.session.userRole
    } : null;
    next();
});

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const userRoutes = require('./routes/userRoutes');
// const adminRoutes = require('./routes/adminRoutes');

app.use('/user', userRoutes);
// app.use('/admin', adminRoutes);


app.get('/', (req, res) => {
    res.render('User/landing', {
        title: 'Home - ShoeStore',
        layout: 'layouts/user'
    });
});      

app.get('/home', (req, res) => {
  res.render('User/home', {
    title: 'Home - ShoeStore',
    layout: 'layouts/user'
  });
});



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});