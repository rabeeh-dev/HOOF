import React from 'react';
import { Table, Button, Space, Typography } from 'antd';
import { FaEdit, FaTrash, FaEyeSlash, FaEye } from 'react-icons/fa';
import StatusBadge from './StatusBadge';

const { Text } = Typography;

const CategoryTable = ({ categories = [], loading, currentPage, totalCategories, pageSize, onPageChange, onToggleStatus, onDelete, onEdit }) => {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'Offer %',
      dataIndex: 'categoryOffer',
      key: 'categoryOffer',
      align: 'center',
      render: (val) => val ? `${val}%` : '—'
    },
    {
      title: 'Listed',
      dataIndex: 'isListed',
      key: 'isListed',
      align: 'center',
      render: (isListed) => <StatusBadge active={isListed} activeText="Listed" inactiveText="Unlisted" />
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Button type="text" icon={<FaEdit />} onClick={() => onEdit(record)} title="Edit" />
          <Button
            type="text"
            icon={record.isListed ? <FaEyeSlash /> : <FaEye />}
            onClick={() => onToggleStatus(record._id)}
            title={record.isListed ? 'Unlist' : 'List'}
          />
          <Button type="text" danger icon={<FaTrash />} onClick={() => onDelete(record._id)} title="Delete" />
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={categories.map(c => ({ ...c, key: c._id }))}
      loading={loading}
      pagination={{
        current: currentPage,
        total: totalCategories,
        pageSize: pageSize,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} categories`
      }}
      scroll={{ x: 600 }}
      size="middle"
    />
  );
};

export default CategoryTable;
