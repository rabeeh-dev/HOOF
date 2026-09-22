import React from 'react';
import { Table, Typography } from 'antd';

const { Text } = Typography;

const TopCategoriesTable = ({ categories = [] }) => {
  const columns = [
    {
      title: 'Category Name',
      dataIndex: '_id',
      key: 'name',
      render: (text) => <Text strong>{text || 'Uncategorized'}</Text>
    },
    {
      title: 'Items Sold',
      dataIndex: 'totalSold',
      key: 'totalSold',
      align: 'right',
      render: (val) => <Text>{val} items</Text>
    },
    {
      title: 'Revenue Generated',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      align: 'right',
      render: (val) => <Text strong style={{ color: '#27ae60' }}>₹{val.toLocaleString('en-IN')}</Text>
    }
  ];

  return (
    <Table 
      columns={columns} 
      dataSource={categories.map((c, idx) => ({ ...c, key: c._id || idx }))} 
      pagination={false}
      locale={{ emptyText: 'No category sales recorded.' }}
      size="middle"
    />
  );
};

export default TopCategoriesTable;
