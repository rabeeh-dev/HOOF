import React from 'react';
import { Card, Descriptions, Statistic, Tag } from 'antd';

const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const CustomerProfileCard = ({ customer, wallet, orderCount = 0 }) => {
  if (!customer) return null;

  return (
    <Card>
      <Descriptions
        title={customer.fullName}
        bordered
        column={{ xs: 1, md: 2 }}
        extra={<Tag color={customer.isBlocked ? 'red' : 'green'}>{customer.isBlocked ? 'Blocked' : 'Active'}</Tag>}
      >
        <Descriptions.Item label="Email">{customer.email}</Descriptions.Item>
        <Descriptions.Item label="Phone">{customer.phone || '-'}</Descriptions.Item>
        <Descriptions.Item label="Provider">{customer.authProvider}</Descriptions.Item>
        <Descriptions.Item label="Joined">
          {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Referral Code">{customer.referralCode || '-'}</Descriptions.Item>
        <Descriptions.Item label="Email Verified">{customer.isEmailVerified ? 'Yes' : 'No'}</Descriptions.Item>
        <Descriptions.Item label="Orders"><Statistic value={orderCount} /></Descriptions.Item>
        <Descriptions.Item label="Wallet"><Statistic value={formatMoney(wallet?.balance || 0)} /></Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default CustomerProfileCard;
