import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button, Row, Col, Spin, Typography, Divider } from 'antd';
import { FaArrowLeft } from 'react-icons/fa';
import { userService } from '../api/user';
import Breadcrumbs from '../components/Breadcrumbs';
import ProductGallery from '../components/ProductGallery';
import ProductInfo from '../components/ProductInfo';
import ProductGrid from '../components/ProductGrid';

const { Title } = Typography;

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Query Details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['product-details', id],
    queryFn: async () => {
      const res = await userService.getProductDetails(id);
      return res.data || { product: null, relatedProducts: [] };
    },
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading product specifications..." />
      </div>
    );
  }

  if (isError || !data?.product) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Title level={3} type="danger">Product Not Found</Title>
        <Button type="primary" onClick={() => navigate('/shop')} style={{ background: '#c41e3a', borderColor: '#c41e3a', marginTop: 15 }}>
          Back to Shop
        </Button>
      </div>
    );
  }

  const { product, relatedProducts = [] } = data;

  const breadcrumbsItems = [
    { name: 'Home', url: '/' },
    { name: 'Shop', url: '/shop' },
    { name: product.productName }
  ];

  return (
    <div>
      {/* Navigation Headers */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Breadcrumbs items={breadcrumbsItems} />
        <Button type="link" icon={<FaArrowLeft />} onClick={() => navigate('/shop')} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          Back to Shop
        </Button>
      </div>

      {/* Main product details block */}
      <Row gutter={[48, 48]} style={{ marginBottom: 60 }}>
        {/* Left Side: Images Gallery */}
        <Col xs={24} md={12}>
          <ProductGallery images={product.productImage} />
        </Col>

        {/* Right Side: Product Details info */}
        <Col xs={24} md={12}>
          <ProductInfo product={product} />
        </Col>
      </Row>

      {/* Related Products list */}
      {relatedProducts.length > 0 && (
        <div>
          <Divider style={{ margin: '40px 0' }} />
          <Title level={3} style={{ marginBottom: 24 }}>You May Also Like</Title>
          <ProductGrid products={relatedProducts} />
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
