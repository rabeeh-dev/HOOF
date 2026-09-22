import React from 'react';
import { Empty, Button } from 'antd';

const EmptyState = ({ message = "No products found matching your criteria", onReset }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, width: '100%' }}>
      <Empty 
        description={message}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        {onReset && (
          <Button type="primary" onClick={onReset} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
            Reset Filters
          </Button>
        )}
      </Empty>
    </div>
  );
};

export default EmptyState;
