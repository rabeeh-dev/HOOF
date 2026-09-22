import React from 'react';
import { Modal, Typography } from 'antd';

const { Paragraph } = Typography;

const ConfirmDeleteModal = ({ visible = false, title = 'Confirm Delete', description = '', onConfirm, onCancel, loading = false }) => {
  return (
    <Modal
      open={visible}
      title={title}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Delete"
      okButtonProps={{ danger: true }}
      cancelText="Cancel"
    >
      <Paragraph style={{ marginTop: 12 }}>{description}</Paragraph>
    </Modal>
  );
};

export default ConfirmDeleteModal;
