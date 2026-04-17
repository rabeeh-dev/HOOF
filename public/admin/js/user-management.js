/**
 * @file public/admin/js/user-management.js
 * @description Administrative logic for user management, including searching, blocking/unblocking, and exporting.
 */

// ==========================================
// USER MANAGEMENT SCRIPTS
// ==========================================
// ==========================================
// EXPORTING DATA
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
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

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const clearBtn = document.getElementById('clearSearchBtn');

    let searchTimeout;

    function applySearch() {
        if (!searchInput) return;
        const searchTerm = searchInput.value.trim();
        if (typeof showLoading === 'function') showLoading('Searching globally...');
        const url = new URL(window.location.href);
        if (searchTerm) {
            url.searchParams.set('search', searchTerm);
        } else {
            url.searchParams.delete('search');
        }
        url.searchParams.set('page', '1');
        window.location.href = url.toString();
    }

    function searchCustomers() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applySearch, 800);
    }

    function clearSearch() {
        if (searchInput) {
            searchInput.value = '';
            applySearch();
        }
    }

    if (searchBtn) searchBtn.addEventListener('click', applySearch);
    if (clearBtn) clearBtn.addEventListener('click', clearSearch);
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                applySearch();
            }
        });
        searchInput.addEventListener('input', () => {
            if (clearBtn) clearBtn.style.display = searchInput.value.length > 0 ? 'flex' : 'none';
            searchCustomers();
        });
        
        // Populate search box from URL on load
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('search')) {
            searchInput.value = urlParams.get('search');
            if (clearBtn) clearBtn.style.display = 'flex';
        }
    }

    // ==========================================
    // USER EMAIL ACTION
    // ==========================================

    document.querySelectorAll('.action-btn.email').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const row = btn.closest('tr');
            const email = row.querySelector('.contact-text')?.textContent.trim();
            if (email) {
                window.location.href = `mailto:${email}`;
            }
        });
    });

    // ==========================================
    // USER BLOCK/UNBLOCK SYSTEM
    // ==========================================

    document.querySelectorAll('.action-btn.block').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const row = btn.closest('tr');
            if (!row) return;

            const userId = row.dataset.id;
            const customerName = row.querySelector('.customer-info h4')?.textContent.trim() || 'this user';
            const statusBadge = row.querySelector('.status-badge');
            const isBlocked = statusBadge && statusBadge.classList.contains('blocked');
            const action = isBlocked ? 'unblock' : 'block';

            const result = await Swal.fire({
                title: `${action.charAt(0).toUpperCase() + action.slice(1)} Customer?`,
                html: `Are you sure you want to <strong>${action}</strong> ${customerName}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: isBlocked ? '#28a745' : '#c41e3a',
                cancelButtonColor: '#6c757d',
                confirmButtonText: `Yes, ${action} them!`
            });

            if (result.isConfirmed) {
                try {
                    if (typeof showLoading === 'function') showLoading(`Processing ${action}...`);
                    const response = await fetch(`/admin/users/${userId}/${action}`, { method: 'PATCH' });
                    const data = await response.json();
                    if (typeof hideLoading === 'function') hideLoading();

                    if (data.success) {
                        if (statusBadge) {
                            statusBadge.className = isBlocked ? 'status-badge active' : 'status-badge blocked';
                            statusBadge.textContent = isBlocked ? 'Active' : 'Blocked';
                        }
                        btn.title = isBlocked ? 'Block Customer' : 'Unblock Customer';
                        btn.innerHTML = isBlocked ? '<i class="fas fa-ban"></i>' : '<i class="fas fa-unlock"></i>';

                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: `${customerName} was ${action}ed successfully.`,
                            timer: 2000,
                            showConfirmButton: false
                        });
                    } else {
                        Swal.fire('Error', data.message || 'Action failed', 'error');
                    }
                } catch (err) {
                    if (typeof hideLoading === 'function') hideLoading();
                    Swal.fire('Error', 'Server connection failed', 'error');
                }
            }
        });
    });

    // ==========================================
    // AUTHENTICATION INTERACTIONS
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
                    window.location.href = '/admin/logout';
                }
            });
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
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            if (searchInput) {
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                searchInput.blur();
            }
        }
    });

}); // End DOMContentLoaded