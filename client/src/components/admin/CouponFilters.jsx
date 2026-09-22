import React from 'react';
import { Input, Select, Space } from 'antd';

const CouponFilters = ({ search, status, discountType, onSearchChange, onStatusChange, onDiscountTypeChange }) => (
  <Space wrap style={{ marginBottom: 16 }}>
    <Input.Search
      allowClear
      value={search}
      onChange={(event) => onSearchChange(event.target.value)}
      placeholder="Search coupon code or description"
      style={{ width: 320 }}
    />
    <Select
      allowClear
      value={status}
      onChange={onStatusChange}
      placeholder="Status"
      options={[
        { value: 'active', label: 'Active' },
        { value: 'disabled', label: 'Disabled' },
        { value: 'expired', label: 'Expired' }
      ]}
      style={{ width: 160 }}
    />
    <Select
      allowClear
      value={discountType}
      onChange={onDiscountTypeChange}
      placeholder="Discount type"
      options={[
        { value: 'percentage', label: 'Percentage' },
        { value: 'fixed', label: 'Fixed amount' }
      ]}
      style={{ width: 180 }}
    />
  </Space>
);

export default CouponFilters;
