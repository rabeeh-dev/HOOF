import React from 'react';
import { Card, Typography } from 'antd';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Title, Paragraph } = Typography;

const CategoryCard = ({ category }) => {
  const { _id, name, description } = category;

  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/shop?category=${_id}`} style={{ textDecoration: 'none' }}>
        <Card 
          hoverable 
          style={{ height: 160, display: 'flex', flexDirection: 'column', justifyContent: 'center', background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
          bodyStyle={{ padding: '24px', textAlign: 'center' }}
        >
          <Title level={4} style={{ color: '#1a1a1a', margin: '0 0 8px 0' }}>{name}</Title>
          <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: 0, fontSize: '13px' }}>
            {description}
          </Paragraph>
        </Card>
      </Link>
    </motion.div>
  );
};

export default CategoryCard;
