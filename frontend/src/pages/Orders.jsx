import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Typography, Spin, Card, Button } from 'antd';
import { FaArrowLeft } from 'react-icons/fa';
import api from '../api/axios';
import OrderCard from '../components/OrderCard';

const { Title, Paragraph } = Typography;

const Orders = () => {
  const navigate = useNavigate();

  // Query customer orders
  const { data: orders = [], isLoading, isError } = useQuery({
    queryKey: ['orders-history'],
    queryFn: async () => {
      const res = await api.get('/user/orders');
      return res.data?.orders || [];
    }
  });

  const handleViewDetails = (id) => {
    navigate(`/orders/${id}`);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading order history..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>My Orders</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            Check status, download invoices, or write reviews for your purchases.
          </Paragraph>
        </div>
        <Button type="link" icon={<FaArrowLeft />} onClick={() => navigate('/profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Back to Account
        </Button>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        {isError || orders.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '40px 0', borderRadius: 8 }}>
            <Paragraph type="secondary" style={{ fontSize: '14px', marginBottom: 15 }}>
              You haven't placed any orders yet.
            </Paragraph>
            <Button 
              type="primary" 
              onClick={() => navigate('/shop')}
              style={{ background: '#c41e3a', borderColor: '#c41e3a' }}
            >
              Shop Collection
            </Button>
          </Card>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onViewDetails={handleViewDetails}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
