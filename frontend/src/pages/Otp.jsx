import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Button, Typography, Space, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;

const schema = z.object({
  otp: z.string().length(6, 'OTP must be exactly 6 digits').regex(/^\d+$/, 'OTP must contain only numbers'),
});

const Otp = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { otp: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.verifyOtp(data.otp);
      if (res.data && res.data.success) {
        message.success('Verification successful!');
        if (res.data.user) {
          login(res.data.user);
        }
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      const res = await authService.resendOtp();
      if (res.data && res.data.success) {
        message.success('New OTP sent to email!');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Title level={3}>OTP Verification</Title>
        <Paragraph style={{ color: 'rgba(0, 0, 0, 0.45)' }}>We've sent a 6-digit verification code to your email.</Paragraph>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item 
          label="Enter 6-Digit OTP" 
          validateStatus={errors.otp ? 'error' : ''} 
          help={errors.otp?.message}
        >
          <Controller
            name="otp"
            control={control}
            render={({ field }) => <Input {...field} maxLength={6} style={{ textAlign: 'center', letterSpacing: 8, fontSize: '20px' }} placeholder="000000" />}
          />
        </Form.Item>

        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Button type="link" size="small" onClick={handleResend} loading={resending}>
            Resend OTP Code
          </Button>
        </div>

        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
          Verify & Continue
        </Button>
      </Form>
    </Space>
  );
};

export default Otp;
