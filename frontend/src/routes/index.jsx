import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../layouts/MainLayout';
import AdminLayout from '../layouts/AdminLayout';
import AuthLayout from '../layouts/AuthLayout';

// Guards
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import GuestRoute from './GuestRoute';

// User Pages
import Home from '../pages/Home';
import Shop from '../pages/Shop';
import ProductDetails from '../pages/ProductDetails';
import Cart from '../pages/Cart';
import Wishlist from '../pages/Wishlist';
import Checkout from '../pages/Checkout';
import OrderSuccess from '../pages/OrderSuccess';
import OrderFailed from '../pages/OrderFailed';
import Orders from '../pages/Orders';
import OrderDetail from '../pages/OrderDetail';
import Profile from '../pages/Profile';
import EditProfile from '../pages/EditProfile';
import AddressBook from '../pages/AddressBook';
import Wallet from '../pages/Wallet';
import Referral from '../pages/Referral';

// Auth Pages
import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Otp from '../pages/Otp';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';

// Admin Pages
import AdminLogin from '../pages/admin/Login';
import AdminDashboard from '../pages/admin/Dashboard';
import AdminProducts from '../pages/admin/Products';
import AdminCategories from '../pages/admin/Categories';
import AdminOrders from '../pages/admin/OrdersPage';
import AdminCoupons from '../pages/admin/CouponsPage';
import AdminCouponCreate from '../pages/admin/CouponCreatePage';
import AdminCouponEdit from '../pages/admin/CouponEditPage';
import AdminCustomers from '../pages/admin/CustomersPage';
import AdminOrderDetails from '../pages/admin/OrderDetailsPage';
import AdminCustomerDetails from '../pages/admin/CustomerDetailsPage';
import ReportsDashboardPage from '../pages/admin/ReportsDashboardPage';
import SalesReportPage from '../pages/admin/SalesReportPage';
import ProductReportPage from '../pages/admin/ProductReportPage';
import CustomerReportPage from '../pages/admin/CustomerReportPage';
import AdminReferrals from '../pages/admin/ReferralSettingsPage';
import AdminSettings from '../pages/admin/Settings';
import AdminProductCreate from '../pages/admin/ProductCreate';
import AdminProductEdit from '../pages/admin/ProductEdit';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Guest/Auth routes */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-otp" element={<Otp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>
      </Route>

      {/* Main Storefront routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        
        {/* Protected Customer routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/order-failed/:id" element={<OrderFailed />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/addresses" element={<AddressBook />} />
          <Route path="/profile/wallet" element={<Wallet />} />
          <Route path="/profile/referrals" element={<Referral />} />
        </Route>
      </Route>

      {/* Admin Panel routes */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/products" element={<AdminProducts />} />
          <Route path="/admin/products/add" element={<AdminProductCreate />} />
          <Route path="/admin/products/edit/:id" element={<AdminProductEdit />} />
          <Route path="/admin/categories" element={<AdminCategories />} />
          <Route path="/admin/orders" element={<AdminOrders />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
          <Route path="/admin/coupons" element={<AdminCoupons />} />
          <Route path="/admin/coupons/add" element={<AdminCouponCreate />} />
          <Route path="/admin/coupons/edit/:id" element={<AdminCouponEdit />} />
          <Route path="/admin/customers" element={<AdminCustomers />} />
          <Route path="/admin/customers/:id" element={<AdminCustomerDetails />} />
          <Route path="/admin/reports" element={<ReportsDashboardPage />} />
          <Route path="/admin/reports/sales" element={<SalesReportPage />} />
          <Route path="/admin/reports/products" element={<ProductReportPage />} />
          <Route path="/admin/reports/customers" element={<CustomerReportPage />} />
          <Route path="/admin/referrals" element={<AdminReferrals />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* Admin Login Route */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
