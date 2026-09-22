import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Result, Typography, Row, Col, Divider, Spin } from 'antd';
import { FaCheckCircle, FaShoppingBag, FaHome } from 'react-icons/fa';
import { orderService } from '../api/order';

const { Title, Text, Paragraph } = Typography;

const OrderSuccess = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Query single order details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-details', id],
    queryFn: async () => {
      const res = await orderService.getOrderDetails(id);
      return res.data || { order: null, user: null };
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <Spin size="large" tip="Confirming order details..." />
      </div>
    );
  }

  if (isError || !data?.order) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center', borderRadius: 8 }}>
          <Result
            status="error"
            title="Order Fetch Failed"
            subTitle="We couldn't retrieve confirmation for this order ID."
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/')} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
                Go Home
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  const { order, user } = data;
  const deliveryDateStr = order.estimatedDelivery ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '5 days from purchase';

  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: '#f5f7fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Card style={{ maxWidth: 800, width: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Result
          icon={<FaCheckCircle style={{ fontSize: '72px', color: '#52c41a' }} />}
          status="success"
          title={<span style={{ fontWeight: 800, fontSize: '26px' }}>Thank you, {user?.name}!</span>}
          subTitle={`Your order #${order._id} has been placed successfully.`}
          extra={[
            <Button 
              type="primary" 
              key="orders" 
              onClick={() => navigate('/orders')} 
              icon={<FaShoppingBag />} 
              style={{ background: '#c41e3a', borderColor: '#c41e3a', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              My Orders
            </Button>,
            <Button 
              key="shop" 
              onClick={() => navigate('/')} 
              icon={<FaHome />} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Return Home
            </Button>
          ]}
        />

        <Divider />

        <Row gutter={[24, 24]}>
          <Col xs={24} md={12}>
            <Title level={4} style={{ marginBottom: 15 }}>Order Details</Title>
            <Paragraph style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
              <strong>Estimated Delivery:</strong><br />
              <Text type="success" strong>{deliveryDateStr}</Text>
            </Paragraph>
            <Paragraph style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
              <strong>Payment Status:</strong> <TagColor status={order.paymentStatus}>{order.paymentStatus}</TagColor>
            </Paragraph>
            <Paragraph style={{ margin: 0, fontSize: '13px' }}>
              <strong>Payment Method:</strong> {order.paymentMethod?.toUpperCase()}
            </Paragraph>
          </Col>
          
          <Col xs={24} md={12}>
            <Title level={4} style={{ marginBottom: 15 }}>Shipping Address</Title>
            {order.shippingAddress ? (
              <Paragraph style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                <strong>{order.shippingAddress.fullName}</strong><br />
                {order.shippingAddress.houseName},<br />
                {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                Phone: {order.shippingAddress.mobile}
              </Paragraph>
            ) : (
              <Text type="secondary">Address details unavailable</Text>
            )}
          </Col>
        </Row>

        <Divider />

        <Title level={4} style={{ marginBottom: 15 }}>Billing Summary</Title>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '13px' }}>
          <Text type="secondary">Subtotal</Text>
          <Text>₹{(order.totalAmount + order.discountAmount).toLocaleString('en-IN')}</Text>
        </div>
        {order.discountAmount > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '13px' }}>
            <Text type="secondary">Discount Applied</Text>
            <Text style={{ color: '#52c41a' }}>- ₹{order.discountAmount.toLocaleString('en-IN')}</Text>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: 12 }}>
          <Text>Total Amount</Text>
          <Text style={{ color: '#c41e3a' }}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
        </div>
      </Card>
    </div>
  );
};

const TagColor = ({ status, children }) => {
  let color = 'blue';
  if (status === 'SUCCESS' || status === 'PAID') color = 'green';
  if (status === 'FAILED' || status === 'PENDING') color = 'orange';
  return <span style={{ background: color === 'green' ? '#f6ffed' : '#fff7e6', border: `1px solid ${color === 'green' ? '#b7eb8f' : '#ffd591'}`, color: color === 'green' ? '#389e0d' : '#d46b08', padding: '2px 8px', borderRadius: 4, fontSize: '12px', fontWeight: 'bold' }}>{children}</span>;
};

export default OrderSuccess;
