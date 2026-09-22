import React from 'react';
import { Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

const WalletTransactions = ({ transactions = [] }) => {
  const columns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (val) => dayjs(val).format('DD MMM YYYY, h:mm A'),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (val) => (
        <Tag color={val === 'CREDIT' ? 'green' : 'red'} style={{ fontWeight: 'bold' }}>
          {val}
        </Tag>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (val, record) => (
        <Text strong style={{ color: record.type === 'CREDIT' ? '#52c41a' : '#ff4d4f' }}>
          {record.type === 'CREDIT' ? '+' : '-'} ₹{val.toLocaleString('en-IN')}
        </Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    }
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={transactions.map((t, idx) => ({ ...t, key: t._id || idx }))} 
      pagination={{ pageSize: 5 }} 
      locale={{ emptyText: 'No transactions recorded yet.' }}
    />
  );
};

export default WalletTransactions;
