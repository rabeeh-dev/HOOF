import React, { useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Badge, notification, Dropdown, Avatar, Space } from 'antd';
import { 
  FaShoppingBag, 
  FaHeart, 
  FaUser, 
  FaSignOutAlt, 
  FaBoxOpen, 
  FaWallet, 
  FaMapMarkerAlt, 
  FaGift, 
  FaSignInAlt, 
  FaUserPlus,
  FaShieldAlt
} from 'react-icons/fa';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { userService } from '../api/user';

const { Header, Content, Footer } = Layout;

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  // Real-time socket listener for customer order updates
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data) => {
      notification.info({
        message: '📦 Order Status Update',
        description: data.message || `Order #${data.shortId} status changed to ${data.status}`,
        placement: 'topRight',
        duration: 5,
      });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order-detail'] });
    };

    socket.on('order:status_updated', handleStatusUpdate);

    return () => {
      socket.off('order:status_updated', handleStatusUpdate);
    };
  }, [socket, queryClient]);

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

  // Navigation menu items based on login status
  const navMenuItems = [
    { key: '/', label: <Link to="/">Home</Link> },
    { key: '/shop', label: <Link to="/shop">Shop</Link> },
    ...(user ? [
      { key: '/orders', label: <Link to="/orders">My Orders</Link> },
      { key: '/profile', label: <Link to="/profile">My Profile</Link> },
    ] : []),
    ...(user?.role === 'admin' ? [
      { key: '/admin', label: <Link to="/admin" style={{ color: '#c41e3a', fontWeight: 'bold' }}>Admin Panel</Link> },
    ] : []),
  ];

  // User Profile Dropdown Menu items (only for logged-in user)
  const userMenuItems = [
    {
      key: 'user-header',
      disabled: true,
      label: (
        <div style={{ padding: '6px 4px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ fontWeight: 600, color: '#111827', fontSize: '14px' }}>
            {user?.fullName || user?.name || 'Customer'}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {user?.email}
          </div>
        </div>
      ),
    },
    {
      key: 'profile',
      icon: <FaUser />,
      label: <Link to="/profile">My Profile</Link>,
    },
    {
      key: 'orders',
      icon: <FaBoxOpen />,
      label: <Link to="/orders">My Orders</Link>,
    },
    {
      key: 'wallet',
      icon: <FaWallet />,
      label: <Link to="/profile/wallet">My Wallet</Link>,
    },
    {
      key: 'addresses',
      icon: <FaMapMarkerAlt />,
      label: <Link to="/profile/addresses">Saved Addresses</Link>,
    },
    {
      key: 'referrals',
      icon: <FaGift />,
      label: <Link to="/profile/referrals">Refer & Earn</Link>,
    },
    ...(user?.role === 'admin' ? [
      { type: 'divider' },
      {
        key: 'admin-link',
        icon: <FaShieldAlt style={{ color: '#c41e3a' }} />,
        label: <Link to="/admin" style={{ color: '#c41e3a', fontWeight: 600 }}>Admin Dashboard</Link>,
      },
    ] : []),
    { type: 'divider' },
    {
      key: 'logout',
      icon: <FaSignOutAlt style={{ color: '#ef4444' }} />,
      danger: true,
      label: 'Sign Out',
      onClick: async () => {
        await logout();
        navigate('/');
      },
    },
  ];

  return (
    <Layout className="min-h-screen">
      <Header 
        className="bg-white border-b flex items-center justify-between px-8" 
        style={{ 
          background: '#fff', 
          padding: '0 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <div className="logo" style={{ fontWeight: 800, fontSize: '24px', letterSpacing: '1px' }}>
          <Link to="/" style={{ color: '#c41e3a', textDecoration: 'none' }}>HOOF</Link>
        </div>
        
        <Menu 
          mode="horizontal" 
          selectedKeys={[location.pathname]} 
          items={navMenuItems}
          style={{ 
            flex: 1, 
            minWidth: 0, 
            justifyContent: 'center', 
            borderBottom: 'none',
            fontSize: '15px'
          }} 
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Wishlist Link */}
          <Link to={user ? "/wishlist" : "/login"} style={{ color: '#4b5563', fontSize: '18px', display: 'flex', alignItems: 'center' }} title="Wishlist">
            <Badge count={user ? counts.wishlistCount : 0} showZero={false} offset={[4, -2]}>
              <FaHeart style={{ fontSize: '19px' }} />
            </Badge>
          </Link>

          {/* Cart Link */}
          <Link to={user ? "/cart" : "/login"} style={{ color: '#4b5563', fontSize: '18px', display: 'flex', alignItems: 'center' }} title="Shopping Bag">
            <Badge count={user ? counts.cartCount : 0} showZero={false} offset={[4, -2]}>
              <FaShoppingBag style={{ fontSize: '19px' }} />
            </Badge>
          </Link>

          {/* Conditional Auth controls */}
          {user ? (
            /* Logged-in State: User Profile Dropdown & Sign Out, NO login/signup button */
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    cursor: 'pointer',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: '1px solid #e5e7eb',
                    backgroundColor: '#fafafa',
                    transition: 'all 0.2s'
                  }}
                >
                  <Avatar 
                    size={28}
                    style={{ backgroundColor: '#c41e3a', fontWeight: 'bold' }}
                  >
                    {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                  </Avatar>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#374151', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.fullName ? user.fullName.split(' ')[0] : 'My Account'}
                  </span>
                </div>
              </Dropdown>
              
              <Button 
                type="text" 
                icon={<FaSignOutAlt />} 
                title="Sign Out"
                style={{ color: '#6b7280', fontSize: '16px' }}
                onClick={async () => {
                  await logout();
                  navigate('/');
                }} 
              />
            </div>
          ) : (
            /* Guest State: Prominent Log In and Sign Up buttons */
            <Space size="middle">
              <Button 
                type="default" 
                icon={<FaSignInAlt />}
                onClick={() => navigate('/login')}
                style={{ fontWeight: 600, borderRadius: 6, height: 38 }}
              >
                Log In
              </Button>
              <Button 
                type="primary" 
                icon={<FaUserPlus />}
                onClick={() => navigate('/signup')}
                style={{ 
                  background: '#c41e3a', 
                  borderColor: '#c41e3a', 
                  fontWeight: 600,
                  borderRadius: 6,
                  height: 38
                }}
              >
                Sign Up
              </Button>
            </Space>
          )}
        </div>
      </Header>

      <Content style={{ padding: '40px 50px', minHeight: 'calc(100vh - 134px)', background: '#f5f7fa' }}>
        <Outlet />
      </Content>

      <Footer style={{ textAlign: 'center', background: '#001529', color: 'rgba(255, 255, 255, 0.65)', padding: '30px 50px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>HOOF FOOTWEAR</div>
          <div style={{ fontSize: 14 }}>©{new Date().getFullYear()} HOOF Inc. Premium Footwear. All Rights Reserved.</div>
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
