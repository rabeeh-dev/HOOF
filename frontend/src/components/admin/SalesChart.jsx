import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SalesChart = ({ salesData = [] }) => {
  const data = {
    labels: salesData.map(d => d.label),
    datasets: [
      {
        label: 'Revenue (₹)',
        data: salesData.map(d => d.revenue),
        fill: true,
        backgroundColor: 'rgba(39, 174, 96, 0.1)',
        borderColor: '#27ae60',
        borderWidth: 2,
        tension: 0.3,
        pointBackgroundColor: '#27ae60',
        pointBorderColor: '#fff',
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            return `Revenue: ₹${context.raw.toLocaleString('en-IN')}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value.toLocaleString('en-IN')}`,
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
      <Line data={data} options={options} />
    </div>
  );
};

export default SalesChart;
