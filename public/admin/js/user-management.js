// Mobile Sidebar Toggle
const createMobileToggle = () => {
  if (window.innerWidth <= 768) {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!document.querySelector('.sidebar-toggle')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'sidebar-toggle';
      toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
      mainContent.insertBefore(toggleBtn, mainContent.firstChild);
      
      toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
      
      mainContent.addEventListener('click', (e) => {
        if (!e.target.closest('.sidebar-toggle') && sidebar.classList.contains('open')) {
          sidebar.classList.remove('open');
        }
      });
    }
  }
};

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
  }
  
  @media (max-width: 768px) {
    .sidebar-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;
document.head.appendChild(mobileStyles);

// Search Functionality
const searchInput = document.getElementById('searchInput');
const tableRows = document.querySelectorAll('.customers-table tbody tr');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('.customers-table tbody tr'); // Dynamic check
    
    rows.forEach(row => {
      // Check if row has data (skip "No customers found" rows)
      const nameEl = row.querySelector('.customer-info h4');
      const emailEl = row.querySelector('.contact-text');
      
      if (nameEl && emailEl) {
        const customerName = nameEl.textContent.toLowerCase();
        const email = emailEl.textContent.toLowerCase();
        row.style.display = (customerName.includes(searchTerm) || email.includes(searchTerm)) ? '' : 'none';
      }
    });
  });
}

// Export List Button
const exportBtn = document.querySelector('.btn-export');
if (exportBtn) {
  exportBtn.addEventListener('click', () => {
    showToast('Exporting customer list...', 'info');
    
    // Simulate export
    setTimeout(() => {
      showToast('Customer list exported successfully!', 'success');
    }, 2000);
  });
}

// Email Button Actions
const emailButtons = document.querySelectorAll('.action-btn.email');
emailButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const row = btn.closest('tr');
    const customerName = row.querySelector('.customer-info h4').textContent;
    const email = row.querySelector('.contact-text').textContent;
    
    showToast(`Opening email to ${customerName} (${email})`, 'info');
    
    // In real app, this would open email modal or redirect
    // window.location.href = `mailto:${email}`;
  });
});

// Block/Unblock Button Actions
// Block/Unblock Button Actions (Now Database Connected)
const blockButtons = document.querySelectorAll('.action-btn.block');
blockButtons.forEach(btn => {
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const row = btn.closest('tr');
    const userId = row.dataset.id; // Correctly pulls the MongoDB ID from EJS
    const customerName = row.querySelector('.customer-info h4').textContent;
    const statusBadge = row.querySelector('.status-badge');
    const isCurrentlyBlocked = statusBadge.classList.contains('blocked');
    
    const action = isCurrentlyBlocked ? 'unblock' : 'block';
    
    if (confirm(`Are you sure you want to ${action} ${customerName}?`)) {
      try {
        const response = await fetch(`/admin/users/${action}/${userId}`, { 
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();

        if (data.success) {
          // Update the UI state to match the new database state
          statusBadge.className = isCurrentlyBlocked ? 'status-badge active' : 'status-badge blocked';
          statusBadge.textContent = isCurrentlyBlocked ? 'Active' : 'Blocked';
          btn.innerHTML = isCurrentlyBlocked ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-unlock"></i>';
          btn.title = isCurrentlyBlocked ? "Block Customer" : "Unblock Customer";
          showToast(`${customerName} ${action}ed successfully`, 'success');
          updateStats();
        } else {
          showToast('Failed to update status in database', 'error');
        }
      } catch (err) {
        showToast('Network error: Server unreachable', 'error');
      }
    }
  });
});

// Row Click - View Customer Details
tableRows.forEach(row => {
  row.style.cursor = 'pointer';
  
  row.addEventListener('click', (e) => {
    // Don't trigger if clicking action buttons
    if (e.target.closest('.action-btn')) return;
    
    const customerName = row.querySelector('.customer-info h4').textContent;
    showToast(`Opening ${customerName}'s profile`, 'info');
    
    // In real app, this would navigate to customer detail page
    // window.location.href = `/admin/customers/${customerId}`;
  });
});

// Logout Button - Fixed
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

// Toast Notification System
function showToast(message, type = 'info') {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }
  
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
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);
  
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

// Count and Display Stats
const updateStats = () => {
  const totalCustomers = tableRows.length;
  const activeCustomers = document.querySelectorAll('.status-badge.active').length;
  const blockedCustomers = document.querySelectorAll('.status-badge.blocked').length;
  
  console.log(`📊 Customer Statistics:`);
  console.log(`Total: ${totalCustomers}`);
  console.log(`Active: ${activeCustomers}`);
  console.log(`Blocked: ${blockedCustomers}`);
};

updateStats();

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    searchInput.focus();
  }
  
  // Ctrl/Cmd + E to export
  if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
    e.preventDefault();
    exportBtn.click();
  }
  
  // ESC to clear search
  if (e.key === 'Escape' && searchInput === document.activeElement) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
    searchInput.blur();
  }
});

// Sort Table (basic implementation)
const tableHeaders = document.querySelectorAll('.customers-table th');
tableHeaders.forEach((header, index) => {
  if (index === 0 || index === 2 || index === 3) { // Customer, Orders, Total Spent
    header.style.cursor = 'pointer';
    header.style.userSelect = 'none';
    
    header.addEventListener('click', () => {
      showToast('Sorting functionality coming soon!', 'info');
    });
    
    header.addEventListener('mouseenter', () => {
      header.style.background = 'rgba(196, 30, 58, 0.05)';
    });
    
    header.addEventListener('mouseleave', () => {
      header.style.background = '';
    });
  }
});

console.log('%c👥 HOOF Customer Management', 'color: #c41e3a; font-size: 18px; font-weight: bold;');
console.log('%cKeyboard Shortcuts:', 'color: #3498db; font-size: 14px; font-weight: bold;');
console.log('%cCtrl/Cmd + K: Focus Search', 'color: #7f8c8d; font-size: 12px;');
console.log('%cCtrl/Cmd + E: Export List', 'color: #7f8c8d; font-size: 12px;');
console.log('%cESC: Clear Search', 'color: #7f8c8d; font-size: 12px;');