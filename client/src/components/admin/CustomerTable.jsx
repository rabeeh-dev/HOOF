import React from 'react';
import { Button, Space, Table, Tag, Typography } from 'antd';
import { FaBan, FaEye, FaUnlock } from 'react-icons/fa';

const { Text } = Typography;

const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const CustomerTable = ({
  customers = [],
  loading,
  currentPage,
  totalCustomers,
  pageSize,
  onPageChange,
  onSortChange,
  onView,
  onToggleStatus
}) => {
  const columns = [
    {
      title: 'Customer',
      dataIndex: 'fullName',
      sorter: true,
      render: (name, record) => (
        <div>
          <Text strong>{name}</Text>
          <div><Text type="secondary">{record.email}</Text></div>
        </div>
      )
    },
    { title: 'Phone', dataIndex: 'phone', render: (phone) => phone || '-' },
    { title: 'Orders', dataIndex: 'totalOrders', align: 'center', sorter: true },
    { title: 'Spend', dataIndex: 'totalSpend', sorter: true, render: formatMoney },
    { title: 'Wallet', dataIndex: 'walletBalance', render: formatMoney },
    {
      title: 'Status',
      dataIndex: 'isBlocked',
      render: (isBlocked) => <Tag color={isBlocked ? 'red' : 'green'}>{isBlocked ? 'Blocked' : 'Active'}</Tag>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button icon={<FaEye />} onClick={() => onView(record)} />
          <Button
            danger={!record.isBlocked}
            icon={record.isBlocked ? <FaUnlock /> : <FaBan />}
            onClick={() => onToggleStatus(record)}
          >
            {record.isBlocked ? 'Unblock' : 'Block'}
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={customers.map((customer) => ({ ...customer, key: customer._id }))}
      loading={loading}
      onChange={(_, __, sorter) => {
        if (sorter?.field) onSortChange?.(sorter.field, sorter.order);
      }}
      pagination={{
        current: currentPage,
        total: totalCustomers,
        pageSize,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} customers`
      }}
      scroll={{ x: 900 }}
    />
  );
};

export default CustomerTable;
