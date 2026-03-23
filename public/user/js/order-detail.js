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

// Request Return Action - Opens Modal
function requestReturnFromDetail(orderId) {
    const modal = document.getElementById('returnConfirmModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Close Return Modal
function closeReturnModal() {
    const modal = document.getElementById('returnConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Setup Return Modal Reason Toggle
document.addEventListener('DOMContentLoaded', () => {
    const reasonRadios = document.querySelectorAll('input[name="returnReason"]');
    const reasonText = document.getElementById('returnReasonText');
    const reasonError = document.getElementById('returnReasonError');

    reasonRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (reasonError) reasonError.style.display = 'none';
            if (e.target.value === 'Other') {
                if (reasonText) {
                    reasonText.style.display = 'block';
                    reasonText.focus();
                }
            } else {
                if (reasonText) {
                    reasonText.style.display = 'none';
                    reasonText.value = ''; // clear
                }
            }
        });
    });
});

// Confirm Return - Actual API Call
async function confirmReturnAction(orderId) {
    const btn = document.getElementById('confirmReturnBtn');
    const reasonError = document.getElementById('returnReasonError');
    const selectedRadio = document.querySelector('input[name="returnReason"]:checked');
    const reasonText = document.getElementById('returnReasonText');

    let reason = "";
    if (selectedRadio) {
        reason = selectedRadio.value === 'Other' ? (reasonText ? reasonText.value.trim() : '') : selectedRadio.value;
    }

    if (!reason) {
        if (reasonError) reasonError.style.display = 'block';
        if (reasonText && selectedRadio && selectedRadio.value === 'Other') reasonText.focus();
        return;
    }

    const originalText = btn ? btn.innerHTML : 'Yes, Return';

    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';
    }

    try {
        const res = await fetch(`/user/orders/return/${orderId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason })
        });
        const result = await res.json();

        if (result.success) {
            showToast("Return requested successfully", "success");
            setTimeout(() => window.location.reload(), 1000);
        } else {
            showToast(result.message || "Failed to request return", "error");
            closeReturnModal();
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        }
    } catch (err) {
        console.error(err);
        showToast("Something went wrong", "error");
        closeReturnModal();
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
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
            const cancelModal = document.getElementById('cancelConfirmModal');
            if (cancelModal && cancelModal.style.display === 'flex') {
                closeCancelModal();
            }
        }
    });

    // Retry Payment Logic
    const retryBtn = document.getElementById("retryPaymentBtn");
    if (retryBtn) {
        retryBtn.addEventListener("click", async () => {
            const orderId = retryBtn.getAttribute("data-order-id");
            retryBtn.disabled = true;
            const originalText = retryBtn.innerHTML;
            retryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing...';
            showLoading("Re-initializing payment...");

            try {
                const response = await fetch("/user/checkout/retry-payment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId })
                });

                const result = await response.json();

                if (result.success) {
                    hideLoading();
                    const options = {
                        key: result.keyId,
                        amount: result.amount,
                        currency: result.currency,
                        name: "HOOF SHOES",
                        description: "Retry Order Payment",
                        image: "/user/images/home-images/logo.png",
                        order_id: result.razorpayOrderId,
                        handler: async function (response) {
                            try {
                                showLoading("Verifying your payment...");
                                const verifyBody = {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderId: result.orderId
                                };

                                const verifyRes = await fetch("/user/checkout/verify-payment", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(verifyBody)
                                });

                                const verifyResult = await verifyRes.json();
                                if (verifyResult.success) {
                                    window.location.href = verifyResult.redirectUrl;
                                } else {
                                    showToast(verifyResult.message || "Verification failed", "error");
                                    retryBtn.disabled = false;
                                    retryBtn.innerHTML = originalText;
                                }
                            } catch (err) {
                                console.error(err);
                                showToast("Verification error", "error");
                                retryBtn.disabled = false;
                                retryBtn.innerHTML = originalText;
                            } finally {
                                hideLoading();
                            }
                        },
                        prefill: {
                            name: result.user.name,
                            email: result.user.email
                        },
                        theme: { color: "#ff914d" },
                        modal: {
                            ondismiss: function () {
                                showToast("Payment cancelled", "info");
                                retryBtn.disabled = false;
                                retryBtn.innerHTML = originalText;
                            }
                        }
                    };
                    const rzp = new Razorpay(options);
                    rzp.open();
                } else {
                    showToast(result.message || "Failed to start payment", "error");
                    retryBtn.disabled = false;
                    retryBtn.innerHTML = originalText;
                    hideLoading();
                }
            } catch (err) {
                console.error(err);
                showToast("Something went wrong", "error");
                retryBtn.disabled = false;
                retryBtn.innerHTML = originalText;
                hideLoading();
            }
        });
    }
});

// Cache Buster
window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});
