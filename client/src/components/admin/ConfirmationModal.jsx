import React from 'react';
import { Modal, Typography } from 'antd';

const { Text } = Typography;

const ConfirmationModal = ({
  open,
  title = 'Confirm action',
  description,
  confirmText = 'Confirm',
  danger = false,
  loading = false,
  onConfirm,
  onCancel
}) => (
  <Modal
    title={title}
    open={open}
    okText={confirmText}
    okButtonProps={{ danger }}
    confirmLoading={loading}
    onOk={onConfirm}
    onCancel={onCancel}
  >
    <Text>{description}</Text>
  </Modal>
);

export default ConfirmationModal;
