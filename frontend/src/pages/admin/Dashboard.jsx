import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Spin, Typography, Alert } from 'antd';
import { FaDollarSign, FaShoppingBag, FaUsers, FaBox } from 'react-icons/fa';
import { adminService } from '../../api/admin';
import StatCard from '../../components/admin/StatCard';
import SalesChart from '../../components/admin/SalesChart';
import OrdersChart from '../../components/admin/OrdersChart';
import TopProductsTable from '../../components/admin/TopProductsTable';
import TopCategoriesTable from '../../components/admin/TopCategoriesTable';
import RecentOrdersTable from '../../components/admin/RecentOrdersTable';
import DashboardFilter from '../../components/admin/DashboardFilter';

const { Title } = Typography;

const Dashboard = () => {
  const [filterParams, setFilterParams] = useState({ filter: 'daily' });

  // Query dashboard analytics
  const { data: responseData, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-dashboard', filterParams],
    queryFn: async () => {
      const res = await adminService.getDashboardData(filterParams);
      return res.data || {};
    }
  });

  const handleFilterChange = (params) => {
    setFilterParams(params);
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '400px', alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Aggregating dashboard analytics..." />
      </div>
    );
  }

  if (isError || !responseData?.success) {
    return (
      <Alert 
        message="Failed to load dashboard metrics" 
        description="Could not connect to backend aggregates database. Please check connection and retry."
        type="error" 
        showIcon 
        style={{ margin: '20px 0' }}
      />
    );
  }

  const { stats = {}, salesData = [], topProducts = [], recentOrders = [], categorySales = [] } = responseData;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>Dashboard Overview</Title>
        <DashboardFilter onFilterChange={handleFilterChange} />
      </div>

      {/* KPI Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Total Revenue" 
            value={stats.totalRevenue || 0} 
            prefix="₹" 
            precision={2}
            color="#27ae60" 
            icon={<FaDollarSign />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Total Orders" 
            value={stats.totalOrders || 0} 
            color="#1890ff" 
            icon={<FaShoppingBag />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Customers Registered" 
            value={stats.totalCustomers || 0} 
            color="#fa8c16" 
            icon={<FaUsers />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard 
            title="Products Listed" 
            value={stats.totalProducts || 0} 
            color="#722ed1" 
            icon={<FaBox />}
          />
        </Col>
      </Row>

      {/* Analytical Charts */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Sales Growth Curve (Revenue)" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <SalesChart salesData={salesData} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Order Fluctuations (Counts)" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <OrdersChart salesData={salesData} />
          </Card>
        </Col>
      </Row>

      {/* Summary Tables */}
      <Row gutter={[24, 24]}>
        <Col xs={24} xl={12}>
          <Card title="Top Selling Products" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%' }}>
            <TopProductsTable products={topProducts} />
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card title="Top Selling Categories" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)', height: '100%' }}>
            <TopCategoriesTable categories={categorySales} />
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="Recent Orders" bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
            <RecentOrdersTable orders={recentOrders} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
