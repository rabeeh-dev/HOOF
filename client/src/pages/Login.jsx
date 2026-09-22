import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Button, Typography, Space, Radio, message } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const { Title, Paragraph } = Typography;

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState('user'); // 'user' or 'admin'
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      if (role === 'admin') {
        const res = await authService.adminLogin(data);
        if (res.data && res.data.success) {
          message.success('Admin login successful!');
          login({ email: data.email, role: 'admin', name: 'Admin' });
          navigate('/admin');
        }
      } else {
        const res = await authService.login(data);
        if (res.data && res.data.success) {
          message.success('Login successful!');
          login(res.data.user);
          navigate('/');
        }
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Redirect to the existing backend Passport Google authentication route
    window.location.href = 'http://localhost:8080/api/auth/google';
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <Title level={3}>Sign In</Title>
        <Paragraph style={{ color: 'rgba(0, 0, 0, 0.45)' }}>Sign in to access your HOOF panel.</Paragraph>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 15 }}>
        <Radio.Group value={role} onChange={(e) => setRole(e.target.value)} buttonStyle="solid">
          <Radio.Button value="user">Customer</Radio.Button>
          <Radio.Button value="admin">Administrator</Radio.Button>
        </Radio.Group>
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

        <Form.Item 
          label="Password" 
          validateStatus={errors.password ? 'error' : ''} 
          help={errors.password?.message}
        >
          <Controller
            name="password"
            control={control}
            render={({ field }) => <Input.Password {...field} placeholder="••••••" />}
          />
        </Form.Item>

        {role === 'user' && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <Link to="/forgot-password" style={{ fontSize: '13px' }}>Forgot Password?</Link>
            <Link to="/signup" style={{ fontSize: '13px' }}>Create Account</Link>
          </div>
        )}

        <Button type="primary" htmlType="submit" size="large" block loading={loading} style={{ background: '#c41e3a', borderColor: '#c41e3a', marginBottom: 15 }}>
          Sign In
        </Button>

        {role === 'user' && (
          <Button type="default" size="large" block onClick={handleGoogleLogin}>
            Sign In with Google
          </Button>
        )}
      </Form>
    </Space>
  );
};

export default Login;
