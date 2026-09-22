import React from 'react';
import { Input } from 'antd';

const { Search } = Input;

const SearchBar = ({ value, onChange, onSearch, placeholder = "Search footwear..." }) => {
  return (
    <Search
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onSearch={onSearch}
      enterButton
      style={{ width: '100%', maxWidth: 400 }}
    />
  );
};

export default SearchBar;
