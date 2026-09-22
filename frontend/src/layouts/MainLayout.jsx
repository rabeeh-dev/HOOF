import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout, Menu, Button, Badge } from 'antd';
import { FaShoppingBag, FaHeart, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/user';

const { Header, Content, Footer } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Fetch Cart and Wishlist counts (only if user is logged in)
  const { data: counts = { cartCount: 0, wishlistCount: 0 } } = useQuery({
    queryKey: ['counts'],
    queryFn: async () => {
      const res = await userService.getCounts();
      return res.data || { cartCount: 0, wishlistCount: 0 };
    },
    enabled: !!user,
    refetchOnWindowFocus: true
  });

  return (
    <Layout className="min-h-screen">
      <Header className="bg-white border-b flex items-center justify-between px-8" style={{ background: '#fff', padding: '0 50px', display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
        <div className="logo font-bold text-xl text-red-600" style={{ fontWeight: 'bold', fontSize: '20px', color: '#c41e3a' }}>
          <Link to="/" style={{ color: '#c41e3a', textDecoration: 'none' }}>HOOF</Link>
        </div>
        
        <Menu mode="horizontal" defaultSelectedKeys={['home']} style={{ flex: 1, minWidth: 0, justifyContent: 'center', borderBottom: 'none' }}>
          <Menu.Item key="home"><Link to="/">Home</Link></Menu.Item>
          <Menu.Item key="shop"><Link to="/shop">Shop</Link></Menu.Item>
          <Menu.Item key="profile"><Link to="/profile">My Profile</Link></Menu.Item>
          <Menu.Item key="orders"><Link to="/orders">My Orders</Link></Menu.Item>
          <Menu.Item key="admin"><Link to="/admin">Admin Panel</Link></Menu.Item>
        </Menu>

        <div className="flex items-center gap-4" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/wishlist" style={{ color: '#555', fontSize: '18px' }}>
            <Badge count={counts.wishlistCount} showZero={false}>
              <FaHeart />
            </Badge>
          </Link>
          <Link to="/cart" style={{ color: '#555', fontSize: '18px' }}>
            <Badge count={counts.cartCount} showZero={false}>
              <FaShoppingBag />
            </Badge>
          </Link>
          <Link to="/profile" style={{ color: '#555', fontSize: '18px' }}>
            <FaUser />
          </Link>
          <Button type="text" icon={<FaSignOutAlt />} onClick={async () => {
            await logout();
            navigate('/login');
          }} />
        </div>
      </Header>

      <Content style={{ padding: '50px', minHeight: 'calc(100vh - 134px)', background: '#f5f7fa' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255, 255, 255, 0.65)' }}>
        HOOF ©{new Date().getFullYear()} Premium Footwear. All Rights Reserved.
      </Footer>
    </Layout>
  );
};

export default MainLayout;
