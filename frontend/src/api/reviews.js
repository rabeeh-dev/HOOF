import api from './axios';

export const reviewsService = {
  addReview: (productId, data) => api.post(`/user/product/${productId}/review`, data),
  editReview: (reviewId, data) => api.put(`/user/review/${reviewId}`, data),
  deleteReview: (reviewId) => api.delete(`/user/review/${reviewId}`)
};
