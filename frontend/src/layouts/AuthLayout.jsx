import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Card } from 'antd';

const AuthLayout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: '#f0f2f5', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#c41e3a', margin: 0 }}>
          <Link to="/" style={{ color: '#c41e3a', textDecoration: 'none' }}>HOOF</Link>
        </h1>
        <p style={{ color: 'rgba(0, 0, 0, 0.45)', margin: '8px 0 0 0' }}>Premium Footwear E-Commerce</p>
      </div>
      <Card style={{ width: '100%', maxWidth: 450, boxShadow: '0 4px 12px rgba(0,0,0,0.08)', borderRadius: 8 }}>
        <Outlet />
      </Card>
    </div>
  );
};

export default AuthLayout;
