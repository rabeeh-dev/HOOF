import api from './axios';

export const paymentService = {
  verifyPayment: (data) => api.post('/user/checkout/verify-payment', data),
  retryPayment: (orderId) => api.post('/user/checkout/retry-payment', { orderId })
};
