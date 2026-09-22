import React from 'react';
import { Card, Typography, Switch, Form, Space, Button } from 'antd';

const { Title, Paragraph } = Typography;

const Settings = () => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>System Settings</Title>
      
      <Card title="General Configurations" style={{ borderRadius: 8 }}>
        <Form layout="vertical">
          <Form.Item label="Maintenance Mode" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item label="Enable Wallet Payments" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Form.Item label="Allow Referral System" valuePropName="checked">
            <Switch defaultChecked />
          </Form.Item>
          <Button type="primary" style={{ background: '#001529', borderColor: '#001529' }}>
            Save Settings
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default Settings;
