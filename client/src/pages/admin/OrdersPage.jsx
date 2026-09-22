import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, Col, Input, message, Row, Select, Space, Typography } from 'antd';
import { adminService } from '../../api/admin';
import OrderDetailsDrawer from '../../components/admin/OrderDetailsDrawer';
import OrdersTable from '../../components/admin/OrdersTable';
import RefundModal from '../../components/admin/RefundModal';

const { Title, Text } = Typography;

const ORDER_FILTERS = [
  'Pending',
  'Processing',
  'SHIPPED',
  'Out for Delivery',
  'DELIVERED',
  'CANCELLED',
  'Return Requested',
  'Return Approved',
  'Picked Up',
  'Returned'
];

const PAYMENT_FILTERS = ['COD', 'Razorpay', 'Wallet', 'upi'];
const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;

const OrdersPage = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState();
  const [payment, setPayment] = useState();
  const [paymentStatus, setPaymentStatus] = useState();
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('descend');
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [refundOrder, setRefundOrder] = useState(null);

  const queryParams = { page, limit: pageSize, search, status, payment, paymentStatus, sortBy, sortOrder };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', queryParams],
    queryFn: async () => {
      const res = await adminService.getOrders(queryParams);
      return res.data;
    }
  });

  const { data: orderData, isFetching: isOrderFetching } = useQuery({
    queryKey: ['admin-order', selectedOrderId],
    enabled: !!selectedOrderId,
    queryFn: async () => {
      const res = await adminService.getOrder(selectedOrderId);
      return res.data.order;
    }
  });

  const refreshOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    queryClient.invalidateQueries({ queryKey: ['admin-order', selectedOrderId] });
  };

  const orderStatusMutation = useMutation({
    mutationFn: ({ id, status: nextStatus }) => adminService.updateOrderStatus(id, { status: nextStatus }),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Order status updated');
      refreshOrders();
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update order status')
  });

  const paymentStatusMutation = useMutation({
    mutationFn: ({ id, paymentStatus: nextStatus }) => adminService.updatePaymentStatus(id, { paymentStatus: nextStatus }),
    onSuccess: (res) => {
      message.success(res.data?.message || 'Payment status updated');
      refreshOrders();
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to update payment status')
  });

  const refundMutation = useMutation({
    mutationFn: ({ order, mode, itemId }) => {
      if (mode === 'item') return adminService.updateOrderItemStatus(order._id, itemId, { status: 'Returned' });
      return adminService.cancelOrder(order._id);
    },
    onSuccess: (res) => {
      message.success(res.data?.message || 'Refund workflow completed');
      setRefundOrder(null);
      refreshOrders();
    },
    onError: (err) => message.error(err.response?.data?.message || 'Refund workflow failed')
  });

  const stats = data?.stats || {};

  return (
    <div>
      <Title level={2} style={{ marginTop: 0 }}>Order Management</Title>

      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} md={6}><Card><Text type="secondary">Orders</Text><Title level={4}>{stats.total || 0}</Title></Card></Col>
        <Col xs={12} md={6}><Card><Text type="secondary">Processing</Text><Title level={4}>{stats.processing || 0}</Title></Card></Col>
        <Col xs={12} md={6}><Card><Text type="secondary">Delivered</Text><Title level={4}>{stats.delivered || 0}</Title></Card></Col>
        <Col xs={12} md={6}><Card><Text type="secondary">Revenue</Text><Title level={4}>{formatMoney(stats.totalRevenue)}</Title></Card></Col>
      </Row>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          value={search}
          onChange={(event) => { setSearch(event.target.value); setPage(1); }}
          placeholder="Search order, customer, email"
          style={{ width: 280 }}
        />
        <Select
          allowClear
          value={status}
          onChange={(value) => { setStatus(value); setPage(1); }}
          placeholder="Order status"
          options={ORDER_FILTERS.map((value) => ({ value, label: value }))}
          style={{ width: 180 }}
        />
        <Select
          allowClear
          value={payment}
          onChange={(value) => { setPayment(value); setPage(1); }}
          placeholder="Payment method"
          options={PAYMENT_FILTERS.map((value) => ({ value, label: value }))}
          style={{ width: 170 }}
        />
        <Select
          allowClear
          value={paymentStatus}
          onChange={(value) => { setPaymentStatus(value); setPage(1); }}
          placeholder="Payment status"
          options={['Pending', 'SUCCESS', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'].map((value) => ({ value, label: value }))}
          style={{ width: 190 }}
        />
      </Space>

      <OrdersTable
        orders={data?.orders || []}
        loading={isLoading}
        currentPage={data?.pagination?.currentPage || page}
        totalOrders={data?.pagination?.totalOrders || 0}
        pageSize={pageSize}
        onPageChange={setPage}
        onSortChange={(field, order) => {
          setSortBy(field);
          setSortOrder(order || 'descend');
        }}
        onView={(order) => setSelectedOrderId(order._id)}
        onRefund={setRefundOrder}
      />

      <OrderDetailsDrawer
        open={!!selectedOrderId}
        order={orderData}
        loading={isOrderFetching || orderStatusMutation.isPending || paymentStatusMutation.isPending}
        onClose={() => setSelectedOrderId(null)}
        onOrderStatusChange={(nextStatus) => orderStatusMutation.mutate({ id: selectedOrderId, status: nextStatus })}
        onPaymentStatusChange={(nextStatus) => paymentStatusMutation.mutate({ id: selectedOrderId, paymentStatus: nextStatus })}
        onRefund={setRefundOrder}
      />

      <RefundModal
        open={!!refundOrder}
        order={refundOrder}
        loading={refundMutation.isPending}
        onCancel={() => setRefundOrder(null)}
        onConfirm={({ mode, itemId }) => refundMutation.mutate({ order: refundOrder, mode, itemId })}
      />
    </div>
  );
};

export default OrdersPage;
