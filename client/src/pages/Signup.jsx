import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Button, Typography, Space, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';

const { Title, Paragraph } = Typography;

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(8, 'Confirm password must be at least 8 characters long'),
  referralCode: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '', confirmPassword: '', referralCode: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.signup(data);
      if (res.data && res.data.success) {
        message.success('Registration initiated. OTP sent to your email.');
        navigate('/verify-otp');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Title level={3}>Create Account</Title>
        <Paragraph style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Register to get started on HOOF.</Paragraph>
      </div>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <Form.Item 
          label="Full Name" 
          validateStatus={errors.fullName ? 'error' : ''} 
          help={errors.fullName?.message}
        >
          <Controller
            name="fullName"
            control={control}
            render={({ field }) => <Input {...field} placeholder="John Doe" />}
          />
        </Form.Item>

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

        <Form.Item 
          label="Password" 
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
          label="Confirm Password" 
          validateStatus={errors.confirmPassword ? 'error' : ''} 
          help={errors.confirmPassword?.message}
        >
          <Controller
            name="confirmPassword"
            control={control}
            render={({ field }) => <Input.Password {...field} placeholder="••••••••" />}
          />
        </Form.Item>

        <Form.Item 
          label="Referral Code (Optional)" 
          validateStatus={errors.referralCode ? 'error' : ''} 
          help={errors.referralCode?.message}
        >
          <Controller
            name="referralCode"
            control={control}
            render={({ field }) => <Input {...field} placeholder="HOOF-XXXX" />}
          />
        </Form.Item>

        <div style={{ textAlign: 'right', marginBottom: 20 }}>
          <Link to="/login" style={{ fontSize: '13px' }}>Already have an account? Sign In</Link>
        </div>

        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
          Register
        </Button>
      </Form>
    </Space>
  );
};

export default Signup;
