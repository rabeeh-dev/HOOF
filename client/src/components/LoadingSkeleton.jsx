import React from 'react';
import { Row, Col, Card, Skeleton } from 'antd';

const LoadingSkeleton = ({ count = 4 }) => {
  return (
    <Row gutter={[24, 24]}>
      {Array.from({ length: count }).map((_, index) => (
        <Col xs={24} sm={12} md={8} lg={6} key={index}>
          <Card 
            cover={<Skeleton.Image style={{ width: '100%', height: 220 }} active />}
            bodyStyle={{ padding: '16px' }}
          >
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export default LoadingSkeleton;
