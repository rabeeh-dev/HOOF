import React from 'react';
import { Card, Statistic, Row, Col, Button, Typography, Space, message } from 'antd';
import { FaUsers, FaCoins, FaArrowAltCircleUp } from 'react-icons/fa';

const { Text, Paragraph } = Typography;

const ReferralStats = ({ 
  referredCount = 0, 
  referralPoints = 0, 
  pointsPerRupee = 100, 
  minWithdrawPoints = 100,
  onWithdraw,
  withdrawing = false
}) => {
  const valueInRupees = referralPoints / pointsPerRupee;
  const canWithdraw = referralPoints >= minWithdrawPoints;

  return (
    <Card title="Referral Earnings & Statistics" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12}>
          <Card style={{ background: '#f9f9f9', border: 'none', textAlign: 'center' }} bodyStyle={{ padding: '15px' }}>
            <Statistic 
              title="Friends Referred" 
              value={referredCount} 
              prefix={<FaUsers style={{ color: '#c41e3a', marginRight: 6 }} />} 
            />
          </Card>
        </Col>
        <Col xs={12}>
          <Card style={{ background: '#f9f9f9', border: 'none', textAlign: 'center' }} bodyStyle={{ padding: '15px' }}>
            <Statistic 
              title="Earned Points" 
              value={referralPoints} 
              prefix={<FaCoins style={{ color: '#fa8c16', marginRight: 6 }} />} 
            />
          </Card>
        </Col>
      </Row>

      <div style={{ background: '#fffbe6', padding: '12px 16px', borderRadius: 8, border: '1px solid #ffe58f', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <Text strong style={{ fontSize: '13px', color: '#d46b08' }}>Point Conversion Details</Text>
          <Paragraph style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#d46b08', lineHeight: 1.4 }}>
            * {pointsPerRupee} Points = ₹1.00 Wallet cash.<br />
            * Minimum points required to withdraw: {minWithdrawPoints} Points.<br />
            * Your withdrawable value: <strong>₹{valueInRupees.toFixed(2)}</strong>
          </Paragraph>
        </div>

        <Button 
          type="primary" 
          disabled={!canWithdraw} 
          loading={withdrawing}
          onClick={onWithdraw}
          icon={<FaArrowAltCircleUp />}
          style={{ 
            background: canWithdraw ? '#c41e3a' : undefined, 
            borderColor: canWithdraw ? '#c41e3a' : undefined,
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6
          }}
        >
          Withdraw to Wallet
        </Button>
      </div>
    </Card>
  );
};

export default ReferralStats;
