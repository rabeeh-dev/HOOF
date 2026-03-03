/**
 * @file public/admin/js/user-management.js
 * @description Administrative logic for user management, including searching, blocking/unblocking, and exporting.
 */

// ==========================================
// SIDEBAR & NAVIGATION
// ==========================================

/**
 * Creates and manages the mobile sidebar toggle button.
 */
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

// ==========================================
// EXPORTING DATA
// ==========================================

const exportBtn = document.querySelector('.btn-export');
if (exportBtn) {
    exportBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        showLoading('Exporting customers...');
        try {
            const res = await fetch('/admin/users/export-pdf');
            const blob = await res.blob();
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const filename = res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1] || 'customers-export.pdf';
            a.download = filename;
            a.click();
            URL.revokeObjectURL(a.href);
        } catch (err) {
            console.error('Export failed:', err);
        } finally {
            hideLoading();
        }
    });
}

// ==========================================
// SEARCH FUNCTIONALITY
// ==========================================

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearSearchBtn');

function searchCustomers() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const rows = document.querySelectorAll('.customers-table tbody tr');

    if (clearBtn) clearBtn.style.display = searchTerm.length > 0 ? 'flex' : 'none';

    rows.forEach(row => {
        const nameEl = row.querySelector('.customer-info h4');
        const emailEl = row.querySelector('.contact-text');
        if (nameEl && emailEl) {
            const match = nameEl.textContent.toLowerCase().includes(searchTerm) ||
                emailEl.textContent.toLowerCase().includes(searchTerm);
            row.style.display = match ? '' : 'none';
        }
    });
}

function clearSearch() {
    if (searchInput) {
        searchInput.value = '';
        searchCustomers();
    }
}

if (searchBtn) searchBtn.addEventListener('click', searchCustomers);
if (clearBtn) clearBtn.addEventListener('click', clearSearch);
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCustomers();
    });
    searchInput.addEventListener('input', () => {
        if (clearBtn) clearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
    });
}

// ==========================================
// USER BLOCK/UNBLOCK SYSTEM
// ==========================================

document.querySelectorAll('.action-btn.block').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const row = btn.closest('tr');
        const userId = row.dataset.id;
        const customerName = row.querySelector('.customer-info h4').textContent;
        const statusBadge = row.querySelector('.status-badge');
        const isBlocked = statusBadge.classList.contains('blocked');
        const action = isBlocked ? 'unblock' : 'block';

        showCustomConfirm(
            `${action.charAt(0).toUpperCase() + action.slice(1)} Customer`,
            `Are you sure you want to <strong>${action}</strong> ${customerName}?`,
            async () => {
                try {
                    const response = await fetch(`/admin/users/${userId}/${action}`, { method: 'PATCH' });
                    const data = await response.json();
                    if (data.success) {
                        statusBadge.className = isBlocked ? 'status-badge active' : 'status-badge blocked';
                        statusBadge.textContent = isBlocked ? 'Active' : 'Blocked';
                        btn.innerHTML = isBlocked ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-unlock"></i>';
                        showSuccessAlert('Success!', `${customerName} ${action}ed successfully`);
                    }
                } catch (err) {
                    showToast('Server connection failed', 'error');
                }
            }
        );
    });
});

// ==========================================
// AUTHENTICATION INTERACTIONS
// ==========================================

const logoutBtn = document.querySelector('.logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            window.location.href = '/admin/logout';
        }
    });
}

// ==========================================
// UI FEEDBACK SYSTEMS (Toast & Confirm)
// ==========================================

/**
 * Displays a success modal popup.
 * @param {string} title - Modal title.
 * @param {string} message - Message to display.
 */
function showSuccessAlert(title, message) {
    const modalId = 'success-alert-modal';
    let modal = document.getElementById(modalId);

    if (modal) modal.remove();

    modal = document.createElement('div');
    modal.id = modalId;
    modal.className = 'custom-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-container" style="max-width: 420px; text-align: center;">
            <div class="modal-header" style="justify-content: center; border: none; padding-bottom: 0;">
                <div style="background: rgba(40, 167, 69, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <i class="fas fa-check-circle" style="font-size: 2.5rem; color: #28a745;"></i>
                </div>
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 10px;">${title}</h3>
            <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">${message}</p>
            <div class="modal-footer" style="display: flex; gap: 12px; border: none; padding: 0;">
                <button type="button" class="btn primary close-modal" style="flex: 1; background-color: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-size: 1rem;">OK</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.querySelector('.close-modal').addEventListener('click', closeModal);
    modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
}

/**
 * Displays a toast notification.
 * @param {string} message - Message to display.
 * @param {string} [type='info'] - Type: info, success, error.
 */
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

/**
 * Displays a custom confirmation modal.
 * @param {string} title - Modal title.
 * @param {string} message - Modal message (allows HTML).
 * @param {Function} onConfirm - Callback function to execute on confirm.
 */
function showCustomConfirm(title, message, onConfirm) {
    let modalOverlay = document.querySelector('.custom-modal');

    // Create modal structure if it doesn't exist
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.className = 'custom-modal';
        modalOverlay.style.display = 'flex';
        modalOverlay.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon-wrapper">
                        <i class="fas fa-trash-alt"></i>
                    </div>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-footer">
                    <button class="modal-btn confirm">Yes, Proceed</button>
                    <button class="modal-btn cancel">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);
    } else {
        // Update existing modal content
        modalOverlay.querySelector('h3').textContent = title;
        modalOverlay.querySelector('p').innerHTML = message;
    }

    const cancelBtn = modalOverlay.querySelector('.modal-btn.cancel');
    const confirmBtn = modalOverlay.querySelector('.modal-btn.confirm');

    // Update Icon based on action (Block vs Unblock)
    const icon = modalOverlay.querySelector('i');
    if (title.toLowerCase().includes('block')) {
        icon.className = 'fas fa-ban';
    } else {
        icon.className = 'fas fa-unlock';
    }

    // Reset Listeners to prevent multiple triggers
    const newCancel = cancelBtn.cloneNode(true);
    const newConfirm = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    const closeModal = () => {
        modalOverlay.remove();
    };

    newCancel.addEventListener('click', closeModal);
    modalOverlay.querySelector('.modal-overlay').addEventListener('click', closeModal);

    newConfirm.addEventListener('click', () => {
        closeModal();
        onConfirm();
    });
}

// ==========================================
// KEYBOARD SHORTCUTS
// ==========================================

document.addEventListener('keydown', (e) => {
    // Focus search with Ctrl/Cmd + K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (searchInput) searchInput.focus();
    }

    // Clear and blur search with Escape
    if (e.key === 'Escape' && searchInput === document.activeElement) {
        searchInput.value = '';
        searchInput.dispatchEvent(new Event('input'));
        searchInput.blur();
    }
});