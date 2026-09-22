import React, { useState } from 'react';
import { Typography, Card, Table, Alert, Spin, Tag } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { FaUsers, FaUserTimes, FaShoppingBag, FaWallet } from 'react-icons/fa';
import { adminService } from '../../api/admin';
import ReportFilters from '../../components/admin/ReportFilters';
import SummaryCards from '../../components/admin/SummaryCards';
import ExportButtons from '../../components/admin/ExportButtons';
import api from '../../api/axios';

const { Title } = Typography;

const CustomerReportPage = () => {
  const [filterParams, setFilterParams] = useState({ filter: 'daily' });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer-report', filterParams],
    queryFn: async () => {
      const res = await adminService.getCustomerReport(filterParams);
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

  const handleExportPdf = () => downloadFile('/admin/reports/customers/export/pdf', `customer-report-${Date.now()}.pdf`);
  const handleExportExcel = () => downloadFile('/admin/reports/customers/export/excel', `customer-report-${Date.now()}.xlsx`);

  const summaryItems = data?.summary ? [
    { title: 'Total Customers', value: data.summary.totalCustomers, color: '#1890ff', icon: <FaUsers /> },
    { title: 'Blocked Customers', value: data.summary.blockedCustomers, color: '#f5222d', icon: <FaUserTimes /> },
    { title: 'Total Orders', value: data.summary.totalOrders, color: '#722ed1', icon: <FaShoppingBag /> },
    { title: 'Total Wallet Balances', value: data.summary.walletBalance, prefix: '₹', precision: 2, color: '#27ae60', icon: <FaWallet /> },
  ] : [];

  const columns = [
    { title: 'Name', dataIndex: 'fullName', render: (val) => val || 'N/A' },
    { title: 'Email', dataIndex: 'email', render: (val) => val || 'N/A' },
    { title: 'Orders', dataIndex: 'totalOrders' },
    { title: 'Total Spend (₹)', dataIndex: 'totalSpend', render: (v) => v.toFixed(2) },
    { title: 'Wallet (₹)', dataIndex: 'walletBalance', render: (v) => v.toFixed(2) },
    { title: 'Status', dataIndex: 'isBlocked', render: (blocked) => blocked ? <Tag color="red">Blocked</Tag> : <Tag color="green">Active</Tag> },
  ];

  if (isError) return <Alert message="Failed to load customer report" type="error" />;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Customer Report</Title>
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
          <Card title="Customer Activity Details" bordered={false}>
            <Table 
              dataSource={data?.customers || []} 
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

export default CustomerReportPage;
