/**
 * @file public/admin/js/admin-dashboard.js
 * @description Logic for the admin dashboard, including sidebar toggles, stat animations, and UI interactions.
 */

// ==========================================
// MOBILE SIDEBAR TOGGLE
// ==========================================

/**
 * Creates and manages the mobile sidebar toggle button.
 */
const createMobileToggle = () => {
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');

    // Create toggle button if it doesn't exist
    if (!document.querySelector('.sidebar-toggle')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'sidebar-toggle';
      toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      mainContent.insertBefore(toggleBtn, mainContent.firstChild);

      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });

      // Close sidebar when clicking outside
      mainContent.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar-toggle') && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
};

// Initialize mobile toggle
createMobileToggle();
window.addEventListener('resize', createMobileToggle);

// Add mobile toggle styles
const mobileStyles = document.createElement('style');
mobileStyles.textContent = `
  .sidebar-toggle {
    display: none;
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 101;
    background: var(--admin-primary);
    color: white;
    border: none;
    width: 45px;
    height: 45px;
    border-radius: 12px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
    transition: all 0.3s ease;
  }
  
  .sidebar-toggle:hover {
    background: var(--admin-primary-light);
    transform: scale(1.05);
  }
  
  @media (max-width: 768px) {
    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .sidebar.open {
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.2);
    }
  }
`;
document.head.appendChild(mobileStyles);

// ==========================================
// LOGOUT SYSTEM
// ==========================================

const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to logout?')) {
      showToast('Logging out...', 'info');

      // Redirect to the backend logout route
      setTimeout(() => {
        window.location.href = '/admin/logout';
      }, 500);
    }
  });
}

// ==========================================
// DASHBOARD UI INTERACTIONS
// ==========================================

// Date Filter Change
const dateFilter = document.querySelector('.date-filter');
if (dateFilter) {
  dateFilter.addEventListener('change', (e) => {
    showToast(`Showing data for: ${e.target.value}`, 'info');
    // Trigger data refresh/re-animation
    animateStats();
  });
}

// Download Report Button
const downloadBtn = document.querySelector('.btn-download');
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    showToast('Generating report...', 'info');

    // Simulate download delay
    setTimeout(() => {
      showToast('Report downloaded successfully!', 'success');
    }, 2000);
  });
}

/**
 * Animates stat values on dashboard load.
 */
const animateStats = () => {
  const statValues = document.querySelectorAll('.stat-value');

  statValues.forEach(stat => {
    const finalValue = stat.textContent;
    stat.textContent = '0';

    // Simple counter animation
    if (finalValue.includes('$')) {
      const numValue = parseFloat(finalValue.replace(/[$,]/g, ''));
      let current = 0;
      const increment = numValue / 50;

      const counter = setInterval(() => {
        current += increment;
        if (current >= numValue) {
          stat.textContent = finalValue;
          clearInterval(counter);
        } else {
          stat.textContent = '$' + current.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
      }, 20);
    } else {
      const numValue = parseInt(finalValue.replace(/,/g, ''));
      let current = 0;
      const increment = Math.ceil(numValue / 50);

      const counter = setInterval(() => {
        current += increment;
        if (current >= numValue) {
          stat.textContent = finalValue;
          clearInterval(counter);
        } else {
          stat.textContent = current.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
      }, 20);
    }
  });
};

// Run animation on page load
window.addEventListener('load', () => {
  setTimeout(animateStats, 300);
});

// Table Row Hover/Click
const tableRows = document.querySelectorAll('.orders-table tbody tr');
tableRows.forEach(row => {
  row.style.cursor = 'pointer';
  row.addEventListener('click', () => {
    const orderId = row.querySelector('.order-id').textContent;
    showToast(`Opening order ${orderId}`, 'info');
    // Implementation for opening order details
  });

  row.addEventListener('mouseenter', () => {
    row.style.backgroundColor = 'rgba(196, 30, 58, 0.05)';
  });

  row.addEventListener('mouseleave', () => {
    row.style.backgroundColor = '';
  });
});

// Stock Item Hover/Click
const stockItems = document.querySelectorAll('.stock-item');
stockItems.forEach(item => {
  item.style.cursor = 'pointer';
  item.addEventListener('click', () => {
    const productName = item.querySelector('h4').textContent;
    showToast(`Opening ${productName} details`, 'info');
  });

  item.addEventListener('mouseenter', () => {
    item.style.transform = 'translateX(5px)';
    item.style.transition = 'transform 0.3s ease';
  });

  item.addEventListener('mouseleave', () => {
    item.style.transform = 'translateX(0)';
  });
});

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================

/**
 * Displays a toast notification on the screen.
 * @param {string} message - Message to display.
 * @param {string} [type='info'] - Type of toast: success, error, info, warning.
 */
function showToast(message, type = 'info') {
  // Remove existing toast
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
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

  // Show toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  // Auto remove
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Toast styles
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
  
  .toast i {
    font-size: 1.3rem;
  }
  
  .toast-success {
    border-left: 4px solid #27ae60;
  }
  
  .toast-success i {
    color: #27ae60;
  }
  
  .toast-error {
    border-left: 4px solid #e74c3c;
  }
  
  .toast-error i {
    color: #e74c3c;
  }
  
  .toast-info {
    border-left: 4px solid #3498db;
  }
  
  .toast-info i {
    color: #3498db;
  }
  
  .toast-warning {
    border-left: 4px solid #f39c12;
  }
  
  .toast-warning i {
    color: #f39c12;
  }
  
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
// BACKGROUND PROCESSES & SHORTCUTS
// ==========================================

// Refresh data periodically (demo)
let refreshInterval;

const startAutoRefresh = () => {
  refreshInterval = setInterval(() => {
    console.log('Auto-refreshing dashboard data...');
  }, 60000); // Every 60 seconds
};

const stopAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
};

// Start auto-refresh
startAutoRefresh();

// Stop auto-refresh when page is hidden
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopAutoRefresh();
  } else {
    startAutoRefresh();
  }
});

// View All Links
const viewAllLinks = document.querySelectorAll('.view-all');
viewAllLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const section = link.textContent.trim();
    showToast(`Opening ${section}...`, 'info');
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Alt + D for Dashboard
  if (e.altKey && e.key === 'd') {
    e.preventDefault();
    document.querySelector('.nav-item.active')?.click();
  }

  // Alt + R for Refresh
  if (e.altKey && e.key === 'r') {
    e.preventDefault();
    showToast('Refreshing data...', 'info');
    animateStats();
  }

  // Alt + L for Logout
  if (e.altKey && e.key === 'l') {
    e.preventDefault();
    logoutBtn?.click();
  }
});

console.log('%c📊 HOOF Admin Dashboard', 'color: #c41e3a; font-size: 20px; font-weight: bold;');
console.log('%cKeyboard Shortcuts:', 'color: #3498db; font-size: 14px; font-weight: bold;');
console.log('%cAlt + D: Dashboard', 'color: #7f8c8d; font-size: 12px;');
console.log('%cAlt + R: Refresh Data', 'color: #7f8c8d; font-size: 12px;');
console.log('%cAlt + L: Logout', 'color: #7f8c8d; font-size: 12px;');