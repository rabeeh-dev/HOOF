import React from 'react';
import { Select } from 'antd';

const ORDER_STATUSES = [
  'Pending',
  'Processing',
  'SHIPPED',
  'Out for Delivery',
  'DELIVERED',
  'CANCELLED',
  'Return Requested',
  'Return Approved',
  'Picked Up',
  'Returned'
];

const PAYMENT_STATUSES = [
  'Pending',
  'SUCCESS',
  'Paid',
  'Failed',
  'Refunded',
  'Partially Refunded'
];

const ITEM_STATUSES = [
  'Active',
  'Return Approved',
  'Picked Up',
  'Returned'
];

const StatusSelector = ({
  value,
  onChange,
  type = 'order',
  disabled = false,
  loading = false,
  style
}) => {
  const statusList = type === 'payment' ? PAYMENT_STATUSES : type === 'item' ? ITEM_STATUSES : ORDER_STATUSES;
  const options = statusList.map((status) => ({
    value: status,
    label: status
  }));

  return (
    <Select
      value={value}
      options={options}
      onChange={onChange}
      disabled={disabled}
      loading={loading}
      style={{ minWidth: 170, ...style }}
    />
  );
};

export default StatusSelector;
