import React, { useState } from 'react';
import { Select, DatePicker, Space, Button } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;
const { RangePicker } = DatePicker;

const DashboardFilter = ({ onFilterChange }) => {
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
        <Option value="weekly">Weekly (7 Days)</Option>
        <Option value="yearly">Yearly</Option>
        <Option value="custom">Custom Range</Option>
      </Select>

      {filterType === 'custom' && (
        <Space>
          <RangePicker 
            onChange={handleRangeChange} 
            disabledDate={(current) => current && current > dayjs().endOf('day')}
          />
          <Button 
            type="primary" 
            onClick={handleApplyCustom}
            disabled={!dateRange}
            style={{ background: '#001529', borderColor: '#001529' }}
          >
            Apply
          </Button>
        </Space>
      )}
    </Space>
  );
};

export default DashboardFilter;
