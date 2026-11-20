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

[✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [🏗️ Architecture & Status](#️-current-status--architecture) • [⚙️ Installation](#️-installation--setup) • [🤝 Contributing](#-contributing)

---

</div>

## 📌 Table of Contents

- [🌟 About the Project](#-about-the-project)
- [🏗️ Current Status & Architecture](#️-current-status--architecture)
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

## 🏗️ Current Status & Architecture

The application has successfully undergone a **complete modular architectural refactoring** across all 13 core domain modules. All legacy monolithic controllers, redundant middlewares, legacy router files, and obsolete proxy services have been eliminated in favor of clean separation of concerns:

- 🏛️ **Controller-Service-Model Architecture**: Thin controllers, pure asynchronous business logic services, and strongly-typed Mongoose models.
- ⚡ **Real-Time Communication**: Integrated **Socket.IO** for instantaneous inventory status alerts, block/unblock updates, and order notifications.
- 🛡️ **Production-Ready Security**: Centralized rate limiting (`express-rate-limit`), MongoDB-backed sessions (`connect-mongo`), role-based middleware (`isUser`, `isAdminLogin`, `isLoggedOut`), and global error handling (`AppError` + `errorHandler`).
- 📊 **Analytics & Reporting**: Sales reporting engine generating PDF (`puppeteer`) and Excel (`exceljs`) exports with dynamic date filters (daily, weekly, monthly, custom).
- 🖼️ **Smart Image Processing**: Multi-image disk storage with automatic Apple `.HEIC` to JPEG conversion (`heic-convert`).
- 📈 **Third-Party Integrations**: Google OAuth 2.0 (Passport), Nodemailer SMTP with Gmail App Passwords, Razorpay Payment Gateway, and Google Sheets API.
- 🧪 **100% Route Coverage**: All 103 user and admin routes audited, tested, and active.

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
├── 📄 app.js                          # Express app configuration & middleware
├── 📄 server.js                       # HTTP & Socket.IO server entry point
├── 📄 package.json
│
├── 📂 config/
│   ├── 📄 db.js                       # MongoDB connection
│   ├── 📄 env.js                      # Centralized environment configuration
│   ├── 📄 passport.js                 # Passport.js Google OAuth 2.0 strategy
│   └── 📄 session.js                  # MongoStore-backed session configuration
│
├── 📂 controllers/
│   ├── 📂 admin/
│   │   ├── 📄 auth.controller.js       # Admin authentication & session
│   │   ├── 📄 coupon.controller.js     # Admin coupon management
│   │   ├── 📄 customer.controller.js   # Customer account blocking & status
│   │   ├── 📄 dashboard.controller.js  # Dashboard analytics & Excel/PDF exports
│   │   ├── 📄 order.controller.js      # Admin order status & item tracking
│   │   └── 📄 product.controller.js    # Product & category CRUD operations
│   └── 📂 user/
│       ├── 📄 auth.controller.js       # User signup, login, OTP, Google OAuth
│       ├── 📄 cart.controller.js       # Shopping cart operations
│       ├── 📄 checkout.controller.js   # Checkout, address selection, payments
│       ├── 📄 order.controller.js      # Customer order tracking & invoices
│       ├── 📄 profile.controller.js    # Profile & address book management
│       ├── 📄 referral.controller.js   # Referral dashboard & reward withdrawal
│       ├── 📄 shop.controller.js       # Storefront catalog, search, filter
│       ├── 📄 wallet.controller.js     # Customer digital wallet & history
│       └── 📄 wishlist.controller.js   # Customer wishlist management
│
├── 📂 middlewares/
│   ├── 📄 adminAuth.middleware.js     # Admin route protection
│   ├── 📄 auth.middleware.js          # User route protection (isUser, isLoggedOut)
│   ├── 📄 breadcrumb.middleware.js    # Dynamic breadcrumb navigation builder
│   ├── 📄 error.middleware.js         # Centralized error handler & 404 handler
│   ├── 📄 navCounts.middleware.js     # Cart and wishlist count injector
│   ├── 📄 rateLimit.middleware.js     # Express-rate-limit protection
│   └── 📄 upload.middleware.js        # Multer image storage with HEIC support
│
├── 📂 models/
│   ├── 📄 Address.js                  # Address schema
│   ├── 📄 Admin.js                    # Admin schema
│   ├── 📄 Cart.js                     # Cart schema
│   ├── 📄 Category.js                 # Category schema
│   ├── 📄 Coupon.js                   # Coupon schema
│   ├── 📄 Order.js                    # Order schema
│   ├── 📄 Otp.js                      # OTP schema
│   ├── 📄 Product.js                  # Product schema
│   ├── 📄 ReferralConfig.js           # Referral rewards configuration schema
│   ├── 📄 Review.js                   # Review & rating schema
│   ├── 📄 User.js                     # User schema
│   ├── 📄 Wallet.js                   # Digital wallet schema
│   └── 📄 Wishlist.js                 # Wishlist schema
│
├── 📂 routes/
│   ├── 📄 index.js                    # Master portal router (/user, /admin, /auth)
│   ├── 📂 admin/
│   │   ├── 📄 auth.routes.js
│   │   ├── 📄 coupon.routes.js
│   │   ├── 📄 customer.routes.js
│   │   ├── 📄 dashboard.routes.js
│   │   ├── 📄 order.routes.js
│   │   └── 📄 product.routes.js
│   └── 📂 user/
│       ├── 📄 auth.routes.js
│       ├── 📄 cart.routes.js
│       ├── 📄 checkout.routes.js
│       ├── 📄 order.routes.js
│       ├── 📄 profile.routes.js
│       ├── 📄 referral.routes.js
│       ├── 📄 shop.routes.js
│       ├── 📄 wallet.routes.js
│       └── 📄 wishlist.routes.js
│
├── 📂 scripts/
│   └── 📄 backfillReferralCodes.js    # Maintenance script: backfill referral codes
│
├── 📂 services/
│   ├── 📄 auth.service.js             # User registration, verification, sessions
│   ├── 📄 cart.service.js             # Cart calculations & stock checks
│   ├── 📄 checkout.service.js         # Checkout calculations & order placement
│   ├── 📄 coupon.service.js           # Coupon validation & application logic
│   ├── 📄 order.service.js            # Customer order lifecycle & PDF invoices
│   ├── 📄 password.service.js         # Password reset token handling
│   ├── 📄 product.service.js          # Product filtering, sorting, & admin CRUD
│   ├── 📄 report.service.js           # Sales report generation (PDF & Excel)
│   ├── 📄 user.service.js             # User profile & account management logic
│   ├── 📄 wallet.service.js           # Wallet debit/credit transactions
│   └── 📄 wishlist.service.js         # Wishlist operations & transfers
│
├── 📂 utils/
│   ├── 📄 AppError.js                 # Custom operational error class
│   ├── 📄 asyncHandler.js             # Async wrapper for Express routes
│   ├── 📄 generateOtp.js              # Cryptographic OTP generator
│   ├── 📄 googleSheets.js             # Google Sheets API synchronization
│   ├── 📄 pdfBrowser.js               # Puppeteer PDF generation utility
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

> 🌐 App runs on: `http://localhost:8080`

---

### 🛡️ Access Admin Dashboard

1. Register / seed an admin document in MongoDB
2. Visit `http://localhost:8080/admin/login`

---

## 🔐 Environment Variables

Create a `.env` file in the root directory (or copy from `.env.example`):

```env
# ─── Server Configuration ───────────────────────
PORT=8080
NODE_ENV=development
BASE_URL=http://localhost:8080

# ─── Database ───────────────────────────────────
MONGO_URI=mongodb://localhost:27017/hoof_dev
# OR MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/hoof?retryWrites=true&w=majority

# ─── Session & Security ─────────────────────────
SESSION_SECRET=your_super_secret_session_key

# ─── Google OAuth 2.0 (Passport.js) ─────────────
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8080/auth/google/callback

# ─── Email / SMTP (Nodemailer) ──────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_16_character_app_password
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_16_character_app_password

# ─── Payment Gateway (Razorpay) ─────────────────
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# ─── Google Sheets API (Contact Us) ─────────────
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your_service_account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
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