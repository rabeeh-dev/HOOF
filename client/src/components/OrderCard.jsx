import React from 'react';
import { Card, Button, Typography, Tag, Space, Divider } from 'antd';
import { FaFileInvoice, FaEye } from 'react-icons/fa';
import InvoiceButton from './InvoiceButton';

const { Text } = Typography;

const OrderCard = ({ order, onViewDetails }) => {
  const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : '';

  const getStatusColor = (status) => {
    switch (status) {
      case 'PLACED':
      case 'CONFIRMED':
      case 'Processing':
        return 'blue';
      case 'DELIVERED':
        return 'green';
      case 'CANCELLED':
        return 'red';
      case 'Return Requested':
      case 'Return Approved':
      case 'Returned':
        return 'orange';
      default:
        return 'default';
    }
  };

  const isInvoiceAvailable = ['delivered', 'return requested', 'return approved', 'picked up', 'returned'].includes(order.status.toLowerCase());

  return (
    <Card 
      style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: 16 }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Order ID</Text>
            <Text strong style={{ fontSize: '14px' }}>#{order._id}</Text>
          </div>
          <div>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Placed on</Text>
            <Text strong style={{ fontSize: '14px' }}>{formattedDate}</Text>
          </div>
          <div>
            <Tag color={getStatusColor(order.status)} style={{ fontWeight: 'bold', padding: '4px 10px', fontSize: '12px' }}>
              {order.status}
            </Tag>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Total amount</Text>
          <Text strong style={{ fontSize: '18px', color: '#c41e3a' }}>
            ₹{order.totalAmount.toLocaleString('en-IN')}
          </Text>
          <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: 2 }}>
            Payment: {order.paymentMethod?.toUpperCase()} ({order.paymentStatus})
          </Text>
        </div>

        <Space size="middle">
          <Button 
            icon={<FaEye />} 
            onClick={() => onViewDetails(order._id)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            View Details
          </Button>

          {isInvoiceAvailable && (
            <InvoiceButton orderId={order._id} />
          )}
        </Space>
      </div>
    </Card>
  );
};

export default OrderCard;
