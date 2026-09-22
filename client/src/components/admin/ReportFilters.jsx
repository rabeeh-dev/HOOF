import React, { useState } from 'react';
import { Select, Space, Button } from 'antd';
import DateRangePicker from './DateRangePicker';

const { Option } = Select;

const ReportFilters = ({ onFilterChange }) => {
  const [filterType, setFilterType] = useState('daily');
  const [dateRange, setDateRange] = useState(null);

  const handleSelectChange = (val) => {
    setFilterType(val);
    if (val !== 'custom') {
      onFilterChange({ filter: val });
    }
  };

  const handleRangeChange = (dates) => {
    setDateRange(dates);
  };

  const handleApplyCustom = () => {
    if (dateRange && dateRange[0] && dateRange[1]) {
      onFilterChange({
        filter: 'custom',
        startDate: dateRange[0].toISOString(),
        endDate: dateRange[1].toISOString()
      });
    }
  };

  return (
    <Space wrap size="middle" style={{ marginBottom: 20 }}>
      <Select 
        defaultValue="daily" 
        style={{ width: 150 }} 
        onChange={handleSelectChange}
      >
        <Option value="daily">Daily</Option>
        <Option value="weekly">Weekly</Option>
        <Option value="yearly">Yearly</Option>
        <Option value="custom">Custom Date Range</Option>
      </Select>

      {filterType === 'custom' && (
        <Space>
          <DateRangePicker onChange={handleRangeChange} />
          <Button 
            type="primary" 
            onClick={handleApplyCustom}
            disabled={!dateRange}
          >
            Apply Range
          </Button>
        </Space>
      )}
    </Space>
  );
};

export default ReportFilters;
