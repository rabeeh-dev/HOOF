import api from './axios';

export const checkoutService = {
  getCheckoutDetails: () => api.get('/user/checkout'),
  placeOrder: (data) => api.post('/user/checkout/place-order', data)
};
