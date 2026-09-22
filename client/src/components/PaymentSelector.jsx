import React from 'react';
import { Card, Radio, Space, Typography, Alert } from 'antd';
import { FaMoneyBillWave, FaCreditCard, FaWallet } from 'react-icons/fa';

const { Text, Paragraph } = Typography;

const PaymentSelector = ({ 
  value = 'COD', 
  onChange, 
  walletBalance = 0, 
  totalAmount = 0 
}) => {
  const isWalletInsufficient = walletBalance < totalAmount;

  return (
    <div>
      <Paragraph type="secondary" style={{ marginBottom: 20 }}>
        Please select your preferred payment mode below.
      </Paragraph>

      <Radio.Group 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Cash On Delivery */}
          <Card 
            hoverable 
            bodyStyle={{ padding: '16px 20px' }}
            onClick={() => onChange('COD')}
            style={{ 
              borderColor: value === 'COD' ? '#c41e3a' : '#d9d9d9',
              background: value === 'COD' ? '#fff0f1' : '#fff',
              borderRadius: 8
            }}
          >
            <Radio value="COD" style={{ width: '100%' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                <FaMoneyBillWave style={{ fontSize: '18px', color: '#52c41a' }} />
                <div>
                  <Text strong style={{ display: 'block' }}>Cash on Delivery (COD)</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Pay in cash upon delivery of your order.</Text>
                </div>
              </div>
            </Radio>
          </Card>

          {/* UPI/Online via Razorpay */}
          <Card 
            hoverable 
            bodyStyle={{ padding: '16px 20px' }}
            onClick={() => onChange('upi')}
            style={{ 
              borderColor: value === 'upi' ? '#c41e3a' : '#d9d9d9',
              background: value === 'upi' ? '#fff0f1' : '#fff',
              borderRadius: 8
            }}
          >
            <Radio value="upi" style={{ width: '100%' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                <FaCreditCard style={{ fontSize: '18px', color: '#1890ff' }} />
                <div>
                  <Text strong style={{ display: 'block' }}>Online Payment (UPI/Card/NetBanking)</Text>
                  <Text type="secondary" style={{ fontSize: '12px' }}>Secure checkout via Razorpay payments gateway.</Text>
                </div>
              </div>
            </Radio>
          </Card>

          {/* Wallet Balance */}
          <Card 
            hoverable={!isWalletInsufficient}
            bodyStyle={{ padding: '16px 20px' }}
            onClick={() => { if (!isWalletInsufficient) onChange('wallet'); }}
            style={{ 
              borderColor: value === 'wallet' ? '#c41e3a' : '#d9d9d9',
              background: value === 'wallet' ? '#fff0f1' : '#fff',
              opacity: isWalletInsufficient ? 0.6 : 1,
              borderRadius: 8,
              cursor: isWalletInsufficient ? 'not-allowed' : 'pointer'
            }}
          >
            <Radio value="wallet" disabled={isWalletInsufficient} style={{ width: '100%' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                <FaWallet style={{ fontSize: '18px', color: '#fa8c16' }} />
                <div style={{ flex: 1 }}>
                  <Text strong style={{ display: 'block' }}>
                    HOOF Wallet Balance (₹{walletBalance.toLocaleString('en-IN')})
                  </Text>
                  {isWalletInsufficient ? (
                    <Text type="danger" style={{ fontSize: '12px', display: 'block', marginTop: 4 }}>
                      Insufficient wallet funds (Order total: ₹{totalAmount.toLocaleString('en-IN')}).
                    </Text>
                  ) : (
                    <Text type="secondary" style={{ fontSize: '12px' }}>Deduct payment straight from your digital wallet.</Text>
                  )}
                </div>
              </div>
            </Radio>
          </Card>
        </Space>
      </Radio.Group>
    </div>
  );
};

export default PaymentSelector;
