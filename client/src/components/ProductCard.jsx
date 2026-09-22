import React from 'react';
import { Card, Tag, Typography, Badge } from 'antd';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const { Text, Title } = Typography;

const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/300x200?text=No+Image';
  if (image.startsWith('http')) return image;
  // Ensure starting slash is resolved
  const cleanPath = image.startsWith('/') ? image : `/${image}`;
  return `http://localhost:8080${cleanPath}`;
};

const ProductCard = ({ product }) => {
  const { _id, productName, brand, regularPrice, salePrice, productImage, productOffer, status } = product;
  const mainImage = getImageUrl(productImage && productImage[0]);
  const isOutOfStock = status === 'Out of Stock' || product.quantity === 0;

  const cardContent = (
    <Card
      hoverable
      cover={
        <div style={{ position: 'relative', height: 220, overflow: 'hidden', background: '#f0f2f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img 
            src={mainImage} 
            alt={productName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=HOOF+Footwear';
            }}
          />
          {productOffer > 0 && !isOutOfStock && (
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <Tag color="red" style={{ fontWeight: 'bold' }}>-{productOffer}% OFF</Tag>
            </div>
          )}
          {isOutOfStock && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Tag color="default" style={{ fontSize: '14px', padding: '6px 16px', fontWeight: 'bold' }}>OUT OF STOCK</Tag>
            </div>
          )}
        </div>
      }
      bodyStyle={{ padding: '16px' }}
    >
      <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{brand}</Text>
      <Title level={5} style={{ margin: '4px 0 8px', fontSize: '15px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{productName}</Title>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10 }}>
        {salePrice < regularPrice ? (
          <>
            <Text delete type="secondary" style={{ fontSize: '13px' }}>₹{regularPrice.toLocaleString('en-IN')}</Text>
            <Text strong style={{ color: '#c41e3a', fontSize: '16px' }}>₹{salePrice.toLocaleString('en-IN')}</Text>
          </>
        ) : (
          <Text strong style={{ fontSize: '16px' }}>₹{regularPrice.toLocaleString('en-IN')}</Text>
        )}
      </div>
    </Card>
  );

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <Link to={`/product/${_id}`} style={{ textDecoration: 'none' }}>
        {cardContent}
      </Link>
    </motion.div>
  );
};

export default ProductCard;
