import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const GuestRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }
  
  // Guest-only pages (e.g. login, register, reset-password). Redirects to homepage if already authenticated.
  return !user ? <Outlet /> : <Navigate to="/" replace />;
};

export default GuestRoute;
