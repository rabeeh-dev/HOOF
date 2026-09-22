import React from 'react';
import { Card, Typography, Avatar, List } from 'antd';

const { Text } = Typography;

const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/60x60?text=HOOF';
  if (image.startsWith('http')) return image;
  const cleanPath = image.startsWith('/') ? image : `/${image}`;
  return `http://localhost:8080${cleanPath}`;
};

const OrderSummary = ({ cartItems = [] }) => {
  return (
    <Card title="Order Items" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: 24 }}>
      <List
        itemLayout="horizontal"
        dataSource={cartItems}
        renderItem={(item) => {
          const product = item.productId;
          return (
            <List.Item style={{ padding: '12px 0' }}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    src={getImageUrl(product?.productImage && product.productImage[0])} 
                    shape="square" 
                    size={60} 
                  />
                }
                title={<span style={{ fontWeight: 'bold', fontSize: '14px' }}>{product?.productName}</span>}
                description={
                  <div>
                    <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Size: UK {item.size}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>Qty: {item.quantity}</Text>
                  </div>
                }
              />
              <div style={{ textAlign: 'right' }}>
                <Text strong style={{ fontSize: '14px', display: 'block' }}>
                  ₹{(product?.salePrice * item.quantity).toLocaleString('en-IN')}
                </Text>
                {item.quantity > 1 && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    (₹{product?.salePrice} each)
                  </Text>
                )}
              </div>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default OrderSummary;
