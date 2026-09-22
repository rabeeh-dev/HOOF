import React from 'react';
import { Tag } from 'antd';

const getCouponStatus = (coupon) => {
  if (coupon?.isBlocked || !coupon?.isActive) return { label: 'Disabled', color: 'red' };
  if (coupon?.expiryDate && new Date(coupon.expiryDate) <= new Date()) return { label: 'Expired', color: 'default' };
  if ((coupon?.usedCount || 0) >= (coupon?.usageLimit || 0)) return { label: 'Exhausted', color: 'orange' };
  return { label: 'Active', color: 'green' };
};

const CouponStatusBadge = ({ coupon }) => {
  const status = getCouponStatus(coupon);
  return <Tag color={status.color}>{status.label}</Tag>;
};

export default CouponStatusBadge;
