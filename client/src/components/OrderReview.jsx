import React from 'react';
import { Card, Typography, Space, Divider } from 'antd';
import { FaMapMarkerAlt, FaCreditCard } from 'react-icons/fa';

const { Text, Paragraph } = Typography;

const OrderReview = ({ selectedAddress = null, paymentMethod = 'COD' }) => {
  if (!selectedAddress) {
    return (
      <Card style={{ borderRadius: 8, borderColor: '#ffccc7', background: '#fff2f0' }}>
        <Text type="danger" strong>No shipping address selected. Please complete Step 1.</Text>
      </Card>
    );
  }

  const paymentLabelMap = {
    COD: 'Cash on Delivery (COD)',
    upi: 'Online UPI/Card (via Razorpay)',
    wallet: 'HOOF Digital Wallet'
  };

  return (
    <Card title="Review Order Options" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      {/* Shipping Address review */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <FaMapMarkerAlt style={{ fontSize: '18px', color: '#c41e3a', marginTop: 3 }} />
        <div>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 6 }}>Shipping Address</Text>
          <Text strong>{selectedAddress.fullName}</Text>
          <Paragraph style={{ margin: 0, fontSize: '13px', color: '#555' }}>
            {selectedAddress.houseName}, {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}
          </Paragraph>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
            Mobile: {selectedAddress.mobile}
          </Text>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Payment Method review */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <FaCreditCard style={{ fontSize: '18px', color: '#c41e3a', marginTop: 3 }} />
        <div>
          <Text strong style={{ fontSize: '14px', display: 'block', marginBottom: 6 }}>Payment Details</Text>
          <Text>{paymentLabelMap[paymentMethod] || paymentMethod}</Text>
        </div>
      </div>
    </Card>
  );
};

export default OrderReview;
