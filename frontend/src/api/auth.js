import api from './axios';

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  adminLogin: (credentials) => api.post('/admin/login', credentials),
  signup: (data) => api.post('/auth/signup', data),
  verifyOtp: (otp) => api.post('/auth/verify-otp', { otp }),
  resendOtp: () => api.post('/auth/resend-otp'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, data) => api.post(`/auth/reset-password/${token}`, data),
  logout: () => api.post('/auth/logout'),
};
