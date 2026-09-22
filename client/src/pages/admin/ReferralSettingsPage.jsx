import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Col, List, message, Row, Statistic, Typography } from 'antd';
import { adminService } from '../../api/admin';
import ReferralSettingsForm from '../../components/admin/ReferralSettingsForm';

const { Title, Text } = Typography;

const ReferralSettingsPage = () => {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-referral-settings'],
    queryFn: async () => {
      const res = await adminService.getReferralSettings();
      return res.data;
    }
  });

  const updateMutation = useMutation({
    mutationFn: adminService.updateReferralSettings,
    onSuccess: (res) => {
      message.success(res.data?.message || 'Referral settings updated');
      queryClient.invalidateQueries({ queryKey: ['admin-referral-settings'] });
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update referral settings')
  });

  const stats = data?.stats || {};

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Referral Configuration</Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Card loading={isLoading}><Statistic title="Total Referrals" value={stats.totalReferrals || 0} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={isLoading}><Statistic title="Points Outstanding" value={stats.totalPointsDistributed || 0} /></Card>
        </Col>
        <Col xs={24} md={8}>
          <Card loading={isLoading}><Statistic title="System Status" value={data?.config?.isActive ? 'Enabled' : 'Disabled'} /></Card>
        </Col>
      </Row>

      <ReferralSettingsForm
        config={data?.config}
        loading={updateMutation.isPending}
        onSubmit={(values) => updateMutation.mutate(values)}
      />

      <Title level={4} style={{ marginTop: 24 }}>Top Referrers</Title>
      <List
        bordered
        loading={isLoading}
        dataSource={stats.topReferrers || []}
        locale={{ emptyText: 'No referral activity yet' }}
        renderItem={(user) => (
          <List.Item>
            <List.Item.Meta
              title={user.fullName}
              description={`${user.email} · ${user.referralCode || 'No code'}`}
            />
            <Text>{user.referralCount} referrals · {user.referralPoints || 0} pts</Text>
          </List.Item>
        )}
      />
    </div>
  );
};

export default ReferralSettingsPage;
