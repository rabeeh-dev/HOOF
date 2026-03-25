

// ==========================================
// LOGOUT SYSTEM
// ==========================================

const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    Swal.fire({
      title: 'Logout?',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        showToast('Logging out...', 'info');
        setTimeout(() => {
          window.location.href = '/admin/logout';
        }, 500);
      }
    });
  });
}

// ==========================================
// CHART.JS INITIALIZATION
// ==========================================

// -- Color palette --
const chartColors = {
  primary: '#c41e3a',
  primaryLight: 'rgba(196, 30, 58, 0.15)',
  green: '#27ae60',
  blue: '#3498db',
  orange: '#e67e22',
  purple: '#9b59b6',
  yellow: '#f1c40f',
  cyan: '#1abc9c',
  grey: '#95a5a6',
  red: '#e74c3c'
};

let salesChart;

// --- Sales Overview Line Chart Initialization ---
const initSalesChart = (chartData) => {
  const salesCtx = document.getElementById('salesChart');
  if (!salesCtx) return;

  if (salesChart) {
    salesChart.data.labels = chartData.map(m => m.label);
    salesChart.data.datasets[0].data = chartData.map(m => m.revenue);
    salesChart.data.datasets[1].data = chartData.map(m => m.count);
    salesChart.update();
    return;
  }

  salesChart = new Chart(salesCtx, {
    type: 'line',
    data: {
      labels: chartData.map(m => m.label),
      datasets: [{
        label: 'Revenue (₹)',
        data: chartData.map(m => m.revenue),
        borderColor: chartColors.primary,
        backgroundColor: chartColors.primaryLight,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.primary,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2.5
      },
      {
        label: 'Orders',
        data: chartData.map(m => m.count),
        borderColor: chartColors.blue,
        backgroundColor: 'rgba(52, 152, 219, 0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: chartColors.blue,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        borderWidth: 2,
        yAxisID: 'y1'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
            font: { family: 'Poppins', size: 12 }
          }
        },
        tooltip: {
          backgroundColor: 'rgba(44, 62, 80, 0.9)',
          titleFont: { family: 'Poppins', weight: '600' },
          bodyFont: { family: 'Poppins' },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function (context) {
              if (context.datasetIndex === 0) {
                return `Revenue: ₹${context.parsed.y.toLocaleString('en-IN')}`;
              }
              return `Orders: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          grid: { color: 'rgba(0,0,0,0.04)' },
          ticks: {
            font: { family: 'Poppins', size: 11 },
            callback: function (value) {
              if (value >= 1000) return '₹' + (value / 1000).toFixed(0) + 'k';
              return '₹' + value;
            }
          }
        },
        y1: {
          beginAtZero: true,
          position: 'right',
          grid: { drawOnChartArea: false },
          ticks: {
            font: { family: 'Poppins', size: 11 },
            stepSize: 1
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            font: { family: 'Poppins', size: 11 },
            maxRotation: 45
          }
        }
      }
    }
  });
};

// Initial Render - Only if window.__dashboardData is available
window.addEventListener('load', () => {
  const data = window.__dashboardData || {};
  console.log("Dashboard JS data at load:", data);
  if (data.monthlySales && data.monthlySales.length > 0) {
    initSalesChart(data.monthlySales);
  } else {
    console.log("No monthly sales data to initialize chart, waiting for filter change/ajax...");
  }
});

// ==========================================
// FILTERING & REPORTS INTERACTION
// ==========================================

const dashboardFilter = document.getElementById('dashboardFilter');
const customDateRange = document.getElementById('customDateRange');
const applyFilter = document.getElementById('applyFilter');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');

const handleFilterChange = () => {
  const filter = dashboardFilter.value;
  if (filter === 'custom') {
    customDateRange.style.display = 'flex';
    applyFilter.style.display = 'block';
  } else {
    customDateRange.style.display = 'none';
    applyFilter.style.display = 'none';
    fetchDashboardData(filter);
  }
};

const fetchDashboardData = async (filter, start = null, end = null) => {
  try {
    showToast('Updating charts...', 'info');
    let url = `/admin/dashboard?ajax=true&filter=${filter}`;
    if (start && end) url += `&startDate=${start}&endDate=${end}`;

    const response = await fetch(url);
    const result = await response.json();

    // 1. Update stats cards
    if (result.stats) {
      const revenueEl = document.getElementById('statRevenue');
      const ordersEl = document.getElementById('statOrders');
      const customersEl = document.getElementById('statCustomers');
      const productsEl = document.getElementById('statProducts');

      if (revenueEl) {
        revenueEl.textContent = `₹${result.stats.totalRevenue.toLocaleString('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}`;
        revenueEl.setAttribute('data-value', result.stats.totalRevenue);
      }

      if (ordersEl) {
        ordersEl.textContent = result.stats.totalOrders.toLocaleString();
        ordersEl.setAttribute('data-value', result.stats.totalOrders);
      }

      if (customersEl && result.stats.totalCustomers !== undefined) {
        customersEl.textContent = result.stats.totalCustomers.toLocaleString();
        customersEl.setAttribute('data-value', result.stats.totalCustomers);
      }

      if (productsEl && result.stats.totalProducts !== undefined) {
        productsEl.textContent = result.stats.totalProducts.toLocaleString();
        productsEl.setAttribute('data-value', result.stats.totalProducts);
      }
    }

    // 2. Update Sales Chart
    if (result.monthlySales) {
      initSalesChart(result.monthlySales);
      showToast('Dashboard updated', 'success');
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showToast('Failed to update dashboard', 'error');
  }
};

// ==========================================
// Auto-Initialization
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Force the dropdown to 'daily' if it exists and automatically jumpstart the chart/stats fetches
    const filterEl = document.getElementById('dashboardFilter');
    if (filterEl && typeof fetchDashboardData === 'function') {
        filterEl.value = 'daily';
        fetchDashboardData('daily');
    }
});
if (dashboardFilter) {
  dashboardFilter.addEventListener('change', handleFilterChange);
}

if (applyFilter) {
  applyFilter.addEventListener('click', () => {
    const start = startDateInput.value;
    const end = endDateInput.value;
    if (!start || !end) {
      return showToast('Please select both dates', 'warning');
    }
    fetchDashboardData('custom', start, end);
  });
}

// Report Downloads
const downloadReport = async (type) => {
  const filter = dashboardFilter.value;
  const start = startDateInput.value;
  const end = endDateInput.value;

  let url = `/admin/dashboard/export?type=${type}&filter=${filter}`;
  if (filter === 'custom' && start && end) {
    url += `&startDate=${start}&endDate=${end}`;
  }

  showLoading('Generating report...');
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const filename = res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1] || `report.${type}`;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch (err) {
    console.error('Export failed:', err);
  } finally {
    hideLoading();
  }
};

document.getElementById('downloadPDF')?.addEventListener('click', () => downloadReport('pdf'));

// ==========================================
// STAT COUNTER ANIMATION
// ==========================================

const animateStats = () => {
  const statValues = document.querySelectorAll('.stat-value');

  statValues.forEach(stat => {
    const finalText = stat.textContent;
    const rawValue = parseFloat(stat.getAttribute('data-value')) || 0;

    if (rawValue === 0) return;

    stat.textContent = finalText.includes('₹') ? '₹0' : '0';
    let current = 0;
    const duration = 1200;
    const startTime = performance.now();

    const step = (timestamp) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      current = rawValue * eased;

      if (finalText.includes('₹')) {
        stat.textContent = '₹' + current.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      } else {
        stat.textContent = Math.round(current).toLocaleString();
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        stat.textContent = finalText;
      }
    };

    requestAnimationFrame(step);
  });
};

window.addEventListener('load', () => {
  setTimeout(animateStats, 300);
});

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================

function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) existingToast.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle'
  };

  toast.innerHTML = `
    <i class="fas ${icons[type]}"></i>
    <span>${message}</span>
  `;

  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const toastStyles = document.createElement('style');
toastStyles.textContent = `
  .toast {
    position: fixed;
    top: 2rem;
    right: 2rem;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 1rem;
    z-index: 1000;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s ease;
    min-width: 250px;
  }
  
  .toast.show {
    opacity: 1;
    transform: translateX(0);
  }
  
  .toast i { font-size: 1.3rem; }
  
  .toast-success { border-left: 4px solid #27ae60; }
  .toast-success i { color: #27ae60; }
  
  .toast-error { border-left: 4px solid #e74c3c; }
  .toast-error i { color: #e74c3c; }
  
  .toast-info { border-left: 4px solid #3498db; }
  .toast-info i { color: #3498db; }
  
  .toast-warning { border-left: 4px solid #f39c12; }
  .toast-warning i { color: #f39c12; }
  
  .toast span {
    color: var(--admin-text);
    font-size: 0.95rem;
  }
  
  @media (max-width: 600px) {
    .toast {
      right: 1rem;
      left: 1rem;
      min-width: auto;
    }
  }
`;
document.head.appendChild(toastStyles);

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === 'd') {
    e.preventDefault();
    document.querySelector('.nav-item.active')?.click();
  }
  if (e.altKey && e.key === 'r') {
    e.preventDefault();
    showToast('Refreshing data...', 'info');
    animateStats();
  }
  if (e.altKey && e.key === 'l') {
    e.preventDefault();
    logoutBtn?.click();
  }
});

console.log('%c📊 HOOF Admin Dashboard', 'color: #c41e3a; font-size: 20px; font-weight: bold;');