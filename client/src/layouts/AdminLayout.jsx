import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Breadcrumb, notification } from 'antd';
import { 
  FaTachometerAlt, 
  FaBoxOpen, 
  FaTags, 
  FaShoppingCart, 
  FaTicketAlt, 
  FaUsers, 
  FaChartBar, 
  FaSignOutAlt,
  FaHome,
  FaShareAlt,
  FaCog
} from 'react-icons/fa';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const { Header, Content, Footer, Sider } = Layout;

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const [collapsed, setCollapsed] = useState(false);

  // Real-time admin notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewOrder = (data) => {
      notification.success({
        message: '🛒 New Order Received!',
        description: `Order #${data.shortId} placed for ₹${data.totalAmount} by ${data.customerName}`,
        placement: 'topRight',
        duration: 6,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    };

    const handleStatusUpdated = (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    };

    const handleLowStock = (data) => {
      notification.warning({
        message: '⚠️ Low Stock Alert',
        description: `${data.productName} (Size ${data.size}) only has ${data.remaining} pairs remaining!`,
        placement: 'topRight',
        duration: 8,
      });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    };

    socket.on('order:created', handleNewOrder);
    socket.on('order:status_updated', handleStatusUpdated);
    socket.on('product:low_stock', handleLowStock);

    return () => {
      socket.off('order:created', handleNewOrder);
      socket.off('order:status_updated', handleStatusUpdated);
      socket.off('product:low_stock', handleLowStock);
    };
  }, [socket, queryClient]);

  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.startsWith('/admin/reports/sales')) return 'reports-sales';
    if (path.startsWith('/admin/reports/products')) return 'reports-products';
    if (path.startsWith('/admin/reports/customers')) return 'reports-customers';
    if (path.startsWith('/admin/reports')) return 'reports-dashboard';
    
    if (path.startsWith('/admin/products')) return 'products';
    if (path.startsWith('/admin/categories')) return 'categories';
    if (path.startsWith('/admin/orders')) return 'orders';
    if (path.startsWith('/admin/coupons')) return 'coupons';
    if (path.startsWith('/admin/customers')) return 'customers';
    if (path.startsWith('/admin/referrals')) return 'referral';
    if (path.startsWith('/admin/settings')) return 'settings';
    return 'dashboard';
  };

  const menuItems = [
    { key: 'dashboard', label: <Link to="/admin">Dashboard</Link>, icon: <FaTachometerAlt /> },
    { key: 'products', label: <Link to="/admin/products">Products</Link>, icon: <FaBoxOpen /> },
    { key: 'categories', label: <Link to="/admin/categories">Categories</Link>, icon: <FaTags /> },
    { key: 'orders', label: <Link to="/admin/orders">Orders</Link>, icon: <FaShoppingCart /> },
    { key: 'customers', label: <Link to="/admin/customers">Customers</Link>, icon: <FaUsers /> },
    { key: 'coupons', label: <Link to="/admin/coupons">Coupons</Link>, icon: <FaTicketAlt /> },
    { key: 'referral', label: <Link to="/admin/referrals">Referral</Link>, icon: <FaShareAlt /> },
    { 
      key: 'reports', 
      label: 'Reports', 
      icon: <FaChartBar />,
      children: [
        { key: 'reports-dashboard', label: <Link to="/admin/reports">Overview</Link> },
        { key: 'reports-sales', label: <Link to="/admin/reports/sales">Sales</Link> },
        { key: 'reports-products', label: <Link to="/admin/reports/products">Products</Link> },
        { key: 'reports-customers', label: <Link to="/admin/reports/customers">Customers</Link> },
      ]
    },
    { key: 'settings', label: <Link to="/admin/settings">Settings</Link>, icon: <FaCog /> },
    { type: 'divider' },
    { key: 'store', label: <Link to="/">Storefront</Link>, icon: <FaHome /> },
  ];

  // Generate dynamic breadcrumbs based on URL path
  const generateBreadcrumbs = () => {
    const pathSnippets = location.pathname.split('/').filter(i => i);
    const breadcrumbItems = pathSnippets.map((sub, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
      const name = sub.charAt(0).toUpperCase() + sub.slice(1);
      const isLast = index === pathSnippets.length - 1;
      return {
        key: url,
        title: isLast ? name : <Link to={url}>{name}</Link>
      };
    });
    return [{ key: 'root', title: <Link to="/admin">Admin</Link> }, ...breadcrumbItems.slice(1)];
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)} theme="dark">
        <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: collapsed ? '12px' : '16px' }}>
          {collapsed ? 'H' : 'HOOF ADMIN'}
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[getSelectedKey()]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Control Panel</h2>
          <Button 
            type="text" 
            icon={<FaSignOutAlt style={{ marginRight: 8 }} />} 
            onClick={async () => {
              await logout();
              navigate('/admin/login');
            }}
          >
            Logout
          </Button>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', minHeight: 280, borderRadius: 8 }}>
          <Breadcrumb items={generateBreadcrumbs()} style={{ marginBottom: 16 }} />
          <Outlet />
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          HOOF Admin Panel ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
