import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Spin, Button, message, Alert } from 'antd';
import { FaArrowLeft } from 'react-icons/fa';
import { referralService } from '../api/referral';
import ReferralCard from '../components/ReferralCard';
import ReferralStats from '../components/ReferralStats';

const { Title, Paragraph } = Typography;

const Referral = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [withdrawing, setWithdrawing] = useState(false);

  // Query referral details
  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['referral-stats'],
    queryFn: async () => {
      const res = await referralService.getReferralStats();
      return res.data || { referralCode: '', referralPoints: 0, referredCount: 0 };
    }
  });

  // Withdraw points mutation
  const withdrawMutation = useMutation({
    mutationFn: referralService.withdrawPoints,
    onSuccess: (res) => {
      if (res.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['referral-stats'] });
        queryClient.invalidateQueries({ queryKey: ['wallet-details'] });
        message.success(res.data.message || 'Points withdrawn successfully.');
      } else {
        message.error(res.data?.message || 'Failed to withdraw points.');
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to withdraw points.');
    }
  });

  const handleWithdrawClick = () => {
    setWithdrawing(true);
    withdrawMutation.mutate(null, {
      onSettled: () => setWithdrawing(false)
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading referral data..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ padding: 20 }}>
        <Alert message="Error loading referral program details" type="error" showIcon />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Referral Program</Title>
          <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '13px' }}>
            Earn points by inviting friends to join HOOF.
          </Paragraph>
        </div>
        <Button type="link" icon={<FaArrowLeft />} onClick={() => navigate('/profile')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Back to Account
        </Button>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Referral Card Code Sharing */}
        <div style={{ marginBottom: 24 }}>
          <ReferralCard 
            referralCode={stats?.referralCode}
          />
        </div>

        {/* Referral Stats Earnings */}
        <ReferralStats
          referredCount={stats?.referredCount}
          referralPoints={stats?.referralPoints}
          pointsPerRupee={stats?.pointsPerRupee}
          minWithdrawPoints={stats?.minWithdrawPoints}
          onWithdraw={handleWithdrawClick}
          withdrawing={withdrawing}
        />
      </div>
    </div>
  );
};

export default Referral;
