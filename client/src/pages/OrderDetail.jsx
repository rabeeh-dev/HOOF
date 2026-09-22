import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, Button, Row, Col, Typography, Spin, Space, Divider, Popconfirm, Input, Modal, Rate, message } from 'antd';
import { FaArrowLeft, FaUndo, FaTimesCircle, FaCommentAlt } from 'react-icons/fa';
import api from '../api/axios';
import { reviewsService } from '../api/reviews';
import OrderTimeline from '../components/OrderTimeline';
import InvoiceButton from '../components/InvoiceButton';
import ReviewModal from '../components/ReviewModal';

const { Title, Text, Paragraph } = Typography;

const getImageUrl = (image) => {
  if (!image) return 'https://via.placeholder.com/80x80?text=HOOF';
  if (image.startsWith('http')) return image;
  const cleanPath = image.startsWith('/') ? image : `/${image}`;
  return `http://localhost:8080${cleanPath}`;
};

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [returnReason, setReturnReason] = useState('');
  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  // Review modal states
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [editingReview, setEditingReview] = useState(null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Query order details
  const { data, isLoading, isError } = useQuery({
    queryKey: ['order-details', id],
    queryFn: async () => {
      const res = await api.get(`/user/orders/${id}`);
      return res.data?.order || null;
    },
    enabled: !!id
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: async () => api.put(`/user/orders/cancel/${id}`),
    onSuccess: (res) => {
      if (res.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['order-details', id] });
        queryClient.invalidateQueries({ queryKey: ['orders-history'] });
        queryClient.invalidateQueries({ queryKey: ['wallet-details'] });
        message.success(res.data.message || 'Order cancelled successfully.');
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to cancel order.');
    }
  });

  // Return order mutation
  const returnOrderMutation = useMutation({
    mutationFn: async (reason) => api.put(`/user/orders/return/${id}`, { reason }),
    onSuccess: (res) => {
      if (res.data?.success) {
        queryClient.invalidateQueries({ queryKey: ['order-details', id] });
        queryClient.invalidateQueries({ queryKey: ['orders-history'] });
        message.success(res.data.message || 'Return request submitted.');
        setReturnModalVisible(false);
        setReturnReason('');
      }
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to submit return request.');
    }
  });

  // Save/Edit Review Mutation
  const saveReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      if (editingReview) {
        return reviewsService.editReview(editingReview._id, reviewData);
      } else {
        return reviewsService.addReview(reviewProduct._id, reviewData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-details', id] });
      message.success(editingReview ? 'Review updated!' : 'Review submitted successfully!');
      setReviewModalVisible(false);
      setEditingReview(null);
      setReviewProduct(null);
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to submit review.');
    }
  });

  // Delete Review Mutation
  const deleteReviewMutation = useMutation({
    mutationFn: reviewsService.deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order-details', id] });
      message.success('Review deleted.');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to delete review.');
    }
  });

  const handleReturnSubmit = () => {
    if (!returnReason.trim()) {
      return message.warning('Please input your reason for return.');
    }
    setReturnSubmitting(true);
    returnOrderMutation.mutate(returnReason, {
      onSettled: () => setReturnSubmitting(false)
    });
  };

  const handleReviewSubmit = (reviewData) => {
    setReviewSubmitting(true);
    saveReviewMutation.mutate(reviewData, {
      onSettled: () => setReviewSubmitting(false)
    });
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', minHeight: 400, alignItems: 'center', justifyContent: 'center' }}>
        <Spin size="large" tip="Loading order specifications..." />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Title level={3} type="danger">Order details not found</Title>
        <Button type="primary" onClick={() => navigate('/orders')} style={{ background: '#c41e3a', borderColor: '#c41e3a', marginTop: 15 }}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const order = data;
  const isCancellable = ["PLACED", "CONFIRMED", "Pending", "Processing"].includes(order.status);
  const isReturnable = order.status === "DELIVERED";
  const isInvoiceAvailable = ['delivered', 'return requested', 'return approved', 'picked up', 'returned'].includes(order.status.toLowerCase());

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <Title level={2} style={{ margin: 0 }}>Order Details</Title>
          <Text type="secondary">Order ID: #{order._id}</Text>
        </div>
        <Button type="link" icon={<FaArrowLeft />} onClick={() => navigate('/orders')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          Back to Orders
        </Button>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Status Timeline Progress */}
        <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.01)', marginBottom: 24 }}>
          <OrderTimeline status={order.status} statusHistory={order.statusHistory} />
        </Card>

        {/* Shipping Address and Payment selection details */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          <Col xs={24} md={12}>
            <Card title="Delivery Information" style={{ borderRadius: 12, height: '100%' }}>
              {order.shippingAddress ? (
                <Paragraph style={{ margin: 0, fontSize: '13px', color: '#555' }}>
                  <strong>{order.shippingAddress.fullName}</strong><br />
                  {order.shippingAddress.houseName},<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}<br />
                  Phone: {order.shippingAddress.mobile}
                </Paragraph>
              ) : (
                <Text type="secondary">Address details unavailable</Text>
              )}
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="Payment & Bill Summary" style={{ borderRadius: 12, height: '100%' }}>
              <div style={{ marginBottom: 12, fontSize: '13px' }}>
                <strong>Method:</strong> {order.paymentMethod?.toUpperCase()} ({order.paymentStatus})
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '12px' }}>
                <Text type="secondary">Subtotal</Text>
                <Text>₹{(order.totalAmount + order.discountAmount).toLocaleString('en-IN')}</Text>
              </div>
              {order.discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '12px' }}>
                  <Text type="secondary">Discount Applied</Text>
                  <Text style={{ color: '#52c41a' }}>- ₹{order.discountAmount.toLocaleString('en-IN')}</Text>
                </div>
              )}
              <Divider style={{ margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '14px' }}>
                <Text>Total Paid</Text>
                <Text style={{ color: '#c41e3a' }}>₹{order.totalAmount.toLocaleString('en-IN')}</Text>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Ordered items listing */}
        <Card title="Items Purchased" style={{ borderRadius: 12, marginBottom: 24 }}>
          {order.items && order.items.map((item, idx) => {
            const product = item.product;
            return (
              <div key={idx}>
                {idx > 0 && <Divider style={{ margin: '15px 0' }} />}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
                  <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                    <img 
                      src={getImageUrl(product?.productImage && product.productImage[0])} 
                      alt={item.productName} 
                      style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 6, background: '#f5f5f5' }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/70x70?text=HOOF'; }}
                    />
                    <div>
                      <Text strong style={{ fontSize: '14px', display: 'block' }}>{item.productName}</Text>
                      <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>Size: UK {item.size} | Qty: {item.quantity}</Text>
                      <Tag color="orange" style={{ marginTop: 4 }}>{item.itemStatus}</Tag>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ display: 'block', fontSize: '14px' }}>₹{item.priceAtPurchase.toLocaleString('en-IN')}</Text>
                    
                    {/* Reviews Action block (only if order status is Delivered) */}
                    {order.status === 'DELIVERED' && (
                      <div style={{ marginTop: 8 }}>
                        {item.hasReviewed ? (
                          <Space size="small">
                            <Button 
                              type="link" 
                              size="small" 
                              onClick={() => { setEditingReview(item.review); setReviewModalVisible(true); }}
                              style={{ padding: 0 }}
                            >
                              Edit Review
                            </Button>
                            <span style={{ color: '#d9d9d9' }}>|</span>
                            <Popconfirm
                              title="Delete review?"
                              onConfirm={() => deleteReviewMutation.mutate(item.review._id)}
                            >
                              <Button type="link" danger size="small" style={{ padding: 0 }}>
                                Delete
                              </Button>
                            </Popconfirm>
                          </Space>
                        ) : (
                          <Button 
                            type="dashed" 
                            size="small" 
                            icon={<FaCommentAlt />}
                            onClick={() => { setReviewProduct(product); setEditingReview(null); setReviewModalVisible(true); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            Review Product
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        {/* Global Order Actions buttons (Cancel/Return/Invoice) */}
        <Card style={{ borderRadius: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              {isInvoiceAvailable && (
                <InvoiceButton orderId={order._id} />
              )}
            </div>

            <Space>
              {isCancellable && (
                <Popconfirm
                  title="Cancel this order?"
                  description="Are you sure you want to cancel this order? Any payments will be refunded to your wallet."
                  onConfirm={() => cancelOrderMutation.mutate()}
                  okText="Yes"
                  cancelText="No"
                >
                  <Button 
                    type="primary" 
                    danger 
                    icon={<FaTimesCircle />} 
                    loading={cancelOrderMutation.isPending}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    Cancel Order
                  </Button>
                </Popconfirm>
              )}

              {isReturnable && (
                <Button 
                  type="primary" 
                  icon={<FaUndo />}
                  onClick={() => setReturnModalVisible(true)}
                  style={{ background: '#fa8c16', borderColor: '#fa8c16', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  Return Order
                </Button>
              )}
            </Space>
          </div>
        </Card>
      </div>

      {/* Return Order Modal */}
      <Modal
        open={returnModalVisible}
        title="Request Order Return"
        onCancel={() => { setReturnModalVisible(false); setReturnReason(''); }}
        onOk={handleReturnSubmit}
        confirmLoading={returnSubmitting}
        okText="Submit Request"
      >
        <Paragraph style={{ marginTop: 15 }}>Please describe the reason for returning this order:</Paragraph>
        <Input.TextArea 
          rows={4} 
          placeholder="e.g. Size didn't fit, color mismatched, etc." 
          value={returnReason}
          onChange={(e) => setReturnReason(e.target.value)}
        />
      </Modal>

      {/* Review Modal popup */}
      <ReviewModal
        visible={reviewModalVisible}
        initialValues={editingReview}
        onSubmit={handleReviewSubmit}
        onCancel={() => { setReviewModalVisible(false); setEditingReview(null); setReviewProduct(null); }}
        submitting={reviewSubmitting}
      />
    </div>
  );
};

export default OrderDetail;
