import React from 'react';
import { Tag } from 'antd';

const colorByStatus = {
  SUCCESS: 'green',
  Paid: 'green',
  Pending: 'gold',
  Failed: 'red',
  Refunded: 'blue',
  'Partially Refunded': 'purple'
};

const PaymentBadge = ({ status = 'Pending', method }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
    {method && <Tag>{method}</Tag>}
    <Tag color={colorByStatus[status] || 'default'}>{status}</Tag>
  </span>
);

export default PaymentBadge;
