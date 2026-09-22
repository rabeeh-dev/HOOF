import React from 'react';
import { Card, Typography, Divider } from 'antd';

const { Text, Title } = Typography;

const PriceBreakdown = ({ 
  subtotal = 0, 
  shippingCharge = 0, 
  discountAmount = 0, 
  totalAmount = 0 
}) => {
  // Ensure we use backend calculations strictly
  const displayTotal = subtotal + shippingCharge - discountAmount;

  return (
    <Card title="Billing Details" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      {/* Subtotal */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text type="secondary">Subtotal</Text>
        <Text strong>₹{subtotal.toLocaleString('en-IN')}</Text>
      </div>

      {/* Shipping */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text type="secondary">Shipping Fee</Text>
        {shippingCharge === 0 ? (
          <Text type="success" strong>FREE</Text>
        ) : (
          <Text strong>₹{shippingCharge.toLocaleString('en-IN')}</Text>
        )}
      </div>

      {/* Coupon Discount */}
      {discountAmount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text type="secondary">Coupon Discount</Text>
          <Text style={{ color: '#52c41a' }} strong>- ₹{discountAmount.toLocaleString('en-IN')}</Text>
        </div>
      )}

      <Divider style={{ margin: '15px 0' }} />

      {/* Grand Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4} style={{ margin: 0 }}>Total Amount</Title>
        <Title level={4} style={{ margin: 0, color: '#c41e3a' }}>
          ₹{displayTotal.toLocaleString('en-IN')}
        </Title>
      </div>
    </Card>
  );
};

export default PriceBreakdown;
