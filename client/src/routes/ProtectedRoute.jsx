import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spin } from 'antd';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Verifying session..." />
      </div>
    );
  }
  
  // Checks if user is authenticated (either standard user or admin)
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
