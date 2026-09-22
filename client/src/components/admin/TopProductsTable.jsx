import React from 'react';
import { Table, Avatar, Typography } from 'antd';

const { Text } = Typography;

const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/40x40?text=HOOF';
  if (Array.isArray(image)) image = image[0];
  if (image.startsWith('http')) return image;
  const cleanPath = image.startsWith('/') ? image : `/${image}`;
  return `http://localhost:8080${cleanPath}`;
};

const TopProductsTable = ({ products = [] }) => {
  const columns = [
    {
      title: 'Product Info',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar 
            shape="square" 
            size={40} 
            src={getImageUrl(record.image)}
            onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=HOOF'; }}
          />
          <Text strong>{text || 'Unknown Product'}</Text>
        </div>
      )
    },
    {
      title: 'Qty Sold',
      dataIndex: 'totalSold',
      key: 'totalSold',
      align: 'right',
      render: (val) => <Text>{val} units</Text>
    },
    {
      title: 'Total Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (val) => <Text strong style={{ color: '#27ae60' }}>₹{val.toLocaleString('en-IN')}</Text>
    }
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={products.map((p, idx) => ({ ...p, key: p._id || idx }))} 
      pagination={false}
      locale={{ emptyText: 'No sales recorded yet.' }}
      size="middle"
    />
  );
};

export default TopProductsTable;
