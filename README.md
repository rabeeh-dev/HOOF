<div align="center">

<pre style="color:#b51505; font-weight:bold;">
██╗  ██╗ ██████╗  ██████╗ ███████╗
██║  ██║██╔═══██╗██╔═══██╗██╔════╝
███████║██║   ██║██║   ██║█████╗  
██╔══██║██║   ██║██║   ██║██╔══╝  
██║  ██║╚██████╔╝╚██████╔╝██║     
╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚═╝     
</pre>

### 👟 *Step Into Style — Shop the Finest Footwear Online*

[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Framework-Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![EJS](https://img.shields.io/badge/Templating-EJS-B4CA65?style=for-the-badge&logo=ejs&logoColor=black)](https://ejs.co)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

> **HOOF** is a modern full-stack ecommerce platform built for footwear lovers.  
> Browse, discover, and shop the latest shoes — fast, beautiful, and secure. 🛒✨

<br/>

[✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [⚙️ Installation](#️-installation--setup) • [📸 Screenshots](#-screenshots) • [🤝 Contributing](#-contributing)

---

</div>

## 📌 Table of Contents

- [🌟 About the Project](#-about-the-project)
- [✨ Features](#-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Project Structure](#-project-structure)
- [⚙️ Installation & Setup](#️-installation--setup)
- [🔐 Environment Variables](#-environment-variables)
- [📸 Screenshots](#-screenshots)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)
- [👨‍💻 Author](#-author)

---

## 🌟 About the Project

**HOOF** is a sleek, fully-responsive ecommerce website dedicated to footwear. Whether you're hunting for sneakers, formal shoes, or everyday casuals — HOOF has you covered. Powered by a robust **Node.js + Express** backend with **EJS** server-side rendering, **Passport.js** authentication, **OTP verification**, **Wallet system**, **Referral codes**, and a **MongoDB** database — it delivers a premium shopping experience from browsing to checkout.

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  🏠 Home → 👟 Shop → 🛒 Cart → 💳 Checkout → 📦 Orders     │
│                                                              │
│         Fast  •  Secure  •  Beautiful  •  Scalable          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

```
╔═══════════════════════════════════════════════════════════════╗
║                      🌟 CORE FEATURES                        ║
╠═══════════════════════════════════════════════════════════════╣
║  🔐  User Auth — Register, Login, Google OAuth (Passport.js) ║
║  📱  OTP Verification via Email                              ║
║  👟  Product Catalog with Filters, Search & Categories       ║
║  🛒  Shopping Cart — Add, Remove & Update Quantities         ║
║  ❤️   Wishlist — Save Favourite Products                     ║
║  💳  Secure Payment Gateway Integration                      ║
║  📦  Order Management — Place, Track & View History          ║
║  💰  Wallet System — Refunds & Balance Management            ║
║  🎟️  Coupon Management — Discounts & Promo Codes             ║
║  🔗  Referral Code System                                    ║
║  🗺️  Address Management — Multiple Delivery Addresses        ║
║  🛡️  Admin Dashboard — Products, Orders, Users, Categories  ║
║  🧭  Breadcrumb Navigation                                   ║
║  📧  Email Notifications & Password Reset                    ║
║  📱  Fully Responsive UI (Mobile-First)                      ║
╚═══════════════════════════════════════════════════════════════╝
```

- ✅ **User Auth** — Register, Login, Google OAuth via Passport.js
- ✅ **OTP Verification** — Email-based OTP on signup & password reset
- ✅ **Product Catalog** — Filter by category, search, sort & paginate
- ✅ **Shopping Cart** — Add, remove, update quantities in real-time
- ✅ **Wishlist** — Save products for later with one click
- ✅ **Payment Gateway** — Safe and seamless online payments
- ✅ **Order Management** — Track status, view history, order details
- ✅ **Wallet System** — Refunds credited to wallet, spend on orders
- ✅ **Coupons & Discounts** — Admin-created promo codes at checkout
- ✅ **Referral System** — Earn rewards by referring friends
- ✅ **Address Book** — Multiple saved addresses per user
- ✅ **Admin Dashboard** — Full CRUD: products, categories, orders, users
- ✅ **Server-Side Rendering** — Fast page loads with EJS + layouts
- ✅ **Responsive Design** — Polished UI on any screen size

---

## 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|:------|:-----------|
| 🎨 **Frontend** | EJS, CSS3, Vanilla JavaScript |
| ⚙️ **Backend** | Node.js, Express.js |
| 🗄️ **Database** | MongoDB, Mongoose ODM |
| 🔐 **Auth** | Passport.js (Local + Google OAuth), bcrypt, Express Session |
| 📧 **Email / OTP** | Nodemailer |
| 🖼️ **File Uploads** | Multer |
| 💳 **Payments** | Razorpay |
| 🔧 **Dev Tools** | Nodemon, Git, Postman, VS Code |

</div>

```
     🌐 BROWSER
          │
          │  HTTP Request (GET / POST)
          ▼
  ┌───────────────────────────────────────┐
  │          ⚙️  EXPRESS.JS SERVER         │
  │                                       │
  │  Routes → Middleware → Controllers    │
  │            ↓                          │
  │       Services / Utils                │
  │            ↓                          │
  │       EJS Views (SSR)                 │
  └──────────────┬────────────────────────┘
                 │
                 │  Mongoose ODM
                 ▼
  ┌───────────────────────────────────────┐
  │             🗄️  MONGODB                │
  │  Users | Products | Orders | Cart     │
  │  Wishlist | Wallet | Coupons | OTP    │
  └───────────────────────────────────────┘
```

---

## 📁 Project Structure

```
HOOF/
│
├── 📄 app.js                          # Express app entry point
├── 📄 backfillReferralCodes.js        # Utility: backfill referral codes
├── 📄 package.json
│
├── 📂 config/
│   ├── 📄 db.js                       # MongoDB connection
│   └── 📄 passport.js                 # Passport.js strategies (Local + Google)
│
├── 📂 controller/
│   ├── 📄 Address.js                  # Address CRUD for users
│   ├── 📄 Admin.js                    # Admin dashboard & user management
│   ├── 📄 AdminCoupon.js              # Admin coupon management
│   ├── 📄 AdminProduct.js             # Admin product management
│   ├── 📄 Coupon.js                   # User coupon application
│   ├── 📄 Product.js                  # Product listing & details
│   ├── 📄 User.js                     # User profile, auth, OTP
│   └── 📄 UserCheckout.js             # Checkout & order placement
│
├── 📂 middleware/
│   ├── 📄 adminAuth.js                # Admin route protection
│   ├── 📄 auth.js                     # User route protection
│   ├── 📄 breadcrumb.js               # Breadcrumb navigation builder
│   ├── 📄 cartCount.js                # Inject cart count into views
│   ├── 📄 multer.js                   # Profile image upload config
│   ├── 📄 productMulter.js            # Product image upload config
│   └── 📄 wishlistCount.js            # Inject wishlist count into views
│
├── 📂 model/
│   ├── 📄 Address.js                  # Address schema
│   ├── 📄 Admin.js                    # Admin schema
│   ├── 📄 Cart.js                     # Cart schema
│   ├── 📄 Category.js                 # Category schema
│   ├── 📄 Coupon.js                   # Coupon schema
│   ├── 📄 Order.js                    # Order schema
│   ├── 📄 Otp.js                      # OTP schema
│   ├── 📄 Product.js                  # Product schema
│   ├── 📄 Review.js                   # Review & rating schema
│   ├── 📄 User.js                     # User schema
│   ├── 📄 Wallet.js                   # Wallet schema
│   └── 📄 Wishlist.js                 # Wishlist schema
│
├── 📂 routes/
│   ├── 📄 Address.js                  # /address/*
│   ├── 📄 Admin.js                    # /admin/*
│   ├── 📄 Auth.js                     # /login, /register, /logout
│   └── 📄 User.js                     # /shop, /cart, /orders, etc.
│
├── 📂 services/
│   ├── 📄 AdminProduct.js             # Admin product business logic
│   ├── 📄 Auth.js                     # Auth service (OTP, sessions)
│   ├── 📄 Password.js                 # Password reset logic
│   ├── 📄 Product.js                  # Product filtering & search
│   ├── 📄 User.js                     # User profile logic
│   ├── 📄 UserCheckout.js             # Checkout business logic
│   └── 📄 Wallet.js                   # Wallet debit/credit logic
│
├── 📂 utils/
│   ├── 📄 generateOtp.js              # OTP generator
│   └── 📄 sendEmail.js                # Nodemailer email sender
│
├── 📂 public/
│   ├── 📂 admin/
│   │   ├── 📂 css/                    # Admin stylesheets
│   │   └── 📂 js/                     # Admin client-side scripts
│   ├── 📂 user/
│   │   ├── 📂 css/                    # User stylesheets
│   │   ├── 📂 js/                     # User client-side scripts
│   │   ├── 📂 fonts/                  # Custom fonts
│   │   └── 📂 images/                 # Static UI images
│   └── 📂 uploads/
│       ├── 📂 products/               # Uploaded product images
│       └── 📂 profile/                # Uploaded user profile pictures
│
└── 📂 views/
    ├── 📂 Admin/
    │   ├── 📄 admin-dashboard.ejs
    │   ├── 📄 product-management.ejs
    │   ├── 📄 add-product.ejs
    │   ├── 📄 edit-product.ejs
    │   ├── 📄 category-management.ejs
    │   ├── 📄 coupon-management.ejs
    │   ├── 📄 admin-orders.ejs
    │   ├── 📄 admin-order-detail.ejs
    │   ├── 📄 user-management.ejs
    │   └── 📂 auth/
    │       └── 📄 login.ejs
    ├── 📂 User/
    │   ├── 📄 landing.ejs
    │   ├── 📄 home.ejs
    │   ├── 📄 shop.ejs
    │   ├── 📄 product-details.ejs
    │   ├── 📄 cart.ejs
    │   ├── 📄 checkout.ejs
    │   ├── 📄 wishlist.ejs
    │   ├── 📄 orders.ejs
    │   ├── 📄 order-detail.ejs
    │   ├── 📄 order-success.ejs
    │   ├── 📄 wallet.ejs
    │   ├── 📄 referral.ejs
    │   ├── 📄 user-profile.ejs
    │   ├── 📄 user-address.ejs
    │   ├── 📄 change-email.ejs
    │   ├── 📄 about.ejs
    │   ├── 📄 contact.ejs
    │   ├── 📄 404.ejs
    │   └── 📂 auth/
    │       ├── 📄 login.ejs
    │       ├── 📄 register.ejs
    │       ├── 📄 verify-otp.ejs
    │       ├── 📄 forgot-password.ejs
    │       └── 📄 reset-password.ejs
    ├── 📂 layouts/
    │   ├── 📄 admin.ejs               # Admin layout wrapper
    │   └── 📄 user.ejs                # User layout wrapper
    └── 📂 partials/
        ├── 📂 admin/
        │   ├── 📄 overlay.ejs
        │   └── 📄 overlay-scripts.ejs
        └── 📂 user/
            ├── 📄 head.ejs
            ├── 📄 header.ejs
            └── 📄 footer.ejs
```

---

## ⚙️ Installation & Setup

### 📋 Prerequisites

Make sure you have the following installed:

- 🟢 **Node.js** v16+
- 🍃 **MongoDB** (local or [MongoDB Atlas](https://cloud.mongodb.com))
- 🔧 **Git**
- 📦 **npm**

---

### 🔽 Clone the Repository

```bash
git clone https://github.com/rabeeh-dev/HOOF.git
cd HOOF
```

---

### 📦 Install Dependencies

```bash
npm install
```

---

### 🔐 Setup Environment Variables

```bash
cp .env.example .env
```

Fill in your values in the `.env` file *(see section below)*.

---

### ▶️ Run the App

```bash
# Development mode (auto-restart with nodemon)
npm run dev

# Production mode
npm start
```

> 🌐 App runs on: `http://localhost:3000`

---

### 🛡️ Access Admin Dashboard

1. Register / seed an admin document in MongoDB
2. Visit `http://localhost:3000/admin`

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# ─── Server ─────────────────────────────────────
PORT=3000
NODE_ENV=development

# ─── Database ───────────────────────────────────
MONGO_URI=mongodb://localhost:27017/hoofdb
# OR MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/hoofdb

# ─── Session ────────────────────────────────────
SESSION_SECRET=your_super_secret_session_key

# ─── Google OAuth (Passport.js) ─────────────────
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# ─── Email / OTP ────────────────────────────────
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# ─── Payment Gateway ────────────────────────────
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

> ⚠️ **Never commit your `.env` file!** It's already covered by `.gitignore`.

---

---

## 📸 Screenshots

| 🏠 Home Page | 👟 Shop |
|:---:|:---:|
| *Screenshot coming soon* | *Screenshot coming soon* |

| 🛒 Shopping Cart | 🛡️ Admin Dashboard |
|:---:|:---:|
| *Screenshot coming soon* | *Screenshot coming soon* |

| 💰 Wallet | 🎟️ Coupons |
|:---:|:---:|
| *Screenshot coming soon* | *Screenshot coming soon* |

---

## 🤝 Contributing

Contributions are always welcome! 🙌

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/your-username/HOOF.git

# 3. Create a feature branch
git checkout -b feature/AmazingFeature

# 4. Commit your changes
git commit -m "✨ Add some AmazingFeature"

# 5. Push to your branch
git push origin feature/AmazingFeature

# 6. Open a Pull Request 🎉
```

---

## 🐛 Found a Bug?

Open an [issue](https://github.com/rabeeh-dev/HOOF/issues) and include:

- 🔍 A clear description of the problem
- 🔁 Steps to reproduce it
- 📸 Screenshots if applicable

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

```
MIT License — Free to use, modify & distribute with attribution.
```

---

## 👨‍💻 Author

<div align="center">

**Muhammed Rabeeh**
*Full Stack & Mobile App Developer*

[![GitHub](https://img.shields.io/badge/GitHub-rabeeh--dev-181717?style=for-the-badge&logo=github)](https://github.com/rabeeh-dev)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0077B5?style=for-the-badge&logo=linkedin)](https://linkedin.com)
[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](#)

<br/>

```
Made with ❤️ and ☕ from Kerala, India 🇮🇳
```

⭐ **If HOOF impressed you, drop a star on the repo!** ⭐

</div>
