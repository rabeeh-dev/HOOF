import React from 'react';
import { Tag } from 'antd';

const StatusBadge = ({ active = true, activeText = 'Active', inactiveText = 'Inactive' }) => {
  return (
    <Tag color={active ? 'green' : 'red'} style={{ fontWeight: 'bold' }}>
      {active ? activeText : inactiveText}
    </Tag>
  );
};

export default StatusBadge;
