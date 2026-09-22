import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const TopProductsChart = ({ products = [] }) => {
  const topProducts = products.slice(0, 10);
  
  const data = {
    labels: topProducts.map(p => p.name?.length > 15 ? p.name.substring(0, 15) + '...' : p.name),
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.map(p => p.totalSold || 0),
        backgroundColor: '#722ed1',
        borderRadius: 4,
      },
      {
        label: 'Revenue (₹)',
        data: topProducts.map(p => p.totalRevenue || 0),
        backgroundColor: '#27ae60',
        borderRadius: 4,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default TopProductsChart;
