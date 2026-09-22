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

const OrdersChart = ({ salesData = [] }) => {
  const data = {
    labels: salesData.map(d => d.label),
    datasets: [
      {
        label: 'Orders Placed',
        data: salesData.map(d => d.count),
        backgroundColor: '#1890ff',
        borderColor: '#1890ff',
        borderWidth: 1,
        borderRadius: 4,
        barPercentage: 0.6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: '#8c8c8c'
        },
        grid: {
          color: '#f0f0f0'
        }
      },
      x: {
        ticks: {
          color: '#8c8c8c'
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div style={{ height: '300px', width: '100%' }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default OrdersChart;
