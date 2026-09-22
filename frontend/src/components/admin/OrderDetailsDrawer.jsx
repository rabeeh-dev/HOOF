import React from 'react';
import { Button, Descriptions, Divider, Drawer, List, Space, Tag, Typography } from 'antd';
import { Link } from 'react-router-dom';
import OrderTimeline from './OrderTimeline';
import PaymentBadge from './PaymentBadge';
import StatusSelector from './StatusSelector';

const { Text, Title } = Typography;

const formatMoney = (amount = 0) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const shortOrderId = (id = '') => `#${String(id).slice(-8).toUpperCase()}`;

const OrderDetailsDrawer = ({
  open,
  order,
  loading,
  onClose,
  onOrderStatusChange,
  onPaymentStatusChange,
  onRefund
}) => (
  <Drawer
    title={order ? `Order ${shortOrderId(order._id)}` : 'Order details'}
    width={680}
    open={open}
    onClose={onClose}
    extra={order && <Link to={`/admin/orders/${order._id}`}>Open page</Link>}
  >
    {!order ? null : (
      <>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label="Customer">{order.userId?.fullName || order.shippingAddress?.fullName}</Descriptions.Item>
            <Descriptions.Item label="Email">{order.userId?.email || 'Not available'}</Descriptions.Item>
            <Descriptions.Item label="Payment">
              <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
            </Descriptions.Item>
            <Descriptions.Item label="Total">{formatMoney(order.totalAmount)}</Descriptions.Item>
            <Descriptions.Item label="Address">
              {[
                order.shippingAddress?.street,
                order.shippingAddress?.city,
                order.shippingAddress?.state,
                order.shippingAddress?.zip,
                order.shippingAddress?.country
              ].filter(Boolean).join(', ')}
            </Descriptions.Item>
          </Descriptions>

          <Space wrap>
            <StatusSelector
              value={order.status}
              onChange={(status) => onOrderStatusChange?.(status)}
              loading={loading}
            />
            <StatusSelector
              type="payment"
              value={order.paymentStatus}
              onChange={(paymentStatus) => onPaymentStatusChange?.(paymentStatus)}
              loading={loading}
            />
            <Button danger onClick={() => onRefund?.(order)} disabled={['CANCELLED', 'Returned'].includes(order.status)}>
              Refund
            </Button>
          </Space>
        </Space>

        <Divider />
        <Title level={5}>Items</Title>
        <List
          dataSource={order.items || []}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                title={<span>{item.productName} <Tag>{item.itemStatus || 'Active'}</Tag></span>}
                description={`Size ${item.variantSize || '-'} · Qty ${item.quantity}`}
              />
              <Text strong>{formatMoney((item.priceAtPurchase || 0) * (item.quantity || 0))}</Text>
            </List.Item>
          )}
        />

        <Divider />
        <Title level={5}>Timeline</Title>
        <OrderTimeline history={order.statusHistory || []} />
      </>
    )}
  </Drawer>
);

export default OrderDetailsDrawer;
