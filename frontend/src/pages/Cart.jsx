import React from 'react';
import { Typography, Table, Button, Card, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Cart = () => {
  const navigate = useNavigate();

  const columns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'Size', dataIndex: 'size', key: 'size' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    { title: 'Qty', dataIndex: 'qty', key: 'qty' },
    { title: 'Total', dataIndex: 'total', key: 'total' },
  ];

  const mockCartItems = [
    { key: '1', name: 'HOOF Pro Trailrunner', size: 'UK 9', price: '₹4,999', qty: 1, total: '₹4,999' }
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Your Cart</Title>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Table columns={columns} dataSource={mockCartItems} pagination={false} />
        </Col>
        
        <Col xs={24} lg={8}>
          <Card title="Order Summary">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>Subtotal:</span>
              <span>₹4,999</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span>Shipping:</span>
              <span>Free</span>
            </div>
            <hr style={{ border: '0.5px solid #f0f0f0', margin: '15px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, fontWeight: 'bold', fontSize: '16px' }}>
              <span>Total amount:</span>
              <span style={{ color: '#c41e3a' }}>₹4,999</span>
            </div>
            <Button type="primary" size="large" block onClick={() => navigate('/checkout')} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
              Proceed to Checkout
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Cart;
