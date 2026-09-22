import React from 'react';
import { Space, Button } from 'antd';
import { FaFilePdf, FaFileExcel } from 'react-icons/fa';

const ExportButtons = ({ onExportPdf, onExportExcel, loadingPdf = false, loadingExcel = false }) => {
  return (
    <Space>
      <Button 
        type="primary" 
        danger 
        icon={<FaFilePdf />} 
        onClick={onExportPdf}
        loading={loadingPdf}
        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
      >
        Export PDF
      </Button>
      <Button 
        type="primary" 
        icon={<FaFileExcel />} 
        onClick={onExportExcel}
        loading={loadingExcel}
        style={{ background: '#27ae60', borderColor: '#27ae60', display: 'flex', alignItems: 'center', gap: 6 }}
      >
        Export Excel
      </Button>
    </Space>
  );
};

export default ExportButtons;
