import React, { useState } from 'react';
import { Typography, Card, Table, Alert, Spin } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../api/admin';
import ReportFilters from '../../components/admin/ReportFilters';
import RevenueCards from '../../components/admin/RevenueCards';
import ExportButtons from '../../components/admin/ExportButtons';
import api from '../../api/axios';

const { Title } = Typography;

const SalesReportPage = () => {
  const [filterParams, setFilterParams] = useState({ filter: 'daily' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['sales-report', filterParams],
    queryFn: async () => {
      const res = await adminService.getSalesReport(filterParams);
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

  const handleExportPdf = () => downloadFile('/admin/reports/sales/export/pdf', `sales-report-${Date.now()}.pdf`);
  const handleExportExcel = () => downloadFile('/admin/reports/sales/export/excel', `sales-report-${Date.now()}.xlsx`);

  const columns = [
    { title: 'Date', dataIndex: 'date', render: (val) => new Date(val).toLocaleString() },
    { title: 'Customer', dataIndex: 'customer' },
    { title: 'Payment', dataIndex: 'paymentMethod' },
    { title: 'Gross (₹)', dataIndex: 'gross', render: (v) => v.toFixed(2) },
    { title: 'Discount (₹)', dataIndex: 'discount', render: (v) => v.toFixed(2) },
    { title: 'Refund (₹)', dataIndex: 'refund', render: (v) => v.toFixed(2) },
    { title: 'Net (₹)', dataIndex: 'net', render: (v) => v.toFixed(2) },
    { title: 'Status', dataIndex: 'status' },
  ];

  if (isError) return <Alert message="Failed to load sales report" type="error" />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Sales Report</Title>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <ReportFilters onFilterChange={setFilterParams} />
          <ExportButtons onExportPdf={handleExportPdf} onExportExcel={handleExportExcel} />
        </div>
      </div>

      {isLoading ? (
        <Spin size="large" />
      ) : (
        <>
          <RevenueCards summary={data?.summary || {}} />
          <Card title="Sales Details" bordered={false}>
            <Table 
              dataSource={data?.rows || []} 
              columns={columns} 
              rowKey="_id"
              scroll={{ x: 800 }}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default SalesReportPage;
