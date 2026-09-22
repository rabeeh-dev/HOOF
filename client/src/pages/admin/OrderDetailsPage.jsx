import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Descriptions, Divider, List, message, Row, Space, Spin, Typography } from 'antd';
import { adminService } from '../../api/admin';
import OrderTimeline from '../../components/admin/OrderTimeline';
import PaymentBadge from '../../components/admin/PaymentBadge';
import RefundModal from '../../components/admin/RefundModal';
import StatusSelector from '../../components/admin/StatusSelector';

const { Title, Text } = Typography;
const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const OrderDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [refundOpen, setRefundOpen] = useState(false);

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const res = await adminService.getOrder(id);
      return res.data.order;
    }
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-order', id] });

  const statusMutation = useMutation({
    mutationFn: (status) => adminService.updateOrderStatus(id, { status }),
    onSuccess: (res) => { message.success(res.data?.message || 'Order status updated'); refresh(); },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update order status')
  });

  const paymentMutation = useMutation({
    mutationFn: (paymentStatus) => adminService.updatePaymentStatus(id, { paymentStatus }),
    onSuccess: (res) => { message.success(res.data?.message || 'Payment status updated'); refresh(); },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update payment status')
  });

  const itemMutation = useMutation({
    mutationFn: ({ itemId, status }) => adminService.updateOrderItemStatus(id, itemId, { status }),
    onSuccess: (res) => { message.success(res.data?.message || 'Item status updated'); refresh(); },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update item status')
  });

  const refundMutation = useMutation({
    mutationFn: ({ mode, itemId }) => {
      if (mode === 'item') return adminService.updateOrderItemStatus(id, itemId, { status: 'Returned' });
      return adminService.cancelOrder(id);
    },
    onSuccess: (res) => {
      message.success(res.data?.message || 'Refund workflow completed');
      setRefundOpen(false);
      refresh();
    },
    onError: (err) => message.error(err.response?.data?.message || 'Refund workflow failed')
  });

  if (isLoading) return <Spin />;
  if (!order) return <Text>Order not found.</Text>;

  return (
    <div>
      <Space style={{ justifyContent: 'space-between', width: '100%', marginBottom: 16 }} wrap>
        <Title level={2} style={{ margin: 0 }}>Order #{String(order._id).slice(-8).toUpperCase()}</Title>
        <Space wrap>
          <Button onClick={() => navigate('/admin/orders')}>Back</Button>
          <Button danger disabled={['CANCELLED', 'Returned'].includes(order.status)} onClick={() => setRefundOpen(true)}>
            Refund
          </Button>
        </Space>
      </Space>

      <Descriptions bordered column={{ xs: 1, md: 2 }}>
        <Descriptions.Item label="Customer">{order.userId?.fullName || order.shippingAddress?.fullName}</Descriptions.Item>
        <Descriptions.Item label="Email">{order.userId?.email || '-'}</Descriptions.Item>
        <Descriptions.Item label="Payment"><PaymentBadge method={order.paymentMethod} status={order.paymentStatus} /></Descriptions.Item>
        <Descriptions.Item label="Total">{formatMoney(order.totalAmount)}</Descriptions.Item>
        <Descriptions.Item label="Order Status">
          <StatusSelector value={order.status} onChange={(value) => statusMutation.mutate(value)} loading={statusMutation.isPending} />
        </Descriptions.Item>
        <Descriptions.Item label="Payment Status">
          <StatusSelector type="payment" value={order.paymentStatus} onChange={(value) => paymentMutation.mutate(value)} loading={paymentMutation.isPending} />
        </Descriptions.Item>
        <Descriptions.Item label="Shipping Address" span={2}>
          {[
            order.shippingAddress?.street,
            order.shippingAddress?.city,
            order.shippingAddress?.state,
            order.shippingAddress?.zip,
            order.shippingAddress?.country
          ].filter(Boolean).join(', ')}
        </Descriptions.Item>
      </Descriptions>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={14}>
          <Title level={4}>Items</Title>
          <List
            bordered
            dataSource={order.items || []}
            renderItem={(item) => (
              <List.Item
                actions={['Return Requested', 'Return Approved', 'Picked Up'].includes(item.itemStatus) ? [
                  <StatusSelector
                    key="item-status"
                    type="item"
                    value={item.itemStatus}
                    onChange={(status) => itemMutation.mutate({ itemId: item._id, status })}
                    style={{ minWidth: 160 }}
                  />
                ] : []}
              >
                <List.Item.Meta
                  title={item.productName}
                  description={`Size ${item.variantSize || '-'} · Qty ${item.quantity} · ${item.itemStatus || 'Active'}`}
                />
                <Text strong>{formatMoney((item.priceAtPurchase || 0) * (item.quantity || 0))}</Text>
              </List.Item>
            )}
          />
        </Col>
        <Col xs={24} lg={10}>
          <Title level={4}>Timeline</Title>
          <OrderTimeline history={order.statusHistory || []} />
        </Col>
      </Row>

      <Divider />
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label="Subtotal">{formatMoney(order.subtotal)}</Descriptions.Item>
        <Descriptions.Item label="Shipping">{formatMoney(order.shippingCharge)}</Descriptions.Item>
        <Descriptions.Item label="Discount">{formatMoney(order.discountAmount)}</Descriptions.Item>
        <Descriptions.Item label="Coupon">{order.couponCode || '-'}</Descriptions.Item>
      </Descriptions>

      <RefundModal
        open={refundOpen}
        order={order}
        loading={refundMutation.isPending}
        onCancel={() => setRefundOpen(false)}
        onConfirm={(payload) => refundMutation.mutate(payload)}
      />
    </div>
  );
};

export default OrderDetailsPage;
