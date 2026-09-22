import React from 'react';
import { Select } from 'antd';

const SortDropdown = ({ value, onChange }) => {
  const options = [
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'a-z', label: 'Name: A to Z' },
    { value: 'z-a', label: 'Name: Z to A' },
  ];

  return (
    <Select
      value={value || 'newest'}
      onChange={onChange}
      style={{ width: 180 }}
      options={options}
      placeholder="Sort by"
    />
  );
};

export default SortDropdown;
