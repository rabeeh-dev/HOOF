import React from 'react';
import { Row, Col } from 'antd';
import StatCard from './StatCard';

const SummaryCards = ({ items = [] }) => {
  return (
    <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
      {items.map((item, idx) => (
        <Col xs={24} sm={12} lg={6} key={idx}>
          <StatCard 
            title={item.title} 
            value={item.value} 
            prefix={item.prefix} 
            color={item.color} 
            icon={item.icon}
            precision={item.precision}
          />
        </Col>
      ))}
    </Row>
  );
};

export default SummaryCards;
