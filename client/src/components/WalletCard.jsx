import React from 'react';
import { Card, Typography, Button } from 'antd';
import { FaWallet, FaArrowRight } from 'react-icons/fa';

const { Text, Title } = Typography;

const WalletCard = ({ balance = 0, onViewTransactions }) => {
  return (
    <Card 
      style={{ 
        background: 'linear-gradient(135deg, #ff9900 0%, #ff5500 100%)', 
        borderRadius: 12, 
        color: '#fff',
        boxShadow: '0 4px 12px rgba(255, 120, 0, 0.2)'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Wallet Balance
          </Text>
          <Title level={2} style={{ color: '#fff', margin: '4px 0 0 0', fontSize: '28px' }}>
            ₹{balance.toLocaleString('en-IN')}
          </Title>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.2)', padding: '12px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FaWallet style={{ fontSize: '24px' }} />
        </div>
      </div>
      
      {onViewTransactions && (
        <div style={{ marginTop: 20 }}>
          <Button 
            type="text" 
            onClick={onViewTransactions} 
            style={{ color: '#fff', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 'bold' }}
            icon={<FaArrowRight />}
          >
            Transaction Details
          </Button>
        </div>
      )}
    </Card>
  );
};

export default WalletCard;
