import api from './axios';

export const orderService = {
  getOrderDetails: (id) => api.get(`/user/order/${id}`)
};
