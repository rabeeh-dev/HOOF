import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Typography, Spin, Button, Space } from 'antd';
import { FaUser, FaWallet, FaShareAlt, FaMapMarkerAlt, FaHistory } from 'react-icons/fa';
import { profileService } from '../api/profile';
import { walletService } from '../api/wallet';
import { referralService } from '../api/referral';
import ProfileCard from '../components/ProfileCard';
import WalletCard from '../components/WalletCard';
import ReferralCard from '../components/ReferralCard';

const { Title, Text } = Typography;

const Profile = () => {
  const navigate = useNavigate();

  // Query profile details
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await profileService.getProfile();
      return res.data?.user || {};
    }
  });

  // Query wallet details
  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet-details'],
    queryFn: async () => {
      const res = await walletService.getWalletDetails();
      return res.data || { balance: 0, history: [] };
    }
  });

  // Query referral details
  const { data: referralData, isLoading: referralLoading } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const res = await referralService.getReferralStats();
      return res.data || { referralCode: '', referralPoints: 0, referredCount: 0 };
    }
  });

  const loading = profileLoading || walletLoading || referralLoading;

  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading account information..." />
      </div>
    );
  }

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>My Account</Title>

      <Row gutter={[24, 24]}>
        {/* Left Column: Profile Card */}
        <Col xs={24} md={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <ProfileCard 
              user={profileData} 
              onEdit={() => navigate('/profile/edit')} 
            />

            {/* Navigation links block */}
            <Card title="Quick Options" style={{ borderRadius: 12 }}>
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button 
                  icon={<FaMapMarkerAlt />} 
                  onClick={() => navigate('/profile/addresses')} 
                  block
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40 }}
                >
                  Manage Address Book
                </Button>
                <Button 
                  icon={<FaWallet />} 
                  onClick={() => navigate('/profile/wallet')} 
                  block
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40 }}
                >
                  Wallet & Credits
                </Button>
                <Button 
                  icon={<FaShareAlt />} 
                  onClick={() => navigate('/profile/referrals')} 
                  block
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40 }}
                >
                  Referral Program
                </Button>
                <Button 
                  icon={<FaHistory />} 
                  onClick={() => navigate('/orders')} 
                  block
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40 }}
                >
                  Order History
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>

        {/* Right Column: Earnings Summary */}
        <Col xs={24} md={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <WalletCard 
              balance={walletData?.balance || 0}
              onViewTransactions={() => navigate('/profile/wallet')}
            />

            <ReferralCard 
              referralCode={referralData?.referralCode}
            />

            <Card style={{ borderRadius: 12 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <Text type="secondary" style={{ display: 'block', fontSize: '13px' }}>
                  Total referred friends
                </Text>
                <Title level={1} style={{ color: '#c41e3a', margin: '8px 0 0 0', fontSize: '36px' }}>
                  {referralData?.referredCount || 0}
                </Title>
              </div>
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
