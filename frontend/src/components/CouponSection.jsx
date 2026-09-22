import React, { useState } from 'react';
import { Card, Input, Button, Tag, Space, Typography, message } from 'antd';
import { FaTag, FaTimes } from 'react-icons/fa';

const { Text, Paragraph, Title } = Typography;

const CouponSection = ({ 
  availableCoupons = [], 
  appliedCouponCode = null, 
  onApply, 
  onRemove,
  loading = false
}) => {
  const [code, setCode] = useState('');

  const handleSubmit = () => {
    if (!code.trim()) {
      return message.warning('Please enter a coupon code.');
    }
    onApply(code.trim().toUpperCase());
    setCode('');
  };

  return (
    <Card title="Apply Promo Coupon" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: 24 }}>
      {appliedCouponCode ? (
        <div style={{ background: '#f6ffed', border: '1px solid #b7eb8f', padding: '12px 16px', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <FaTag style={{ color: '#52c41a' }} />
            <Text strong style={{ color: '#52c41a' }}>COUPON APPLIED: {appliedCouponCode}</Text>
          </Space>
          <Button 
            type="text" 
            danger 
            icon={<FaTimes />} 
            onClick={onRemove} 
            size="small"
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Remove
          </Button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <Input 
              placeholder="ENTER CODE" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              disabled={loading}
              style={{ textTransform: 'uppercase' }}
              onPressEnter={handleSubmit}
            />
            <Button 
              type="primary" 
              onClick={handleSubmit} 
              loading={loading}
              style={{ background: '#c41e3a', borderColor: '#c41e3a' }}
            >
              Apply
            </Button>
          </div>

          {availableCoupons.length > 0 ? (
            <div>
              <Title level={5} style={{ fontSize: '13px', margin: '0 0 10px 0', color: '#888', textTransform: 'uppercase' }}>
                Available Coupons
              </Title>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {availableCoupons.map((coupon) => (
                  <Card 
                    key={coupon._id} 
                    hoverable
                    bodyStyle={{ padding: '8px 12px' }}
                    style={{ border: '1px dashed #d9d9d9', borderRadius: 6, cursor: 'pointer' }}
                    onClick={() => onApply(coupon.couponCode)}
                  >
                    <Space direction="vertical" size={2} style={{ width: '100%' }}>
                      <Tag color="red" style={{ fontWeight: 'bold', margin: 0 }}>
                        {coupon.couponCode}
                      </Tag>
                      <Text style={{ fontSize: '11px', fontWeight: 'bold' }}>
                        Save {coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '10px' }}>
                        Min Purchase: ₹{coupon.minPurchaseAmount}
                      </Text>
                    </Space>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Text type="secondary" style={{ fontSize: '12px' }}>No active coupons available for your current order total.</Text>
          )}
        </div>
      )}
    </Card>
  );
};

export default CouponSection;
