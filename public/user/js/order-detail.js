/**
 * @file public/user/js/order-detail.js
 * @description Logic for order detail page actions (Cancel, Return, Invoice, Support) and UI interactions.
 */

// Local Toast Notification (Self-contained)
function showToast(message, type = "success") {
    const existing = document.querySelector('.toast-notification');
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
    <span>${message}</span>
  `;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 50);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Cancel Order Action - Opens Modal
function cancelOrderFromDetail(orderId) {
    const modal = document.getElementById('cancelConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close Cancel Modal
function closeCancelModal() {
    const modal = document.getElementById('cancelConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Confirm Cancel - Actual API Call
async function confirmCancelAction(orderId) {
    const btn = document.getElementById('confirmCancelBtn');
    const originalText = btn.innerHTML;

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';
    }

    try {
        const res = await fetch(`/user/orders/cancel/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });
        const result = await res.json();

        if (result.success) {
            showToast("Order cancelled successfully", "success");
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.message || "Failed to cancel order", "error");
            closeCancelModal();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    } catch (err) {
        console.error(err);
        showToast("Something went wrong", "error");
        closeCancelModal();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
}

// Request Return Action
async function requestReturnFromDetail(orderId) {
    if (!confirm("Request a return for this order?")) return;

    const btn = document.querySelector('.action-btn-return');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';
    }

    try {
        const res = await fetch(`/user/orders/return/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
        });
        const result = await res.json();

        if (result.success) {
            showToast("Return requested successfully", "success");
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.message || "Failed to request return", "error");
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-undo"></i> Return Order';
            }
        }
    } catch (err) {
        console.error(err);
        showToast("Something went wrong", "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-undo"></i> Return Order';
        }
    }
}

// Download Invoice Action
async function downloadInvoiceFromDetail(orderId) {
    try {
        showToast("Generating invoice...", "info");
        const res = await fetch(`/user/orders/invoice/${orderId}`);
        if (!res.ok) throw new Error("Not available");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `invoice-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Invoice downloaded", "success");
    } catch (err) {
        console.error(err);
        showToast("Invoice not available", "error");
    }
}

// Support Modal Logic
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Image Hover Effect (JS as requested)
document.addEventListener("DOMContentLoaded", () => {
    const productImages = document.querySelectorAll('.detail-item-image');

    productImages.forEach(img => {
        img.addEventListener('mouseover', () => {
            img.classList.add('hover-scale');
        });

        img.addEventListener('mouseout', () => {
            img.classList.remove('hover-scale');
        });
    });

    // Modal overlay click handling
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            closeSupportModal();
            // Handle cancel modal overlay too if generic class is used, 
            // but specific closeCancelModal is safer for avoiding conflicts
            const cancelModal = document.getElementById('cancelConfirmModal');
            if (cancelModal && cancelModal.style.display === 'flex') {
                closeCancelModal();
            }
        }
    });
});

// Cache Buster
window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});
