import React from 'react';
import { Typography, Table, Button } from 'antd';

const { Title } = Typography;

const Wishlist = () => {
  const columns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'Price', dataIndex: 'price', key: 'price' },
    { title: 'Action', key: 'action', render: () => <Button type="primary" style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>Add to Cart</Button> }
  ];

  const mockWishlist = [
    { key: '1', name: 'HOOF Urban Stealth', price: '₹3,499' }
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>My Wishlist</Title>
      <Table columns={columns} dataSource={mockWishlist} pagination={false} />
    </div>
  );
};

export default Wishlist;
