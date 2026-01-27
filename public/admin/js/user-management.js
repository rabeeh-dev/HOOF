/* ==========================================
   HOOF ADMIN: USER MANAGEMENT LOGIC
   ========================================== */

// 1. Sidebar Toggle Logic
const createMobileToggle = () => {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    if (window.innerWidth <= 768 && !document.querySelector('.sidebar-toggle')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        mainContent.insertBefore(toggleBtn, mainContent.firstChild);
        
        toggleBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
        mainContent.addEventListener('click', (e) => {
            if (!e.target.closest('.sidebar-toggle') && sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        });
    }
};
createMobileToggle();
window.addEventListener('resize', createMobileToggle);

// 2. Search Logic (Filtered to current view)
const searchInput = document.getElementById('searchInput');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const rows = document.querySelectorAll('.customers-table tbody tr');
        
        rows.forEach(row => {
            const nameEl = row.querySelector('.customer-info h4');
            const emailEl = row.querySelector('.contact-text');
            if (nameEl && emailEl) {
                const match = nameEl.textContent.toLowerCase().includes(searchTerm) || 
                              emailEl.textContent.toLowerCase().includes(searchTerm);
                row.style.display = match ? '' : 'none';
            }
        });
    });
}

// 3. Block/Unblock Logic (Production Ready)
document.querySelectorAll('.action-btn.block').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const row = btn.closest('tr');
        const userId = row.dataset.id;
        const customerName = row.querySelector('.customer-info h4').textContent;
        const statusBadge = row.querySelector('.status-badge');
        const isBlocked = statusBadge.classList.contains('blocked');
        const action = isBlocked ? 'unblock' : 'block';

        if (confirm(`Are you sure you want to ${action} ${customerName}?`)) {
            try {
                const response = await fetch(`/admin/users/${action}/${userId}`, { method: 'PATCH' });
                const data = await response.json();
                if (data.success) {
                    statusBadge.className = isBlocked ? 'status-badge active' : 'status-badge blocked';
                    statusBadge.textContent = isBlocked ? 'Active' : 'Blocked';
                    btn.innerHTML = isBlocked ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-unlock"></i>';
                    // showToast(`${customerName} ${action}ed successfully`, 'success');
                }
            } catch (err) {
                showToast('Server connection failed', 'error');
            }
        }
    });
});

// 4. Logout Logic
const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/admin/logout';
        }
    });
}

// 5. Toast Notification System
function showToast(message, type = 'info') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas ${icons[type]}"></i><span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 6. Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchInput.focus(); }
    if (e.key === 'Escape' && searchInput === document.activeElement) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.blur();
    }
});