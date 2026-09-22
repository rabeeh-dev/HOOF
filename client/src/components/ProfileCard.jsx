import React from 'react';
import { Card, Avatar, Typography, Button, Space } from 'antd';
import { FaUser, FaEnvelope, FaPhone, FaCalendarAlt, FaEdit } from 'react-icons/fa';

const { Title, Text } = Typography;

const ProfileCard = ({ user = {}, onEdit }) => {
  const formattedDob = user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }) : 'Not provided';

  return (
    <Card 
      style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.02)', textAlign: 'center' }}
      extra={
        <Button type="text" icon={<FaEdit />} onClick={onEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Edit Profile
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Avatar 
          size={80} 
          icon={<FaUser />} 
          style={{ backgroundColor: '#c41e3a' }} 
        />
        
        <div>
          <Title level={3} style={{ margin: '0 0 4px 0' }}>{user.fullName}</Title>
          <Text type="secondary">{user.email}</Text>
        </div>

        <div style={{ textAlign: 'left', marginTop: 15, background: '#f5f5f5', padding: '16px', borderRadius: 8 }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <FaEnvelope style={{ color: '#888' }} />
              <Text><strong>Email:</strong> {user.email}</Text>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <FaPhone style={{ color: '#888' }} />
              <Text><strong>Mobile:</strong> {user.phoneNumber || 'Not provided'}</Text>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <FaCalendarAlt style={{ color: '#888' }} />
              <Text><strong>Birthdate:</strong> {formattedDob}</Text>
            </div>
          </Space>
        </div>
      </Space>
    </Card>
  );
};

export default ProfileCard;
