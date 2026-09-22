import React, { useState, useEffect } from 'react';
import { Input, Space } from 'antd';

const SearchToolbar = ({ searchValue = '', onSearch, placeholder = 'Search...', extra }) => {
  const [value, setValue] = useState(searchValue);

  useEffect(() => { setValue(searchValue); }, [searchValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== searchValue) onSearch(value);
    }, 400);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
      <Input.Search
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onSearch={onSearch}
        placeholder={placeholder}
        allowClear
        style={{ maxWidth: 400 }}
      />
      {extra && <Space>{extra}</Space>}
    </div>
  );
};

export default SearchToolbar;
