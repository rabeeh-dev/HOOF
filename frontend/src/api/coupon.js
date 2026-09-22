import api from './axios';

export const couponService = {
  getAvailableCoupons: () => api.get('/user/coupons/available'),
  applyCoupon: (couponCode) => api.post('/user/coupons/apply', { couponCode })
};
