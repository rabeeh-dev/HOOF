import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Button, Typography, Space, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../api/auth';

const { Title, Paragraph } = Typography;

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { password: '', confirmPassword: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.resetPassword(token, data);
      if (res.data && res.data.success) {
        message.success('Password reset successful! Please login with your new password.');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Failed to reset password. Link may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Title level={3}>Reset Password</Title>
        <Paragraph style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Enter and confirm your new password below.</Paragraph>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item 
          label="New Password" 
          validateStatus={errors.password ? 'error' : ''} 
          help={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => <Input.Password {...field} placeholder="••••••••" />}
          />
        </Form.Item>

        <Form.Item 
          label="Confirm New Password" 
          validateStatus={errors.confirmPassword ? 'error' : ''} 
          help={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => <Input.Password {...field} placeholder="••••••••" />}
          />
        </Form.Item>

        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
          Reset Password
        </Button>
      </Form>
    </Space>
  );
};

export default ResetPassword;
