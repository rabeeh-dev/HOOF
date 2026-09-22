import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Typography, Row, Col, Button, Spin, Card, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FaShoppingBag, 
  FaUserPlus, 
  FaSignInAlt, 
  FaBoxOpen, 
  FaTruck, 
  FaShieldAlt, 
  FaUndoAlt, 
  FaCrown, 
  FaWallet,
  FaArrowRight 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { userService } from '../api/user';
import CategoryCard from '../components/CategoryCard';
import ProductGrid from '../components/ProductGrid';

const { Title, Paragraph, Text } = Typography;

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '50px', maxWidth: 1280, margin: '0 auto' }}>
      
      {/* HERO SECTION WITH DYNAMIC GUEST / LOGGED-IN EXPERIENCE */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ 
          background: 'linear-gradient(135deg, #001529 0%, #1e293b 40%, #c41e3a 100%)', 
          borderRadius: '20px', 
          padding: '70px 50px', 
          color: '#fff',
          boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
          textAlign: 'left',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Row gutter={32} align="middle">
          <Col xs={24} md={14}>
            {user ? (
              <Tag color="gold" style={{ marginBottom: 16, padding: '4px 12px', fontSize: 13, fontWeight: 600, borderRadius: 20 }}>
                <FaCrown style={{ marginRight: 6 }} /> HOOF Member Active
              </Tag>
            ) : (
              <Tag color="volcano" style={{ marginBottom: 16, padding: '4px 12px', fontSize: 13, fontWeight: 600, borderRadius: 20 }}>
                🔥 New Season 2026 Drops
              </Tag>
            )}

            <Title level={1} style={{ color: '#fff', fontSize: '44px', margin: 0, fontWeight: 800, lineHeight: 1.2 }}>
              {user ? (
                <>Welcome back, <span style={{ color: '#ffb4a2' }}>{user.fullName?.split(' ')[0] || user.name || 'Shopper'}</span>!</>
              ) : (
                <>Discover the <span style={{ color: '#ffb4a2' }}>Premium Edge</span></>
              )}
            </Title>

            <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: '17px', margin: '20px 0 32px', lineHeight: 1.6, maxWidth: 540 }}>
              {user ? (
                "Explore fresh kicks, seasonal arrivals, or check on your active orders. Enjoy member-exclusive pricing and express shipping."
              ) : (
                "Step into style, durability, and absolute athletic comfort. Explore the new HOOF line-ups designed for the everyday active life."
              )}
            </Paragraph>

            {/* CONDITIONAL ACTION BUTTONS */}
            {user ? (
              /* Logged-In User Actions: Shop Collection & View Orders (NO login/signup) */
              <Space size="middle" wrap>
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<FaShoppingBag />}
                  onClick={() => navigate('/shop')} 
                  style={{ 
                    background: '#fff', 
                    color: '#c41e3a', 
                    borderColor: '#fff', 
                    fontWeight: 700, 
                    height: 50, 
                    padding: '0 28px', 
                    borderRadius: 8 
                  }}
                >
                  Shop Collection
                </Button>
                <Button 
                  size="large" 
                  icon={<FaBoxOpen />}
                  onClick={() => navigate('/orders')} 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.12)', 
                    color: '#fff', 
                    borderColor: 'rgba(255, 255, 255, 0.4)', 
                    fontWeight: 600, 
                    height: 50, 
                    padding: '0 24px', 
                    borderRadius: 8,
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  My Orders
                </Button>
              </Space>
            ) : (
              /* Guest Actions: Shop Collection & Prominent Signup/Login */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Space size="middle" wrap>
                  <Button 
                    type="primary" 
                    size="large" 
                    icon={<FaShoppingBag />}
                    onClick={() => navigate('/shop')} 
                    style={{ 
                      background: '#fff', 
                      color: '#c41e3a', 
                      borderColor: '#fff', 
                      fontWeight: 700, 
                      height: 50, 
                      padding: '0 28px', 
                      borderRadius: 8 
                    }}
                  >
                    Shop Collection
                  </Button>
                  <Button 
                    size="large" 
                    icon={<FaUserPlus />}
                    onClick={() => navigate('/signup')} 
                    style={{ 
                      background: '#c41e3a', 
                      color: '#fff', 
                      borderColor: '#c41e3a', 
                      fontWeight: 600, 
                      height: 50, 
                      padding: '0 26px', 
                      borderRadius: 8,
                      boxShadow: '0 4px 12px rgba(196, 30, 58, 0.4)'
                    }}
                  >
                    Create Account
                  </Button>
                </Space>

                <div style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '14px', marginTop: 4 }}>
                  Already a member?{' '}
                  <span 
                    onClick={() => navigate('/login')} 
                    style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Log In to your account
                  </span>
                </div>
              </div>
            )}
          </Col>

          <Col xs={0} md={10} style={{ display: 'flex', justifyContent: 'center' }}>
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
            >
              <img 
                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80" 
                alt="Featured HOOF Sneaker" 
                style={{ 
                  maxHeight: 280, 
                  maxWidth: '100%',
                  objectFit: 'contain', 
                  filter: 'drop-shadow(0px 15px 25px rgba(0,0,0,0.4))',
                  borderRadius: 12
                }}
              />
            </motion.div>
          </Col>
        </Row>
      </motion.div>

      {/* VALUE PROPOSITION STRIP */}
      <Card 
        bordered={false}
        style={{ 
          background: '#ffffff', 
          borderRadius: 14, 
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          padding: '4px 12px'
        }}
      >
        <Row gutter={[24, 16]} justify="space-around" align="middle">
          <Col xs={12} sm={6} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#fee2e2', color: '#c41e3a', padding: 12, borderRadius: 10, fontSize: 18 }}>
              <FaTruck />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Free Shipping</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>On orders over ₹1,999</div>
            </div>
          </Col>
          <Col xs={12} sm={6} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#fee2e2', color: '#c41e3a', padding: 12, borderRadius: 10, fontSize: 18 }}>
              <FaShieldAlt />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>100% Authentic</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Guaranteed Genuine</div>
            </div>
          </Col>
          <Col xs={12} sm={6} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#fee2e2', color: '#c41e3a', padding: 12, borderRadius: 10, fontSize: 18 }}>
              <FaUndoAlt />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Easy 7-Day Returns</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Hassle-free pickups</div>
            </div>
          </Col>
          <Col xs={12} sm={6} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ background: '#fee2e2', color: '#c41e3a', padding: 12, borderRadius: 10, fontSize: 18 }}>
              <FaCrown />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>HOOF Rewards</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>Exclusive member perks</div>
            </div>
          </Col>
        </Row>
      </Card>

      {/* MEMBER STATUS / SIGNUP CALLOUT BANNER */}
      {user ? (
        /* Logged in member banner */
        <div 
          style={{ 
            background: 'linear-gradient(90deg, #f8fafc 0%, #eff6ff 100%)', 
            borderRadius: 14, 
            padding: '20px 28px',
            border: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <FaCrown style={{ color: '#eab308', fontSize: 24 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                HOOF Club Membership Active
              </div>
              <div style={{ color: '#64748b', fontSize: 13 }}>
                Enjoy express checkout, order tracking, wallet credits, and referral bonuses.
              </div>
            </div>
          </div>
          <Space>
            <Button onClick={() => navigate('/orders')} icon={<FaBoxOpen />}>Track Orders</Button>
            <Button onClick={() => navigate('/profile/wallet')} icon={<FaWallet />}>My Wallet</Button>
          </Space>
        </div>
      ) : (
        /* Guest signup callout banner */
        <div 
          style={{ 
            background: 'linear-gradient(90deg, #fff1f2 0%, #ffe4e6 100%)', 
            borderRadius: 14, 
            padding: '20px 28px',
            border: '1px solid #fecdd3',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#9f1239' }}>
              Join the HOOF Club & Save More
            </div>
            <div style={{ color: '#be123c', fontSize: 13, marginTop: 2 }}>
              Create an account in seconds to earn referral rewards, track orders in real-time, and get exclusive drop access.
            </div>
          </div>
          <Space size="middle">
            <Button 
              type="primary" 
              onClick={() => navigate('/signup')} 
              icon={<FaUserPlus />}
              style={{ background: '#c41e3a', borderColor: '#c41e3a', fontWeight: 600 }}
            >
              Sign Up Free
            </Button>
            <Button 
              onClick={() => navigate('/login')} 
              icon={<FaSignInAlt />}
              style={{ fontWeight: 600 }}
            >
              Log In
            </Button>
          </Space>
        </div>
      )}

      {/* CATEGORY LISTING */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Shop by Category</Title>
          <Text type="secondary">Explore curated footwear for running, lifestyle, training, and more</Text>
        </div>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <Title level={2} style={{ margin: 0, fontWeight: 700 }}>Latest Arrivals</Title>
            <Text type="secondary">Handpicked styles freshly engineered for comfort and speed</Text>
          </div>
          <Button 
            type="link" 
            onClick={() => navigate('/shop')} 
            style={{ fontWeight: 600, color: '#c41e3a', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Explore All Products <FaArrowRight style={{ fontSize: 12 }} />
          </Button>
        </div>

        {arrivalsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>
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
