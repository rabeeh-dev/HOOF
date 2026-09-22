import React from 'react';
import { Card, Checkbox, Slider, Space, Tag, Typography, Button } from 'antd';
import { FaTimes } from 'react-icons/fa';

const { Title, Text } = Typography;

const FilterSidebar = ({ 
  categories = [], 
  selectedCategory = null, 
  priceRange = [0, 20000],
  selectedSize = null,
  onChangeCategory,
  onChangePrice,
  onChangeSize,
  onClear
}) => {
  const availableSizes = ["6", "7", "8", "9", "10", "11", "12"];

  return (
    <Card title="Filter Footwear" style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }} extra={
      (selectedCategory || selectedSize || priceRange[0] > 0 || priceRange[1] < 20000) && (
        <Button type="text" onClick={onClear} size="small" icon={<FaTimes />} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ff4d4f' }}>
          Clear
        </Button>
      )
    }>
      {/* Category Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ marginBottom: 12 }}>Categories</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          {categories.map(c => (
            <Checkbox 
              key={c._id}
              checked={selectedCategory === c._id}
              onChange={() => onChangeCategory(selectedCategory === c._id ? null : c._id)}
            >
              {c.name}
            </Checkbox>
          ))}
        </Space>
      </div>

      {/* Price Filter */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Title level={5} style={{ margin: 0 }}>Price Range</Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>₹{priceRange[0]} - ₹{priceRange[1]}</Text>
        </div>
        <Slider 
          range 
          min={0} 
          max={20000} 
          step={500}
          value={priceRange} 
          onChange={onChangePrice}
        />
      </div>

      {/* Size Tag Filter */}
      <div>
        <Title level={5} style={{ marginBottom: 12 }}>Select Size</Title>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {availableSizes.map(size => {
            const isSelected = selectedSize === size;
            return (
              <Tag.CheckableTag
                key={size}
                checked={isSelected}
                onChange={() => onChangeSize(isSelected ? null : size)}
                style={{ 
                  padding: '4px 12px', 
                  fontSize: '13px', 
                  borderRadius: 4, 
                  border: isSelected ? '1px solid #c41e3a' : '1px solid #d9d9d9',
                  background: isSelected ? '#fff0f1' : '#fff'
                }}
              >
                UK {size}
              </Tag.CheckableTag>
            );
          })}
        </div>
      </div>
    </Card>
  );
};

export default FilterSidebar;
