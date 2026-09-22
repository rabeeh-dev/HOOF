import React from 'react';
import { Typography, Card, Button, Space, Row, Col } from 'antd';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';

const { Title, Paragraph } = Typography;

const Reports = () => {
  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Business Reports</Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Sales PDF Generator">
            <Paragraph>Download comprehensive sales summaries containing gross revenues, applied coupons, and order timelines.</Paragraph>
            <Space>
              <Button type="primary" danger icon={<FaFilePdf />} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                Generate PDF Report
              </Button>
            </Space>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card title="Sales Excel Spreadsheet">
            <Paragraph>Export clean raw rows of complete orders, items bought, customer logs, and delivery dates to XLSX format.</Paragraph>
            <Space>
              <Button type="primary" icon={<FaFileExcel />} style={{ background: '#27ae60', borderColor: '#27ae60', display: 'flex', alignItems: 'center', gap: 6 }}>
                Export Excel Sheet
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
