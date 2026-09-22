import React from 'react';
import { Steps } from 'antd';
import dayjs from 'dayjs';

const OrderTimeline = ({ status = 'PLACED', statusHistory = [] }) => {
  const stepsList = [
    { title: 'Ordered', statusKey: ['PLACED', 'CONFIRMED'] },
    { title: 'Processing', statusKey: ['Pending', 'Processing'] },
    { title: 'Shipped', statusKey: ['Shipped'] },
    { title: 'Delivered', statusKey: ['DELIVERED'] }
  ];

  // Helper helper to get timestamp from statusHistory
  const getStatusTimestamp = (keys) => {
    const record = statusHistory.find(h => keys.includes(h.status));
    return record ? dayjs(record.timestamp).format('DD MMM YYYY, h:mm A') : '';
  };

  const getStepIndex = (activeStatus) => {
    if (activeStatus === 'CANCELLED') return -1;
    if (activeStatus === 'Return Requested') return 3;
    if (activeStatus === 'Return Approved') return 3;
    if (activeStatus === 'Returned') return 3;
    
    const index = stepsList.findIndex(step => step.statusKey.includes(activeStatus));
    return index !== -1 ? index : 1; // fallback
  };

  const currentStep = getStepIndex(status);

  // If order is cancelled, show custom timeline
  if (status === 'CANCELLED') {
    const cancelNote = statusHistory.find(h => h.status === 'CANCELLED')?.note || 'Order cancelled';
    return (
      <Steps
        current={1}
        status="error"
        items={[
          { title: 'Ordered', description: getStatusTimestamp(['PLACED', 'CONFIRMED']) },
          { title: 'Cancelled', description: cancelNote }
        ]}
        style={{ margin: '20px 0' }}
      />
    );
  }

  // If return is processed, append return step details
  let displaySteps = stepsList.map(step => ({
    title: step.title,
    description: getStatusTimestamp(step.statusKey)
  }));

  if (['Return Requested', 'Return Approved', 'Returned'].includes(status)) {
    const returnNote = statusHistory.find(h => h.status === status)?.note || `${status}`;
    displaySteps.push({
      title: status,
      description: returnNote
    });
  }

  return (
    <Steps
      current={currentStep}
      items={displaySteps}
      style={{ margin: '20px 0' }}
      direction="horizontal"
      responsive
    />
  );
};

export default OrderTimeline;
