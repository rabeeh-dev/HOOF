import React, { useState } from 'react';
import { Button, message } from 'antd';
import { FaFileInvoice } from 'react-icons/fa';
import { invoiceService } from '../api/invoice';

const InvoiceButton = ({ orderId }) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async (e) => {
    e.stopPropagation();
    setDownloading(true);
    try {
      const blobData = await invoiceService.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(new Blob([blobData]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('Invoice downloaded successfully.');
    } catch (err) {
      console.error(err);
      message.error('Failed to download invoice.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Button 
      type="default" 
      icon={<FaFileInvoice />} 
      loading={downloading}
      onClick={handleDownload}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
    >
      Invoice
    </Button>
  );
};

export default InvoiceButton;
