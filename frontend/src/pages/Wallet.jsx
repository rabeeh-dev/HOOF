import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Button, Alert } from 'antd';
import { FaArrowLeft } from 'react-icons/fa';
import { walletService } from '../api/wallet';
import WalletCard from '../components/WalletCard';
import WalletTransactions from '../components/WalletTransactions';

const { Title, Paragraph } = Typography;

const Wallet = () => {
  const navigate = useNavigate();

  // Query wallet balance and history
  const { data: walletData, isLoading, isError } = useQuery({
    queryKey: ['wallet-details'],
    queryFn: async () => {
      const res = await walletService.getWalletDetails();
      return res.data || { balance: 0, history: [] };
    }
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading wallet data..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 20 }}>
        <Alert message="Error loading wallet details" type="error" showIcon />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>My Wallet</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            Check your balance credits and transaction history logs.
          </Paragraph>
        </div>
        <Button type="link" icon={<FaArrowLeft />} onClick={() => navigate('/profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Back to Account
        </Button>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Wallet Balance Card */}
        <div style={{ marginBottom: 30 }}>
          <WalletCard 
            balance={walletData?.balance || 0}
          />
        </div>

        {/* Transaction History Logs */}
        <Card title="Transaction History" style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <WalletTransactions 
            transactions={walletData?.history || []}
          />
        </Card>
      </div>
    </div>
  );
};

export default Wallet;
