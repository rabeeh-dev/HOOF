import React from 'react';
import { Card, Button, Radio, Row, Col, Space, Typography, Popconfirm } from 'antd';
import { FaPlus, FaTrash, FaEdit } from 'react-icons/fa';

const { Text, Paragraph } = Typography;

const AddressSelector = ({ 
  addresses = [], 
  selectedAddressId = null, 
  onSelect, 
  onAdd, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div>
      <Row gutter={[16, 16]}>
        {addresses.map((address) => {
          const isSelected = selectedAddressId === address._id;
          return (
            <Col xs={24} sm={12} key={address._id}>
              <Card
                hoverable
                style={{ 
                  borderColor: isSelected ? '#c41e3a' : '#d9d9d9',
                  background: isSelected ? '#fff0f1' : '#fff',
                  borderRadius: 8,
                  height: '100%'
                }}
                bodyStyle={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                onClick={() => onSelect(address._id)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Radio checked={isSelected} style={{ color: isSelected ? '#c41e3a' : 'inherit', fontWeight: 'bold' }}>
                      {address.fullName}
                    </Radio>
                    <Text type="secondary" style={{ fontSize: '12px', textTransform: 'uppercase', background: '#f5f5f5', padding: '2px 8px', borderRadius: 4 }}>
                      {address.addressType}
                    </Text>
                  </div>
                  
                  <Paragraph style={{ margin: 0, minHeight: 60, fontSize: '13px', color: '#555' }}>
                    {address.houseName},<br />
                    {address.city}, {address.state} - <strong>{address.pincode}</strong>
                  </Paragraph>
                  <Paragraph style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                    Phone: {address.mobile}
                  </Paragraph>
                  {address.isDefault && (
                    <Text type="danger" style={{ fontSize: '11px', display: 'block', marginTop: 4, fontWeight: 'bold' }}>
                      [Default Address]
                    </Text>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
                  <Button 
                    type="text" 
                    icon={<FaEdit />} 
                    onClick={(e) => { e.stopPropagation(); onEdit(address); }} 
                    size="small"
                  >
                    Edit
                  </Button>
                  <Popconfirm
                    title="Delete address?"
                    description="Are you sure you want to remove this address?"
                    onConfirm={(e) => { e.stopPropagation(); onDelete(address._id); }}
                    onCancel={(e) => e.stopPropagation()}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button 
                      type="text" 
                      danger 
                      icon={<FaTrash />} 
                      onClick={(e) => e.stopPropagation()} 
                      size="small"
                    >
                      Delete
                    </Button>
                  </Popconfirm>
                </div>
              </Card>
            </Col>
          );
        })}

        {/* Add Address Card */}
        <Col xs={24} sm={12}>
          <Card
            hoverable
            style={{ 
              borderStyle: 'dashed', 
              borderColor: '#d9d9d9', 
              borderRadius: 8,
              height: '100%',
              minHeight: 180,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center'
            }}
            onClick={onAdd}
          >
            <Space direction="vertical" align="center">
              <FaPlus style={{ fontSize: '24px', color: '#888' }} />
              <Text strong style={{ color: '#555' }}>Add New Address</Text>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AddressSelector;
