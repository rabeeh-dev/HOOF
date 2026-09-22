import api from './axios';

export const adminService = {
  getDashboardData: (params) => api.get('/admin/dashboard', { params }),

  // Product Management
  getProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  addProduct: (formData) => api.post('/admin/products', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateProduct: (id, formData) => api.put(`/admin/products/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  toggleProductStatus: (id) => api.patch(`/admin/products/${id}/toggle-status`),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),

  // Category Management
  getCategories: (params) => api.get('/admin/categories', { params }),
  getAllCategories: () => api.get('/admin/categories/all'),
  addCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  toggleCategoryStatus: (id) => api.patch(`/admin/categories/${id}/toggle-status`),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Coupon Management
  getCoupons: (params) => api.get('/admin/coupons', { params }),
  getCoupon: (id) => api.get(`/admin/coupons/${id}`),
  addCoupon: (data) => api.post('/admin/coupons', data),
  updateCoupon: (id, data) => api.patch(`/admin/coupons/${id}`, data),
  toggleCouponStatus: (id) => api.patch(`/admin/coupons/${id}/toggle-status`),
  deleteCoupon: (id) => api.delete(`/admin/coupons/${id}`),

  // Referral Configuration
  getReferralSettings: () => api.get('/admin/referral-settings'),
  updateReferralSettings: (data) => api.patch('/admin/referral-settings', data),

  // Order Management
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  updatePaymentStatus: (id, data) => api.patch(`/admin/orders/${id}/payment-status`, data),
  cancelOrder: (id) => api.patch(`/admin/orders/${id}/cancel`),
  updateOrderItemStatus: (orderId, itemId, data) => api.patch(`/admin/orders/${orderId}/item/${itemId}/status`, data),

  // Customer Management
  getCustomers: (params) => api.get('/admin/customers', { params }),
  getCustomer: (id) => api.get(`/admin/customers/${id}`),
  toggleCustomerStatus: (id, action) => api.patch(`/admin/customers/${id}/${action}`),

  // Reports
  getSalesReport: (params) => api.get('/admin/reports/sales', { params }),
  getProductReport: (params) => api.get('/admin/reports/products', { params }),
  getCustomerReport: (params) => api.get('/admin/reports/customers', { params }),
};
