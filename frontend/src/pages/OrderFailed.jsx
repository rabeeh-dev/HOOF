import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Result, Typography, Spin, message, Alert } from 'antd';
import { FaTimesCircle, FaRedo, FaArrowLeft } from 'react-icons/fa';
import { orderService } from '../api/order';
import { paymentService } from '../api/payment';

const { Text, Paragraph } = Typography;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const OrderFailed = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [retrying, setRetrying] = useState(false);

  // Query order details to show correct price breakdown
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-details', id],
    queryFn: async () => {
      const res = await orderService.getOrderDetails(id);
      return res.data || { order: null, user: null };
    },
    enabled: !!id
  });

  // Retry payment mutation
  const retryMutation = useMutation({
    mutationFn: async () => {
      return paymentService.retryPayment(id);
    },
    onSuccess: async (res) => {
      const data = res.data;
      if (!data.success) {
        message.error(data.message || 'Payment initiation failed.');
        return;
      }

      // Load SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        message.error('Razorpay SDK failed to load. Please verify your connection.');
        return;
      }

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "HOOF Footwear",
        description: "Retry Order Payment",
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            const verifyRes = await paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: data.orderId
            });
            if (verifyRes.data?.success) {
              queryClient.invalidateQueries({ queryKey: ['counts'] });
              message.success('Payment verified successfully!');
              navigate(`/order-success/${data.orderId}`);
            } else {
              message.error('Payment verification failed.');
            }
          } catch (verifyErr) {
            console.error("Verify retry payment error:", verifyErr);
            message.error('Failed to verify payment signature.');
          }
        },
        prefill: {
          name: data.user?.name,
          email: data.user?.email
        },
        theme: {
          color: "#c41e3a"
        },
        modal: {
          ondismiss: () => {
            message.warning('Payment dismissed again.');
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to trigger retry payment.');
    }
  });

  const handleRetryPayment = () => {
    setRetrying(true);
    retryMutation.mutate(null, {
      onSettled: () => setRetrying(false)
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <Spin size="large" tip="Loading transaction specs..." />
      </div>
    );
  }

  if (isError || !data?.order) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f5f7fa' }}>
        <Card style={{ maxWidth: 500, width: '100%', textAlign: 'center', borderRadius: 8 }}>
          <Result
            status="error"
            title="Order ID not found"
            extra={[
              <Button type="primary" key="home" onClick={() => navigate('/')} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
                Go Home
              </Button>
            ]}
          />
        </Card>
      </div>
    );
  }

  const { order } = data;

  return (
    <div style={{ padding: '40px 20px', minHeight: '100vh', background: '#f5f7fa', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Card style={{ maxWidth: 600, width: '100%', borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', textAlign: 'center' }}>
        <Result
          icon={<FaTimesCircle style={{ fontSize: '72px', color: '#ff4d4f' }} />}
          status="error"
          title={<span style={{ fontWeight: 800, fontSize: '26px', color: '#ff4d4f' }}>Payment Failed / Pending</span>}
          subTitle={`Payment was not completed for order #${order._id}.`}
          extra={[
            <Button 
              type="primary" 
              key="retry" 
              onClick={handleRetryPayment} 
              loading={retrying}
              icon={<FaRedo />} 
              style={{ background: '#c41e3a', borderColor: '#c41e3a', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Retry Payment
            </Button>,
            <Button 
              key="orders" 
              onClick={() => navigate('/orders')} 
              icon={<FaArrowLeft />} 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              View My Orders
            </Button>
          ]}
        />
        
        <Alert
          message="Important Notice"
          description="Your order is currently placed but is pending payment verification. You can retry the payment above or from your 'My Orders' history screen to process shipping."
          type="warning"
          showIcon
          style={{ textAlign: 'left', marginTop: 24 }}
        />
      </Card>
    </div>
  );
};

export default OrderFailed;
