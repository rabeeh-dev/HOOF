import api from './axios';

export const profileService = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile/update', data),
  changePassword: (data) => api.post('/user/profile/change-password', data),
  requestPasswordResetEmail: () => api.post('/user/profile/change-password-request')
};
