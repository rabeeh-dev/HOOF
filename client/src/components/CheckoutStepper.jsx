import React from 'react';
import { Steps } from 'antd';

const CheckoutStepper = ({ currentStep = 0 }) => {
  const steps = [
    { title: 'Delivery Address' },
    { title: 'Payment Method' },
    { title: 'Review & Place' },
  ];

  return (
    <Steps 
      current={currentStep} 
      items={steps} 
      style={{ marginBottom: 32 }}
      responsive={false}
    />
  );
};

export default CheckoutStepper;
