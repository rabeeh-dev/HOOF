import React from 'react';
import { Button, Space, Table, Tag, Typography } from 'antd';
import { FaEdit, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import CouponStatusBadge from './CouponStatusBadge';

const { Text } = Typography;

const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const formatDiscount = (coupon) => {
  if (coupon.discountType === 'percentage') {
    return `${coupon.discountValue}%${coupon.maxDiscountAmount ? ` up to ${formatMoney(coupon.maxDiscountAmount)}` : ''}`;
  }
  return formatMoney(coupon.discountValue);
};

const CouponTable = ({
  coupons = [],
  loading,
  currentPage,
  totalCoupons,
  pageSize,
  onPageChange,
  onSortChange,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const columns = [
    {
      title: 'Coupon',
      dataIndex: 'couponCode',
      sorter: true,
      render: (code, coupon) => (
        <div>
          <Text strong>{code}</Text>
          <div><Text type="secondary">{coupon.description}</Text></div>
        </div>
      )
    },
    {
      title: 'Discount',
      key: 'discount',
      render: (_, coupon) => <Tag color={coupon.discountType === 'percentage' ? 'blue' : 'purple'}>{formatDiscount(coupon)}</Tag>
    },
    {
      title: 'Minimum Spend',
      dataIndex: 'minPurchaseAmount',
      sorter: true,
      render: formatMoney
    },
    {
      title: 'Usage',
      key: 'usage',
      render: (_, coupon) => `${coupon.usedCount || 0}/${coupon.usageLimit || 0}`
    },
    {
      title: 'Expiry',
      dataIndex: 'expiryDate',
      sorter: true,
      render: (date) => date ? new Date(date).toLocaleDateString('en-IN') : '-'
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, coupon) => <CouponStatusBadge coupon={coupon} />
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (_, coupon) => (
        <Space>
          <Button icon={<FaEdit />} onClick={() => onEdit(coupon._id)} />
          <Button
            icon={coupon.isBlocked ? <FaEye /> : <FaEyeSlash />}
            onClick={() => onToggleStatus(coupon)}
          />
          <Button danger icon={<FaTrash />} onClick={() => onDelete(coupon)} />
        </Space>
      )
    }
  ];

  return (
    <Table
      columns={columns}
      dataSource={coupons.map((coupon) => ({ ...coupon, key: coupon._id }))}
      loading={loading}
      onChange={(_, __, sorter) => {
        if (sorter?.field) onSortChange?.(sorter.field, sorter.order);
      }}
      pagination={{
        current: currentPage,
        total: totalCoupons,
        pageSize,
        onChange: onPageChange,
        showSizeChanger: false,
        showTotal: (total) => `Total ${total} coupons`
      }}
      scroll={{ x: 980 }}
    />
  );
};

export default CouponTable;
