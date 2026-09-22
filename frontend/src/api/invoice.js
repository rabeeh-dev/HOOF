import api from './axios';

export const invoiceService = {
  downloadInvoice: async (orderId) => {
    const response = await api.get(`/user/orders/invoice/${orderId}`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
export default invoiceService;
