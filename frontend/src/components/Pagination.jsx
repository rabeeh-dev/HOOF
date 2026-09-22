import React from 'react';
import { Pagination as AntdPagination } from 'antd';

const Pagination = ({ current = 1, total = 0, pageSize = 8, onChange }) => {
  if (total <= pageSize) return null;

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40, width: '100%' }}>
      <AntdPagination
        current={current}
        total={total}
        pageSize={pageSize}
        onChange={onChange}
        showSizeChanger={false}
      />
    </div>
  );
};

export default Pagination;
