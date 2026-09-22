import React from 'react';
import { Card, Statistic } from 'antd';

const StatCard = ({ title, value, prefix, suffix, precision = 0, icon, color = '#1890ff' }) => {
  return (
    <Card 
      bordered={false} 
      style={{ 
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)', 
        borderRadius: 8, 
        borderLeft: `4px solid ${color}` 
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Statistic 
            title={<span style={{ fontSize: '14px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: 500 }}>{title}</span>} 
            value={value} 
            precision={precision} 
            prefix={prefix} 
            suffix={suffix}
            valueStyle={{ color: '#262626', fontSize: '24px', fontWeight: 600 }}
          />
        </div>
        {icon && (
          <div style={{ 
            background: `${color}15`, 
            color: color, 
            padding: '12px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            fontSize: '20px'
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

export default StatCard;
