import React, { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Card, Form, InputNumber, Space, Switch, Typography } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

const { Text } = Typography;

const referralSchema = z.object({
  pointsPerReferral: z.coerce.number().min(0, 'Referrer reward cannot be negative'),
  pointsPerRupee: z.coerce.number().min(1, 'Points per rupee must be at least 1'),
  minWithdrawPoints: z.coerce.number().min(1, 'Minimum withdrawal must be at least 1'),
  isActive: z.boolean()
});

const ReferralSettingsForm = ({ config, loading, onSubmit }) => {
  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      pointsPerReferral: 10,
      pointsPerRupee: 100,
      minWithdrawPoints: 100,
      isActive: true
    }
  });

  const pointsPerReferral = watch('pointsPerReferral');
  const pointsPerRupee = watch('pointsPerRupee');

  useEffect(() => {
    if (!config) return;
    reset({
      pointsPerReferral: config.pointsPerReferral ?? 10,
      pointsPerRupee: config.pointsPerRupee ?? 100,
      minWithdrawPoints: config.minWithdrawPoints ?? 100,
      isActive: Boolean(config.isActive)
    });
  }, [config, reset]);

  return (
    <Card>
      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Space size={16} align="start" wrap>
          <Controller
            name="pointsPerReferral"
            control={control}
            render={({ field }) => (
              <Form.Item label="Referrer Reward Points" validateStatus={errors.pointsPerReferral ? 'error' : ''} help={errors.pointsPerReferral?.message}>
                <InputNumber {...field} min={0} precision={0} style={{ width: 240 }} />
              </Form.Item>
            )}
          />
          <Controller
            name="pointsPerRupee"
            control={control}
            render={({ field }) => (
              <Form.Item label="Points Per Rupee" validateStatus={errors.pointsPerRupee ? 'error' : ''} help={errors.pointsPerRupee?.message}>
                <InputNumber {...field} min={1} precision={0} style={{ width: 240 }} />
              </Form.Item>
            )}
          />
          <Controller
            name="minWithdrawPoints"
            control={control}
            render={({ field }) => (
              <Form.Item label="Minimum Withdrawal Points" validateStatus={errors.minWithdrawPoints ? 'error' : ''} help={errors.minWithdrawPoints?.message}>
                <InputNumber {...field} min={1} precision={0} style={{ width: 240 }} />
              </Form.Item>
            )}
          />
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <Form.Item label="Referral System" valuePropName="checked">
                <Switch checked={field.value} onChange={field.onChange} checkedChildren="Enabled" unCheckedChildren="Disabled" />
              </Form.Item>
            )}
          />
        </Space>
        <div style={{ marginBottom: 16 }}>
          <Text type="secondary">
            Current reward value: ₹{Number((pointsPerReferral || 0) / (pointsPerRupee || 1)).toFixed(2)}
          </Text>
        </div>
        <Button type="primary" htmlType="submit" loading={loading}>Save Settings</Button>
      </Form>
    </Card>
  );
};

export default ReferralSettingsForm;
