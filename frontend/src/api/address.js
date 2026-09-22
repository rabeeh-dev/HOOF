import api from './axios';

export const addressService = {
  getAddresses: () => api.get('/user/addresses'),
  addAddress: (data) => api.post('/user/address/add', data),
  editAddress: (id, data) => api.put(`/user/address/edit/${id}`, data),
  deleteAddress: (id) => api.delete(`/user/address/delete/${id}`)
};
