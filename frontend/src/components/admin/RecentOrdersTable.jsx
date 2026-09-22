import React from 'react';
import { Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

const RecentOrdersTable = ({ orders = [] }) => {
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

  const columns = [
    {
      title: 'Order ID',
      dataIndex: '_id',
      key: 'id',
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'Customer',
      dataIndex: 'userId',
      key: 'customer',
      render: (user) => (
        <div>
          <Text style={{ display: 'block' }}>{user?.fullName || 'Guest'}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{user?.email || ''}</Text>
        </div>
      )
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (val) => dayjs(val).format('DD MMM YYYY, h:mm A')
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'total',
      align: 'right',
      render: (val) => <Text strong>₹{val.toLocaleString('en-IN')}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (status) => (
        <Tag color={getStatusColor(status)} style={{ fontWeight: 'bold' }}>
          {status}
        </Tag>
      )
    }
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={orders.map((o, idx) => ({ ...o, key: o._id || idx }))} 
      pagination={false}
      locale={{ emptyText: 'No recent orders.' }}
      size="middle"
    />
  );
};

export default RecentOrdersTable;
