import api from './axios';

export const walletService = {
  getWalletDetails: () => api.get('/user/wallet')
};
