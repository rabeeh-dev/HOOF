import React from 'react';
import { Typography, Row, Col, Card } from 'antd';
import { Link } from 'react-router-dom';
import { FaChartLine, FaBoxOpen, FaUsers } from 'react-icons/fa';

const { Title, Paragraph } = Typography;

const ReportsDashboardPage = () => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Reports & Analytics</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Link to="/admin/reports/sales">
            <Card hoverable style={{ textAlign: 'center', padding: '24px 0' }}>
              <FaChartLine size={48} color="#1890ff" style={{ marginBottom: 16 }} />
              <Title level={4}>Sales Report</Title>
              <Paragraph type="secondary">Analyze revenue, discounts, and profitability.</Paragraph>
            </Card>
          </Link>
        </Col>

        <Col xs={24} md={8}>
          <Link to="/admin/reports/products">
            <Card hoverable style={{ textAlign: 'center', padding: '24px 0' }}>
              <FaBoxOpen size={48} color="#722ed1" style={{ marginBottom: 16 }} />
              <Title level={4}>Product Report</Title>
              <Paragraph type="secondary">Track inventory, top selling items, and category performance.</Paragraph>
            </Card>
          </Link>
        </Col>

        <Col xs={24} md={8}>
          <Link to="/admin/reports/customers">
            <Card hoverable style={{ textAlign: 'center', padding: '24px 0' }}>
              <FaUsers size={48} color="#fa8c16" style={{ marginBottom: 16 }} />
              <Title level={4}>Customer Report</Title>
              <Paragraph type="secondary">View customer acquisition, spend, and wallet balances.</Paragraph>
            </Card>
          </Link>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsDashboardPage;
