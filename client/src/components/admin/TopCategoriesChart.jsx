import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);

const TopCategoriesChart = ({ categories = [] }) => {
  const colors = [
    '#1890ff', '#27ae60', '#fa8c16', '#722ed1', '#f5222d', 
    '#13c2c2', '#eb2f96', '#faad14', '#52c41a', '#2f54eb'
  ];

  const data = {
    labels: categories.map(c => c.name),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: categories.map(c => c.totalRevenue || 0),
        backgroundColor: colors.slice(0, categories.length),
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Pie data={data} options={options} />
    </div>
  );
};

export default TopCategoriesChart;
