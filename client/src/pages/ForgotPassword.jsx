import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Button, Typography, Space, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';

const { Title, Paragraph } = Typography;

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.forgotPassword(data.email);
      if (res.data && res.data.success) {
        message.success(res.data.message || 'Recovery email link triggered!');
        navigate('/login');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Failed to submit recovery email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Title level={3}>Forgot Password</Title>
        <Paragraph style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Enter your email address and we'll send you a recovery link.</Paragraph>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item 
          label="Email Address" 
          validateStatus={errors.email ? 'error' : ''} 
          help={errors.email?.message}
        >
          <Controller
            name="email"
            control={control}
            render={({ field }) => <Input {...field} placeholder="email@example.com" />}
          />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <Link to="/login" style={{ fontSize: '13px' }}>Back to Sign In</Link>
        </div>

        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
          Send Recovery Link
        </Button>
      </Form>
    </Space>
  );
};

export default ForgotPassword;
