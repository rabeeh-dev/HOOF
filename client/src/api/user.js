import api from './axios';

export const userService = {
  // Product Catalog Services
  getProducts: (params) => api.get('/user/products', { params }),
  getNewArrivals: (limit) => api.get('/user/products/new-arrivals', { params: { limit } }),
  getProductDetails: (id) => api.get(`/user/product/${id}`),
  getCategories: () => api.get('/user/categories'),

  // Future REST API Customer endpoints will be defined here:
  // getProfile: () => api.get('/user/profile'),
  // updateProfile: (data) => api.put('/user/profile', data),
  // getCart: () => api.get('/user/cart'),
  // addToCart: (data) => api.post('/user/cart/add', data),
  // getWishlist: () => api.get('/user/wishlist'),
  // getWallet: () => api.get('/user/wallet'),
  // getOrders: () => api.get('/user/orders'),
  // checkout: (data) => api.post('/user/checkout', data),
};
