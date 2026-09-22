import React from 'react';
import { Empty, Timeline, Typography } from 'antd';

const { Text } = Typography;

const formatDate = (date) => date
  ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
  : 'Not recorded';

const OrderTimeline = ({ history = [] }) => {
  if (!history.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No status history" />;

  return (
    <Timeline
      items={[...history].reverse().map((item, index) => ({
        key: item._id || `${item.status}-${index}`,
        children: (
          <div>
            <Text strong>{item.status}</Text>
            <div><Text type="secondary">{formatDate(item.changedAt)}</Text></div>
            {item.note && <div style={{ marginTop: 4 }}>{item.note}</div>}
          </div>
        )
      }))}
    />
  );
};

export default OrderTimeline;
