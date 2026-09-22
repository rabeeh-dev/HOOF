import React from 'react';
import { Card, Typography, Space } from 'antd';
import { FaWallet, FaInfoCircle } from 'react-icons/fa';

const { Text, Paragraph } = Typography;

const WalletSection = ({ walletBalance = 0, totalAmount = 0 }) => {
  const canUseWallet = walletBalance >= totalAmount;

  return (
    <Card style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)', marginBottom: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{ background: '#fff7e6', padding: '12px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FaWallet style={{ fontSize: '24px', color: '#fa8c16' }} />
        </div>
        <div>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Your digital wallet
          </Text>
          <Text strong style={{ fontSize: '18px' }}>
            Balance: ₹{walletBalance.toLocaleString('en-IN')}
          </Text>
        </div>
      </div>
      
      {canUseWallet ? (
        <div style={{ marginTop: 15, display: 'flex', gap: 8, alignItems: 'flex-start', background: '#f6ffed', padding: '10px 12px', borderRadius: 6, border: '1px solid #b7eb8f' }}>
          <FaInfoCircle style={{ color: '#52c41a', marginTop: 3, flexShrink: 0 }} />
          <Paragraph style={{ margin: 0, fontSize: '12px', color: '#389e0d' }}>
            You have sufficient balance to pay for this order entirely using your HOOF wallet. You can select "HOOF Wallet" as the payment method in the next step.
          </Paragraph>
        </div>
      ) : (
        <div style={{ marginTop: 15, display: 'flex', gap: 8, alignItems: 'flex-start', background: '#fff2f0', padding: '10px 12px', borderRadius: 6, border: '1px solid #ffccc7' }}>
          <FaInfoCircle style={{ color: '#ff4d4f', marginTop: 3, flexShrink: 0 }} />
          <Paragraph style={{ margin: 0, fontSize: '12px', color: '#cf1322' }}>
            Insufficient wallet balance to cover the order total (₹{totalAmount.toLocaleString('en-IN')}). Pay via Online UPI/Razorpay or COD instead.
          </Paragraph>
        </div>
      )}
    </Card>
  );
};

export default WalletSection;
