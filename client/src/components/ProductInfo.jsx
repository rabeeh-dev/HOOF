import React, { useState } from 'react';
import { Typography, Tag, Space, Button } from 'antd';
import { FaShoppingCart, FaHeart } from 'react-icons/fa';

const { Title, Paragraph, Text } = Typography;

const ProductInfo = ({ product }) => {
  const { productName, brand, category, regularPrice, salePrice, productOffer, description, variants, status, quantity } = product;
  const [selectedSize, setSelectedSize] = useState(null);

  const isOutOfStock = status === 'Out of Stock' || quantity === 0;

  // Filter sizes that are available (quantity > 0)
  const availableSizes = variants ? variants.filter(v => v.quantity > 0).map(v => v.size) : [];

  return (
    <div>
      <Text type="secondary" style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 500 }}>{brand}</Text>
      <Title level={2} style={{ margin: '8px 0 12px' }}>{productName}</Title>
      
      <Space size="middle" style={{ marginBottom: 20 }}>
        {category && <Tag color="blue">{category.name}</Tag>}
        {isOutOfStock ? (
          <Tag color="red">OUT OF STOCK</Tag>
        ) : (
          <Tag color="green">IN STOCK ({quantity} items left)</Tag>
        )}
      </Space>

      <div style={{ display: 'flex', alignItems: 'center', gap: 15, marginBottom: 24 }}>
        {salePrice < regularPrice ? (
          <>
            <Text strong style={{ color: '#c41e3a', fontSize: '26px' }}>₹{salePrice.toLocaleString('en-IN')}</Text>
            <Text delete type="secondary" style={{ fontSize: '16px' }}>₹{regularPrice.toLocaleString('en-IN')}</Text>
            <Tag color="red" style={{ fontWeight: 'bold' }}>{productOffer}% OFF</Tag>
          </>
        ) : (
          <Text strong style={{ fontSize: '26px' }}>₹{regularPrice.toLocaleString('en-IN')}</Text>
        )}
      </div>

      <Paragraph style={{ color: '#555', fontSize: '14px', lineHeight: 1.6, marginBottom: 30 }}>
        {description}
      </Paragraph>

      {/* Size Selector */}
      <div style={{ marginBottom: 30 }}>
        <Title level={5} style={{ marginBottom: 12 }}>Select Size (UK)</Title>
        {isOutOfStock ? (
          <Text type="secondary">Sizes unavailable (Out of stock)</Text>
        ) : availableSizes.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {availableSizes.map(size => {
              const isSelected = selectedSize === size;
              return (
                <Button
                  key={size}
                  type={isSelected ? 'primary' : 'default'}
                  onClick={() => setSelectedSize(size)}
                  style={{ 
                    minWidth: 50, 
                    height: 40, 
                    borderRadius: 6,
                    background: isSelected ? '#c41e3a' : '#fff',
                    borderColor: isSelected ? '#c41e3a' : '#d9d9d9',
                    color: isSelected ? '#fff' : 'inherit'
                  }}
                >
                  {size}
                </Button>
              );
            })}
          </div>
        ) : (
          <Text type="secondary">No sizes listed for this product</Text>
        )}
      </div>

      {/* Cart & Wishlist Triggers (Placeholders only as requested) */}
      <Space size="middle" style={{ width: '100%' }}>
        <Button 
          type="primary" 
          size="large" 
          disabled={isOutOfStock || !selectedSize}
          icon={<FaShoppingCart />} 
          style={{ 
            height: 48, 
            padding: '0 32px', 
            background: isOutOfStock || !selectedSize ? undefined : '#c41e3a', 
            borderColor: isOutOfStock || !selectedSize ? undefined : '#c41e3a', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 8, 
            fontWeight: 500 
          }}
        >
          {isOutOfStock ? 'Sold Out' : !selectedSize ? 'Select Size' : 'Add to Cart'}
        </Button>
        <Button 
          size="large" 
          icon={<FaHeart />} 
          style={{ height: 48, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          Wishlist
        </Button>
      </Space>
    </div>
  );
};

export default ProductInfo;
