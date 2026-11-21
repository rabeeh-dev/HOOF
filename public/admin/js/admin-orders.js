/**
 * @file public/admin/js/admin-orders.js
 * @description Administrative logic for order management, including searching, filtering, status updates, and detailed view.
 */

document.addEventListener('DOMContentLoaded', () => {
    // ==========================================
    // SIDEBAR & NAVIGATION
    // ==========================================

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

    // Logout handler
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            showCustomConfirm('Logout', 'Are you sure you want to logout?', () => {
                window.location.href = '/admin/logout';
            });
        });
    }

    // ==========================================
    // FILTERS & SEARCH
    // ==========================================

    const filterToggleBtn = document.getElementById('filterToggleBtn');
    const filterPanel = document.getElementById('filterPanel');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const statusFilter = document.getElementById('statusFilter');
    const paymentFilter = document.getElementById('paymentFilter');
    const searchInput = document.getElementById('searchInput');

    // Toggle Filter Panel
    if (filterToggleBtn) {
        filterToggleBtn.addEventListener('click', () => {
            const isHidden = window.getComputedStyle(filterPanel).display === 'none';
            filterPanel.style.display = isHidden ? 'block' : 'none';
            filterToggleBtn.classList.toggle('active');
            const icon = filterToggleBtn.querySelector('i');
            icon.className = isHidden ? 'fas fa-times' : 'fas fa-filter';
        });
    }

    // Apply Filters Function
    const applyFilters = () => {
        const status = statusFilter.value;
        const payment = paymentFilter.value;
        const search = searchInput.value.trim();
        const url = new URL(window.location.href);

        if (status) url.searchParams.set('status', status);
        else url.searchParams.delete('status');

        if (payment) url.searchParams.set('payment', payment);
        else url.searchParams.delete('payment');

        if (search) url.searchParams.set('search', search);
        else url.searchParams.delete('search');

        url.searchParams.set('page', '1'); // Reset to page 1 on filter
        showLoading('Applying filters...');
        window.location.href = url.toString();
    };

    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', applyFilters);
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            showLoading('Clearing filters...');
            window.location.href = '/admin/orders';
        });
    }

    // Search with Debounce
    let debounceTimer;
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(applyFilters, 600);
        });
    }

    // Export Orders (PDF or Excel)
    let currentExportType = 'pdf';
    let currentExportRange = 'all';

    window.openExportModal = (type = 'pdf') => {
        currentExportType = type;
        const modal = document.getElementById('exportDateModal');
        const hint = document.getElementById('exportFormatHint');
        
        if (hint) {
            hint.textContent = type === 'excel' ? 'Export as Excel Spreadsheet' : 'Export as PDF Document';
        }
        
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    window.closeExportModal = () => {
        const modal = document.getElementById('exportDateModal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    const presetChips = document.querySelectorAll('.preset-chip');
    const customDateWrap = document.getElementById('exportCustomDateWrap');
    
    presetChips.forEach(chip => {
        chip.addEventListener('click', () => {
            // Update active state
            presetChips.forEach(c => {
                c.classList.remove('active');
                c.style.background = 'white';
                c.style.color = 'var(--admin-text)';
                c.style.borderColor = 'var(--admin-border)';
            });
            chip.classList.add('active');
            chip.style.background = 'var(--admin-primary)';
            chip.style.color = 'white';
            chip.style.borderColor = 'var(--admin-primary)';
            
            // Set range
            currentExportRange = chip.getAttribute('data-range');
            
            // Show/hide custom inputs
            if (currentExportRange === 'custom') {
                customDateWrap.style.display = 'block';
            } else {
                customDateWrap.style.display = 'none';
                document.getElementById('exportStartDate').value = '';
                document.getElementById('exportEndDate').value = '';
            }
        });
    });

    const confirmExportBtn = document.getElementById('confirmExportBtn');
    if (confirmExportBtn) {
        confirmExportBtn.addEventListener('click', async () => {
            let startDate = '';
            let endDate = '';
            const now = new Date();
            
            if (currentExportRange === 'today') {
                startDate = now.toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
            } else if (currentExportRange === '7days') {
                const past = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
                startDate = past.toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
            } else if (currentExportRange === '30days') {
                const past = new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);
                startDate = past.toISOString().split('T')[0];
                endDate = now.toISOString().split('T')[0];
            } else if (currentExportRange === 'custom') {
                startDate = document.getElementById('exportStartDate')?.value;
                endDate = document.getElementById('exportEndDate')?.value;
                if (startDate && !endDate) return showToast('Please select an end date', 'warning');
                if (endDate && !startDate) return showToast('Please select a start date', 'warning');
                if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
                    return showToast('Start date cannot be after end date', 'warning');
                }
            }

            closeExportModal();
            const basePath = currentExportType === 'excel' ? '/admin/orders/export-excel' : '/admin/orders/export';
            const url = new URL(basePath, window.location.origin);
            
            // Check existing filters
            const status = statusFilter ? statusFilter.value : '';
            const payment = paymentFilter ? paymentFilter.value : '';
            const search = searchInput ? searchInput.value.trim() : '';
            
            if (status) url.searchParams.set('status', status);
            if (payment) url.searchParams.set('payment', payment);
            if (search) url.searchParams.set('search', search);
            if (startDate) url.searchParams.set('startDate', startDate);
            if (endDate) url.searchParams.set('endDate', endDate);
            
            showLoading('Exporting orders...');
            try {
                const res = await fetch(url.toString());
                const blob = await res.blob();
                const a = document.createElement('a');
                a.href = URL.createObjectURL(blob);
                const filename = res.headers.get('Content-Disposition')?.match(/filename="?(.+?)"?$/)?.[1] || `orders-export.${currentExportType === 'excel' ? 'xlsx' : 'pdf'}`;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(a.href);
            } catch (err) {
                console.error('Export failed:', err);
                showToast('Failed to export orders', 'error');
            } finally {
                hideLoading();
            }
        });
    }

    // ==========================================
    // ORDER DETAILS MODAL
    // ==========================================

    const orderDetailModal = document.getElementById('orderDetailModal');
    const closeOrderDetailModal = document.getElementById('closeOrderDetailModal');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    let currentDetailOrderId = null;

    window.viewOrderDetail = async (orderId) => {
        currentDetailOrderId = orderId;
        showLoading("Fetching order details...");
        try {
            const response = await fetch(`/admin/orders/${orderId}/detail`);
            const data = await response.json();

            if (data.success) {
                const order = data.order;

                // Populate Modal Fields
                document.getElementById('modalOrderId').textContent = '#' + String(order._id).slice(-8).toUpperCase();
                document.getElementById('modalCustomerName').textContent = order.userId?.fullName || order.shippingAddress.fullName;
                document.getElementById('modalEmail').textContent = order.userId?.email || '--';
                document.getElementById('modalOrderDate').textContent = new Date(order.createdAt).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                });

                let pStatus = order.paymentStatus || 'Pending';
                if (order.status === 'DELIVERED') {
                    pStatus = (order.paymentMethod === 'COD') ? 'SUCCESS' : 'Paid';
                }

                document.getElementById('modalPayment').innerHTML = `
                    ${order.paymentMethod} 
                    <span class="payment-status-mini ${pStatus.toLowerCase()}">${pStatus}</span>
                `;

                const addr = order.shippingAddress;
                document.getElementById('modalAddress').textContent = `${addr.street}, ${addr.city}, ${addr.state} - ${addr.zip}, ${addr.country}. Phone: ${addr.phone}`;

                // Populate Items List
                const listContainer = document.getElementById('modalItemsList');
                listContainer.innerHTML = '';
                order.items.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'modal-item-row';
                    row.innerHTML = `
                        <img src="${item.productImage}" alt="${item.productName}" class="modal-item-img">
                        <div class="modal-item-name">${item.productName}</div>
                        <div class="modal-item-qty">x${item.quantity}</div>
                        <div class="modal-item-price">₹${item.priceAtPurchase.toLocaleString('en-IN')}</div>
                    `;
                    listContainer.appendChild(row);
                });

                document.getElementById('modalTotal').textContent = `₹${order.totalAmount.toLocaleString('en-IN')}`;

                orderDetailModal.style.display = 'flex';
            } else {
                showToast(data.message || 'Error fetching details', 'error');
            }
        } finally {
            hideLoading();
        }
    };

    const closeDetail = () => orderDetailModal.style.display = 'none';
    if (closeOrderDetailModal) closeOrderDetailModal.addEventListener('click', closeDetail);
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeDetail);
    if (orderDetailModal) {
        orderDetailModal.querySelector('.modal-overlay').addEventListener('click', closeDetail);
    }

    // ==========================================
    // UPDATE STATUS MODAL
    // ==========================================

    const updateStatusModal = document.getElementById('updateStatusModal');
    const closeUpdateStatusModal = document.getElementById('closeUpdateStatusModal');
    const cancelStatusBtn = document.getElementById('cancelStatusBtn');
    const confirmStatusUpdate = document.getElementById('confirmStatusUpdate');
    const newStatusSelect = document.getElementById('newStatusSelect');
    const statusNotes = document.getElementById('statusNotes');
    let currentStatusOrderId = null;

    window.openStatusModal = (orderId, currentStatus) => {
        currentStatusOrderId = orderId;
        document.getElementById('statusModalOrderId').textContent = '#' + String(orderId).slice(-8).toUpperCase();

        const badge = document.getElementById('currentStatusBadge');
        badge.textContent = currentStatus;
        badge.className = 'status-badge ' + currentStatus.toLowerCase().replace(/\s+/g, '-');

        // Define transition map (allowing forward jumps & self-save - must match backend)
        const allowedTransitions = {
            'Pending': ['Processing', 'SHIPPED', 'Out for Delivery', 'DELIVERED', 'CANCELLED'],
            'Processing': ['SHIPPED', 'Out for Delivery', 'DELIVERED', 'CANCELLED'],
            'SHIPPED': ['Out for Delivery', 'DELIVERED', 'CANCELLED'],
            'Out for Delivery': ['DELIVERED', 'CANCELLED'],
            'DELIVERED': ['DELIVERED'],
            'CANCELLED': ['CANCELLED'],
            'Return Requested': ['Return Approved', 'Returned', 'CANCELLED'],
            'Return Approved': ['Picked Up', 'Returned', 'CANCELLED'],
            'Picked Up': ['Returned', 'CANCELLED'],
            'Returned': ['Returned']
        };

        const allowed = allowedTransitions[currentStatus] || [];

        // Update dropdown options
        Array.from(newStatusSelect.options).forEach(option => {
            if (option.value === currentStatus) {
                option.style.display = 'block'; // Keep current status visible
                option.disabled = true; // But don't allow selecting it again
            } else if (allowed.includes(option.value)) {
                option.style.display = 'block';
                option.disabled = false;
            } else {
                option.style.display = 'none';
            }
        });

        // Set default value to current status (it's shown but disabled)
        newStatusSelect.value = currentStatus;

        // If there's an allowed next state, auto-select the first one to prompt change
        if (allowed.length > 0) {
            newStatusSelect.value = allowed[0];
        }

        statusNotes.value = '';

        // Hide detail modal if it's open
        orderDetailModal.style.display = 'none';
        updateStatusModal.style.display = 'flex';
    };

    const closeStatusModal = () => updateStatusModal.style.display = 'none';
    if (closeUpdateStatusModal) closeUpdateStatusModal.addEventListener('click', closeStatusModal);
    if (cancelStatusBtn) cancelStatusBtn.addEventListener('click', closeStatusModal);
    if (updateStatusModal) {
        updateStatusModal.querySelector('.modal-overlay').addEventListener('click', closeStatusModal);
    }

    if (confirmStatusUpdate) {
        confirmStatusUpdate.addEventListener('click', async () => {
            const status = newStatusSelect.value;
            const notes = statusNotes.value.trim();

            confirmStatusUpdate.textContent = 'Updating...';
            confirmStatusUpdate.disabled = true;
            showLoading("Applying status change...");

            try {
                const response = await fetch(`/admin/orders/${currentStatusOrderId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status, notes })
                });
                const data = await response.json();

                if (data.success) {
                    showSuccessAlert('Status Updated', `Order status changed to ${status} successfully.`);
                    setTimeout(() => { showLoading('Refreshing...'); window.location.reload(); }, 1000);
                } else {
                    showToast(data.message || 'Update failed', 'error');
                }
            } catch (err) {
                showToast('Connection failed', 'error');
            } finally {
                confirmStatusUpdate.textContent = 'Update Status';
                confirmStatusUpdate.disabled = false;
                hideLoading();
            }
        });
    }

    // Attach "Update Status" from the detail modal
    const updateFromDetail = document.getElementById('updateStatusFromDetail');
    if (updateFromDetail) {
        updateFromDetail.addEventListener('click', () => {
            // Read status from hidden data or re-pass it
            const row = document.querySelector(`tr[data-id="${currentDetailOrderId}"]`);
            const currentStatus = row ? row.dataset.status : 'Pending';
            openStatusModal(currentDetailOrderId, currentStatus);
        });
    }

    // ==========================================
    // CANCEL ORDER
    // ==========================================

    window.cancelOrder = (orderId) => {
        showCustomConfirm(
            'Cancel Order',
            'Are you sure you want to cancel this order? This action cannot be undone.',
            async () => {
                showLoading("Cancelling order...");
                try {
                    const response = await fetch(`/admin/orders/${orderId}/cancel`, { method: 'PATCH' });
                    const data = await response.json();
                    if (data.success) {
                        showSuccessAlert('Cancelled', 'The order has been successfully cancelled.');
                        setTimeout(() => { showLoading('Refreshing...'); window.location.reload(); }, 1000);
                    } else {
                        showToast(data.message || 'Cancellation failed', 'error');
                    }
                } catch (err) {
                    showToast('Connection failed', 'error');
                } finally {
                    hideLoading();
                }
            }
        );
    };

    // ==========================================
    // UI UTILITIES (Matching user-management.js)
    // ==========================================

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

    function showSuccessAlert(title, message) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container" style="max-width: 420px; text-align: center;">
                <div class="modal-header" style="justify-content: center; border: none; padding-bottom: 0;">
                    <div style="background: rgba(39, 174, 96, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                        <i class="fas fa-check-circle" style="font-size: 2.5rem; color: #27ae60;"></i>
                    </div>
                </div>
                <h3 style="margin-bottom: 10px;">${title}</h3>
                <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">${message}</p>
                <div class="modal-footer" style="display: flex; gap: 12px; border: none; padding: 0;">
                    <button type="button" class="modal-btn confirm close-modal" style="flex: 1; background-color: #27ae60;">OK</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        const close = () => modal.remove();
        modal.querySelector('.close-modal').addEventListener('click', close);
        modal.querySelector('.modal-overlay').addEventListener('click', close);
    }

    function showCustomConfirm(title, message, onConfirm) {
        const modal = document.createElement('div');
        modal.className = 'custom-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-container">
                <div class="modal-header">
                    <div class="modal-icon-wrapper">
                        <i class="fas fa-exclamation-triangle"></i>
                    </div>
                </div>
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="modal-footer">
                    <button class="modal-btn confirm">Confirm</button>
                    <button class="modal-btn cancel">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('.modal-btn.cancel').addEventListener('click', closeModal);
        modal.querySelector('.modal-overlay').addEventListener('click', closeModal);
        modal.querySelector('.modal-btn.confirm').addEventListener('click', () => {
            closeModal();
            onConfirm();
        });
    }

    // ==========================================
    // KEYBOARD SHORTCUTS
    // ==========================================

    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            if (searchInput) searchInput.focus();
        }
        if (e.key === 'Escape') {
            document.querySelectorAll('.custom-modal').forEach(m => m.style.display = 'none');
        }
    });

    // Back-forward refresh
    window.addEventListener("pageshow", function (event) {
        const navEntries = performance.getEntriesByType('navigation');
        const isBackForward = navEntries.length > 0 && navEntries[0].type === 'back_forward';
        if (event.persisted || isBackForward) {
            window.location.reload();
        }
    });
    // ==========================================
    // PAGINATION LOADING INTERCEPTOR
    // ==========================================
    document.querySelectorAll('.pagination a').forEach(link => {
        link.addEventListener('click', () => showLoading('Loading page...'));
    });
});
