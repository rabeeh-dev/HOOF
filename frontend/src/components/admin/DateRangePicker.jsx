import React from 'react';
import { DatePicker } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const DateRangePicker = ({ onChange, disabled = false }) => {
  return (
    <RangePicker 
      onChange={onChange} 
      disabledDate={(current) => current && current > dayjs().endOf('day')}
      disabled={disabled}
    />
  );
};

export default DateRangePicker;
