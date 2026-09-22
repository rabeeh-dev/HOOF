import React, { useState } from 'react';
import { Typography, Card, Table, Alert, Spin, Row, Col } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { FaBox, FaCheckCircle, FaMoneyBillWave, FaChartPie } from 'react-icons/fa';
import { adminService } from '../../api/admin';
import ReportFilters from '../../components/admin/ReportFilters';
import SummaryCards from '../../components/admin/SummaryCards';
import ExportButtons from '../../components/admin/ExportButtons';
import TopProductsChart from '../../components/admin/TopProductsChart';
import api from '../../api/axios';

const { Title } = Typography;

const ProductReportPage = () => {
  const [filterParams, setFilterParams] = useState({ filter: 'daily' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['product-report', filterParams],
    queryFn: async () => {
      const res = await adminService.getProductReport(filterParams);
      return res.data;
    }
  });

  const downloadFile = async (url, filename) => {
    try {
      const response = await api.get(url, { params: filterParams, responseType: 'blob' });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const handleExportPdf = () => downloadFile('/admin/reports/products/export/pdf', `product-report-${Date.now()}.pdf`);
  const handleExportExcel = () => downloadFile('/admin/reports/products/export/excel', `product-report-${Date.now()}.xlsx`);

  const summaryItems = data?.summary ? [
    { title: 'Total Products', value: data.summary.totalProducts, color: '#1890ff', icon: <FaBox /> },
    { title: 'Active Products', value: data.summary.activeProducts, color: '#52c41a', icon: <FaCheckCircle /> },
    { title: 'Units Sold', value: data.summary.unitsSold, color: '#722ed1', icon: <FaChartPie /> },
    { title: 'Product Revenue', value: data.summary.productRevenue, prefix: '₹', precision: 2, color: '#27ae60', icon: <FaMoneyBillWave /> },
  ] : [];

  const columns = [
    { title: 'Product Name', dataIndex: 'name' },
    { title: 'Category', dataIndex: 'category' },
    { title: 'Units Sold', dataIndex: 'totalSold' },
    { title: 'Revenue (₹)', dataIndex: 'totalRevenue', render: (v) => v.toFixed(2) },
  ];

  if (isError) return <Alert message="Failed to load product report" type="error" />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Product Report</Title>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <ReportFilters onFilterChange={setFilterParams} />
          <ExportButtons onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} />
        </div>
      </div>

      {isLoading ? (
        <Spin size="large" />
      ) : (
        <>
          <SummaryCards items={summaryItems} />
          <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
            <Col span={24}>
              <Card title="Top Selling Products Chart" bordered={false}>
                <TopProductsChart products={data?.products || []} />
              </Card>
            </Col>
          </Row>
          <Card title="Product Sales Details" bordered={false}>
            <Table 
              dataSource={data?.products || []} 
              columns={columns} 
              rowKey="_id"
              scroll={{ x: 600 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default ProductReportPage;
