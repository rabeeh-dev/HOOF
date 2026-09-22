import React from 'react';
import { Row, Col } from 'antd';
import ProductCard from './ProductCard';

const ProductGrid = ({ products }) => {
  return (
    <Row gutter={[24, 24]}>
      {products.map((product) => (
        <Col xs={24} sm={12} md={8} lg={6} key={product._id}>
          <ProductCard product={product} />
        </Col>
      ))}
    </Row>
  );
};

export default ProductGrid;
