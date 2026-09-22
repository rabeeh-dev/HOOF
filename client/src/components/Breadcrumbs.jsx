import React from 'react';
import { Breadcrumb } from 'antd';
import { Link } from 'react-router-dom';

const Breadcrumbs = ({ items = [] }) => {
  if (!items || items.length === 0) return null;

  return (
    <Breadcrumb style={{ marginBottom: 20 }}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <Breadcrumb.Item key={index}>
            {isLast || !item.url ? (
              <span style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{item.name}</span>
            ) : (
              <Link to={item.url}>{item.name}</Link>
            )}
          </Breadcrumb.Item>
        );
      })}
    </Breadcrumb>
  );
};

export default Breadcrumbs;
