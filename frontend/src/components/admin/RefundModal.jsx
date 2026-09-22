import React, { useMemo, useState } from 'react';
import { Alert, Modal, Radio, Select, Space, Typography } from 'antd';

const { Text } = Typography;

const RefundModal = ({ open, order, loading, onCancel, onConfirm }) => {
  const refundableItems = useMemo(
    () => (order?.items || []).filter((item) => ['Return Requested', 'Return Approved', 'Picked Up'].includes(item.itemStatus)),
    [order]
  );
  const [mode, setMode] = useState('order');
  const [itemId, setItemId] = useState();

  const itemOptions = refundableItems.map((item) => ({
    value: item._id,
    label: `${item.productName} · ${item.itemStatus}`
  }));

  return (
    <Modal
      title="Trigger Refund"
      open={open}
      confirmLoading={loading}
      okText="Confirm"
      onCancel={onCancel}
      onOk={() => onConfirm?.({ mode, itemId })}
      okButtonProps={{ disabled: mode === 'item' && !itemId }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type="warning"
          showIcon
          message="Refunds use the existing backend cancellation and return workflows. Wallet credits, stock restoration, and totals are handled by the server."
        />
        <Radio.Group value={mode} onChange={(event) => setMode(event.target.value)}>
          <Radio value="order">Cancel and refund eligible order</Radio>
          <Radio value="item" disabled={!itemOptions.length}>Mark returned item as refunded</Radio>
        </Radio.Group>
        {mode === 'item' && (
          <Select
            value={itemId}
            options={itemOptions}
            onChange={setItemId}
            placeholder="Select return item"
            style={{ width: '100%' }}
          />
        )}
        <Text type="secondary">
          Order {order?._id ? `#${String(order._id).slice(-8).toUpperCase()}` : ''}
        </Text>
      </Space>
    </Modal>
  );
};

export default RefundModal;
