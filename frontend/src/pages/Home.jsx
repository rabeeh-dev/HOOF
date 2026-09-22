import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography, Row, Col, Button, Spin, Card } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { userService } from '../api/user';
import CategoryCard from '../components/CategoryCard';
import ProductGrid from '../components/ProductGrid';

const { Title, Paragraph } = Typography;

const Home = () => {
  const navigate = useNavigate();

  // Fetch Categories
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await userService.getCategories();
      return res.data?.categories || [];
    }
  });

  // Fetch New Arrivals (Featured)
  const { data: newArrivalsData, isLoading: arrivalsLoading } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: async () => {
      const res = await userService.getNewArrivals(4);
      return res.data?.products || [];
    }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
      
      {/* HERO SECTION WITH FRAMER MOTION */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ 
          background: 'linear-gradient(135deg, #001529 0%, #c41e3a 100%)', 
          borderRadius: '16px', 
          padding: '80px 60px', 
          color: '#fff',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          textAlign: 'left'
        }}
      >
        <Row gutter={24} align="middle">
          <Col xs={24} md={14}>
            <Title level={1} style={{ color: '#fff', fontSize: '46px', margin: 0, fontWeight: 700 }}>
              Discover the Premium Edge
            </Title>
            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: '18px', margin: '20px 0 40px', lineHeight: 1.6 }}>
              Step into style, durability, and absolute athletic comfort. Explore the new HOOF line-ups designed for the everyday active life.
            </Paragraph>
            <Button 
              type="primary" 
              size="large" 
              onClick={() => navigate('/shop')} 
              style={{ background: '#fff', color: '#c41e3a', borderColor: '#fff', fontWeight: 'bold', height: 48, padding: '0 32px', borderRadius: 8 }}
            >
              Shop Collection
            </Button>
          </Col>
          <Col xs={0} md={10} style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <img 
                src="https://via.placeholder.com/300x300?text=HOOF+Shoe" 
                alt="Featured shoe" 
                style={{ maxHeight: 280, filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.3))' }}
              />
            </motion.div>
          </Col>
        </Row>
      </motion.div>

      {/* CATEGORY LISTING */}
      <div>
        <Title level={2} style={{ marginBottom: 24, textAlign: 'center' }}>Shop by Category</Title>
        {categoriesLoading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[24, 24]}>
            {categoriesData && categoriesData.map(c => (
              <Col xs={24} sm={12} md={8} lg={6} key={c._id}>
                <CategoryCard category={c} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* LATEST PRODUCTS */}
      <div>
        <Title level={2} style={{ marginBottom: 24, textAlign: 'center' }}>Latest Arrivals</Title>
        {arrivalsLoading ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}><Spin size="large" /></div>
        ) : newArrivalsData && newArrivalsData.length > 0 ? (
          <ProductGrid products={newArrivalsData} />
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#888' }}>No products available at the moment.</div>
        )}
      </div>

    </div>
  );
};

export default Home;
