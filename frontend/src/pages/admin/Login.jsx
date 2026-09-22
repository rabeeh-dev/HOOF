import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const { Title, Paragraph } = Typography;

const schema = z.object({
  email: z.string().email('Please enter a valid admin email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.adminLogin(data);
      if (res.data && res.data.success) {
        message.success('Admin login successful!');
        login({ email: data.email, role: 'admin', name: 'Admin' });
        navigate('/admin');
      }
    } catch (err) {
      console.error(err);
      message.error(err.response?.data?.message || 'Invalid administrator credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 400, borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={3} style={{ color: '#001529' }}>HOOF ADMIN</Title>
          <Paragraph type="secondary">Sign in to access the control panel dashboard.</Paragraph>
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
              render={({ field }) => <Input {...field} placeholder="admin@hoof.com" />}
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

          <Button 
            type="primary" 
            htmlType="submit" 
            size="large" 
            block 
            loading={loading}
            style={{ background: '#001529', borderColor: '#001529', marginTop: 12 }}
          >
            Log In
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default AdminLogin;
