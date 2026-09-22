import React from 'react';
import { Card, Button, Typography, Popconfirm, Tag } from 'antd';
import { FaTrash, FaEdit } from 'react-icons/fa';

const { Paragraph, Text } = Typography;

const AddressCard = ({ address, onEdit, onDelete }) => {
  return (
    <Card
      style={{ borderRadius: 8, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.01)' }}
      bodyStyle={{ padding: '20px', height: '100%', width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>{address.fullName}</Text>
          <Tag color="blue">{address.addressType}</Tag>
        </div>
      }
    >
      <div>
        <Paragraph style={{ margin: 0, minHeight: 60, fontSize: '13px', color: '#555' }}>
          {address.houseName},<br />
          {address.city}, {address.state} - <strong>{address.pincode}</strong>
        </Paragraph>
        <Paragraph style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
          Phone: {address.mobile}
        </Paragraph>
        {address.isDefault && (
          <Tag color="red" style={{ marginTop: 8, fontWeight: 'bold' }}>Default Address</Tag>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
        <Button 
          type="text" 
          icon={<FaEdit />} 
          onClick={() => onEdit(address)} 
          size="small"
        >
          Edit
        </Button>
        <Popconfirm
          title="Delete address?"
          description="Are you sure you want to remove this address?"
          onConfirm={() => onDelete(address._id)}
          okText="Yes"
          cancelText="No"
        >
          <Button 
            type="text" 
            danger 
            icon={<FaTrash />} 
            size="small"
          >
            Delete
          </Button>
        </Popconfirm>
      </div>
    </Card>
  );
};

export default AddressCard;
