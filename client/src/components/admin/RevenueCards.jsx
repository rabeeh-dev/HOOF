import React from 'react';
import { Row, Col } from 'antd';
import StatCard from './StatCard';
import { FaDollarSign, FaChartLine, FaTag, FaUndo } from 'react-icons/fa';

const RevenueCards = ({ summary = {} }) => {
  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Gross Revenue" 
          value={summary.totalGrossRevenue || 0} 
          prefix="₹" 
          precision={2}
          color="#1890ff" 
          icon={<FaDollarSign />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Net Profit" 
          value={summary.totalNetProfit || 0} 
          prefix="₹" 
          precision={2}
          color="#27ae60" 
          icon={<FaChartLine />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Total Discounts" 
          value={summary.totalDiscounts || 0} 
          prefix="₹" 
          precision={2}
          color="#fa8c16" 
          icon={<FaTag />}
        />
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <StatCard 
          title="Total Refunds" 
          value={summary.totalRefunds || 0} 
          prefix="₹" 
          precision={2}
          color="#f5222d" 
          icon={<FaUndo />}
        />
      </Col>
    </Row>
  );
};

export default RevenueCards;
