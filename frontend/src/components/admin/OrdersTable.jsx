import React from 'react';
import { Button, Space, Table, Tag, Typography } from 'antd';
import { FaEye, FaUndo } from 'react-icons/fa';
import PaymentBadge from './PaymentBadge';

const { Text } = Typography;

const statusColor = {
  Pending: 'gold',
  Processing: 'blue',
  SHIPPED: 'cyan',
  'Out for Delivery': 'geekblue',
  DELIVERED: 'green',
  CANCELLED: 'red',
  'Return Requested': 'orange',
  'Return Approved': 'purple',
  'Picked Up': 'purple',
  Returned: 'magenta'
};

const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const shortOrderId = (id = '') => `#${String(id).slice(-8).toUpperCase()}`;

const OrdersTable = ({
  orders = [],
  loading,
  currentPage,
  totalOrders,
  pageSize,
  onPageChange,
  onSortChange,
  onView,
  onRefund
}) => {
  const columns = [
    {
      title: 'Order',
      dataIndex: '_id',
      sorter: true,
      render: (id, record) => (
        <div>
          <Text strong>{shortOrderId(id)}</Text>
          <div><Text type="secondary">{new Date(record.createdAt).toLocaleDateString('en-IN')}</Text></div>
        </div>
      )
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => record.userId?.fullName || record.shippingAddress?.fullName || 'Guest'
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      sorter: true,
      render: formatMoney
    },
    {
      title: 'Order Status',
      dataIndex: 'status',
      sorter: true,
      render: (status) => <Tag color={statusColor[status] || 'default'}>{status}</Tag>
    },
    {
      title: 'Payment',
      key: 'payment',
      render: (_, record) => <PaymentBadge method={record.paymentMethod} status={record.paymentStatus} />
    },
    {
      title: 'Items',
      dataIndex: 'items',
      align: 'center',
      render: (items = []) => items.reduce((sum, item) => sum + (item.quantity || 0), 0)
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, record) => (
        <Space>
          <Button icon={<FaEye />} onClick={() => onView(record)} />
          <Button
            icon={<FaUndo />}
            danger
            disabled={['CANCELLED', 'Returned'].includes(record.status)}
            onClick={() => onRefund(record)}
          >
            Refund
          </Button>
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={orders.map((order) => ({ ...order, key: order._id }))}
      loading={loading}
      onChange={(_, __, sorter) => {
        if (sorter?.field) onSortChange?.(sorter.field, sorter.order);
      }}
      pagination={{
        current: currentPage,
        total: totalOrders,
        pageSize,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} orders`
      }}
      scroll={{ x: 980 }}
    />
  );
};

export default OrdersTable;
