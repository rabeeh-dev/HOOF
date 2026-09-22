import React from 'react';
import { Table, Button, Space, Avatar, Typography } from 'antd';
import { FaEdit, FaTrash, FaEyeSlash, FaEye } from 'react-icons/fa';
import StatusBadge from './StatusBadge';

const { Text } = Typography;

const getImageUrl = (img) => {
  if (!img) return 'https://via.placeholder.com/40x40?text=N/A';
  if (Array.isArray(img)) img = img[0];
  if (img.startsWith('http')) return img;
  return `http://localhost:8080${img.startsWith('/') ? img : '/' + img}`;
};

const ProductTable = ({ products = [], loading, currentPage, totalProducts, pageSize, onPageChange, onToggleStatus, onDelete, onEdit }) => {
  const columns = [
    {
      title: 'Image',
      dataIndex: 'productImage',
      key: 'image',
      width: 70,
      render: (imgs) => (
        <Avatar shape="square" size={45} src={getImageUrl(imgs)} onError={(e) => { e.target.src = 'https://via.placeholder.com/40x40?text=N/A'; }} />
      )
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      ellipsis: true,
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Brand',
      dataIndex: 'brand',
      key: 'brand'
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => cat?.name || 'N/A'
    },
    {
      title: 'Price',
      key: 'price',
      render: (_, record) => (
        <div>
          <Text delete type="secondary" style={{ fontSize: 12 }}>₹{record.regularPrice}</Text>
          <br />
          <Text strong style={{ color: '#c41e3a' }}>₹{record.salePrice}</Text>
        </div>
      )
    },
    {
      title: 'Stock',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'center'
    },
    {
      title: 'Status',
      dataIndex: 'isBlocked',
      key: 'status',
      align: 'center',
      render: (isBlocked) => <StatusBadge active={!isBlocked} activeText="Active" inactiveText="Blocked" />
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<FaEdit />} onClick={() => onEdit(record._id)} title="Edit" />
          <Button
            type="text"
            icon={record.isBlocked ? <FaEye /> : <FaEyeSlash />}
            onClick={() => onToggleStatus(record._id)}
            title={record.isBlocked ? 'Unblock' : 'Block'}
          />
          <Button type="text" danger icon={<FaTrash />} onClick={() => onDelete(record._id)} title="Delete" />
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={products.map(p => ({ ...p, key: p._id }))}
      loading={loading}
      pagination={{
        current: currentPage,
        total: totalProducts,
        pageSize: pageSize,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} products`
      }}
      scroll={{ x: 800 }}
      size="middle"
    />
  );
};

export default ProductTable;
