import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Button, Card, Typography, Spin, message, Alert } from 'antd';
import { FaArrowLeft, FaArrowRight, FaCheck } from 'react-icons/fa';
import { checkoutService } from '../api/checkout';
import { addressService } from '../api/address';
import { couponService } from '../api/coupon';
import { paymentService } from '../api/payment';
import CheckoutStepper from '../components/CheckoutStepper';
import AddressSelector from '../components/AddressSelector';
import AddressForm from '../components/AddressForm';
import PaymentSelector from '../components/PaymentSelector';
import CouponSection from '../components/CouponSection';
import WalletSection from '../components/WalletSection';
import OrderSummary from '../components/OrderSummary';
import PriceBreakdown from '../components/PriceBreakdown';
import OrderReview from '../components/OrderReview';

const { Title } = Typography;

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  // Coupon details (calculated strictly by backend responses)
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Address modal controller states
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressSubmitting, setAddressSubmitting] = useState(false);

  // Fetch Checkout preparation data
  const { data: checkoutData, isLoading, isError, error } = useQuery({
    queryKey: ['checkout-details'],
    queryFn: async () => {
      const res = await checkoutService.getCheckoutDetails();
      const checkout = res.data?.checkout || {};
      
      // Auto-select default address if available
      if (checkout.addresses && checkout.addresses.length > 0) {
        const defaultAddress = checkout.addresses.find(a => a.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id);
        } else {
          setSelectedAddressId(checkout.addresses[0]._id);
        }
      }
      return checkout;
    }
  });

  // Fetch applicable coupons
  const { data: coupons = [] } = useQuery({
    queryKey: ['available-coupons'],
    queryFn: async () => {
      const res = await couponService.getAvailableCoupons();
      return res.data?.coupons || [];
    }
  });

  // Apply Coupon Mutation
  const applyCouponMutation = useMutation({
    mutationFn: couponService.applyCoupon,
    onSuccess: (res) => {
      if (res.data?.success) {
        setAppliedCoupon(res.data.couponCode);
        setDiscountAmount(res.data.discountAmount);
        message.success(res.data.message || 'Coupon applied!');
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to apply coupon.');
    }
  });

  // Add/Edit Address Mutation
  const saveAddressMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingAddress) {
        return addressService.editAddress(editingAddress._id, formData);
      } else {
        return addressService.addAddress(formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout-details'] });
      message.success(editingAddress ? 'Address updated!' : 'Address added!');
      setAddressModalVisible(false);
      setEditingAddress(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to save address.');
    }
  });

  // Delete Address Mutation
  const deleteAddressMutation = useMutation({
    mutationFn: addressService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkout-details'] });
      message.success('Address deleted.');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to delete address.');
    }
  });

  // Place Order Mutation
  const placeOrderMutation = useMutation({
    mutationFn: checkoutService.placeOrder,
    onSuccess: async (res) => {
      const data = res.data;
      if (!data.success) {
        message.error(data.message || 'Failed to place order.');
        return;
      }

      // If Razorpay gateway trigger is required
      if (data.paymentMethod === 'upi' && data.razorpayOrderId) {
        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
          message.error('Razorpay SDK failed to load. Please verify your connection.');
          navigate(`/order-failed/${data.orderId}`);
          return;
        }

        const options = {
          key: data.keyId,
          amount: data.amount,
          currency: data.currency,
          name: "HOOF Footwear",
          description: "Order Payment",
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
                // Invalidate layout count state
                queryClient.invalidateQueries({ queryKey: ['counts'] });
                navigate(`/order-success/${data.orderId}`);
              } else {
                navigate(`/order-failed/${data.orderId}`);
              }
            } catch (verifyErr) {
              console.error("Payment verification failed:", verifyErr);
              navigate(`/order-failed/${data.orderId}`);
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
              message.warning('Payment cancelled.');
              navigate(`/order-failed/${data.orderId}`);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else if (data.redirectUrl) {
        // Direct redirects (COD or full Wallet checkout)
        queryClient.invalidateQueries({ queryKey: ['counts'] });
        // Match path: redirectUrl contains /user/order-success/ => extract ID
        const parts = data.redirectUrl.split('/');
        const id = parts[parts.length - 1];
        navigate(`/order-success/${id}`);
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to place order.');
    }
  });

  const handleApplyCoupon = (code) => {
    applyCouponMutation.mutate(code);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscountAmount(0);
    message.info('Coupon removed.');
  };

  const handleAddressSubmit = (formData) => {
    setAddressSubmitting(true);
    saveAddressMutation.mutate(formData, {
      onSettled: () => setAddressSubmitting(false)
    });
  };

  const handlePlaceOrder = () => {
    if (!selectedAddressId) {
      return message.error('Please select a shipping address.');
    }
    
    placeOrderMutation.mutate({
      addressId: selectedAddressId,
      paymentMethod,
      couponCode: appliedCoupon
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading checkout configurations..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Alert 
          message="Checkout Blocked" 
          description={error.response?.data?.message || "Verify your cart has stock and proceed again."}
          type="error"
          showIcon
          style={{ maxWidth: 500, margin: '0 auto 20px' }}
        />
        <Button type="primary" onClick={() => navigate('/cart')} style={{ background: '#c41e3a', borderColor: '#c41e3a' }}>
          Return to Cart
        </Button>
      </div>
    );
  }

  const { cartItems = [], addresses = [], subtotal = 0, shippingCharge = 0, totalAmount = 0, walletBalance = 0 } = checkoutData;
  const selectedAddress = addresses.find(a => a._id === selectedAddressId);

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Checkout</Title>
      
      <CheckoutStepper currentStep={currentStep} />

      <Row gutter={[24, 24]}>
        {/* Step inputs section */}
        <Col xs={24} lg={16}>
          {currentStep === 0 && (
            <Card title="1. Select Shipping Address" style={{ borderRadius: 8 }}>
              <AddressSelector
                addresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelect={setSelectedAddressId}
                onAdd={() => { setEditingAddress(null); setAddressModalVisible(true); }}
                onEdit={(addr) => { setEditingAddress(addr); setAddressModalVisible(true); }}
                onDelete={(id) => deleteAddressMutation.mutate(id)}
              />
            </Card>
          )}

          {currentStep === 1 && (
            <Card title="2. Select Payment Method" style={{ borderRadius: 8 }}>
              <PaymentSelector
                value={paymentMethod}
                onChange={setPaymentMethod}
                walletBalance={walletBalance}
                totalAmount={totalAmount - discountAmount}
              />
            </Card>
          )}

          {currentStep === 2 && (
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <OrderReview
                selectedAddress={selectedAddress}
                paymentMethod={paymentMethod}
              />
              <OrderSummary cartItems={cartItems} />
            </Space>
          )}

          {/* Stepper Navigation buttons */}
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
            <Button 
              disabled={currentStep === 0} 
              onClick={() => setCurrentStep(prev => prev - 1)}
              icon={<FaArrowLeft />}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Back
            </Button>
            
            {currentStep < 2 ? (
              <Button 
                type="primary" 
                onClick={() => {
                  if (currentStep === 0 && !selectedAddressId) {
                    return message.error('Please select an address.');
                  }
                  setCurrentStep(prev => prev + 1);
                }}
                icon={<FaArrowRight />}
                style={{ background: '#c41e3a', borderColor: '#c41e3a', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Continue
              </Button>
            ) : (
              <Button 
                type="primary" 
                size="large"
                loading={placeOrderMutation.isPending}
                onClick={handlePlaceOrder}
                icon={<FaCheck />}
                style={{ background: '#c41e3a', borderColor: '#c41e3a', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                Place Order
              </Button>
            )}
          </div>
        </Col>

        {/* Pricing calculations section */}
        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Wallet Info Panel */}
            <WalletSection 
              walletBalance={walletBalance}
              totalAmount={totalAmount - discountAmount}
            />

            {/* Coupons Applying Panel */}
            {currentStep < 2 && (
              <CouponSection
                availableCoupons={coupons}
                appliedCouponCode={appliedCoupon}
                onApply={handleApplyCoupon}
                onRemove={handleRemoveCoupon}
                loading={applyCouponMutation.isPending}
              />
            )}

            {/* Total breakdown block */}
            <PriceBreakdown
              subtotal={subtotal}
              shippingCharge={shippingCharge}
              discountAmount={discountAmount}
              totalAmount={totalAmount}
            />
          </Space>
        </Col>
      </Row>

      {/* Address Form modal */}
      <AddressForm
        visible={addressModalVisible}
        initialValues={editingAddress}
        onSubmit={handleAddressSubmit}
        onCancel={() => { setAddressModalVisible(false); setEditingAddress(null); }}
        loading={addressSubmitting}
      />
    </div>
  );
};

export default Checkout;
