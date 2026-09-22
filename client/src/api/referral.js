import api from './axios';

export const referralService = {
  getReferralStats: () => api.get('/user/referral'),
  withdrawPoints: () => api.post('/user/referral/withdraw')
};
