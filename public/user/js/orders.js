/**
 * @file public/user/js/orders.js
 * @description Order management page logic — tabs, filter, search, cancel, return, invoice.
 */

// Global Toast Notification
window.showToast = function (message, type = "success") {
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
};

// Global: Initiate Cancel
window.initiateCancel = function (orderId) {
  window.orderToCancel = orderId;
  const modal = document.getElementById('cancelConfirmModal');
  const summaryEl = document.getElementById('cancelSummary');

  if (!modal) return;

  // Get info from card text or data attributes
  const card = document.querySelector(`.order-card[data-id="${orderId}"]`);
  const total = card ? card.dataset.total : '0';
  const itemsCount = card ? card.querySelectorAll('.order-item-row').length : 0;

  // Show summary
  if (summaryEl) {
    summaryEl.innerHTML = `
      <p><strong>Order Total:</strong> ₹${Number(total).toLocaleString('en-IN')}</p>
      <p><strong>Items:</strong> ${itemsCount}</p>
    `;
  }

  modal.style.display = 'flex';
};

// Global: Close Cancel Modal
window.closeCancelModal = function () {
  const modal = document.getElementById('cancelConfirmModal');
  if (modal) modal.style.display = 'none';
  window.orderToCancel = null;
};

// Global wrapper for list view buttons (calls global function)
window.cancelOrder = function (orderId) {
  window.initiateCancel(orderId);
}

// Global: Request Return (Opens Modal)
window.requestReturn = function (orderId) {
  window.orderToReturn = orderId;
  const modal = document.getElementById('returnConfirmModal');
  const summaryEl = document.getElementById('returnSummary');

  if (!modal) return;

  const card = document.querySelector(`.order-card[data-id="${orderId}"]`);
  const total = card ? card.dataset.total : '0';
  const itemsCount = card ? card.querySelectorAll('.order-item-row').length : 0;

  if (summaryEl) {
    summaryEl.innerHTML = `
      <p><strong>Order Total:</strong> ₹${Number(total).toLocaleString('en-IN')}</p>
      <p><strong>Items:</strong> ${itemsCount}</p>
    `;
  }

  modal.style.display = 'flex';
};

// Global: Close Return Modal
window.closeReturnModal = function () {
  const modal = document.getElementById('returnConfirmModal');
  if (modal) modal.style.display = 'none';
  window.orderToReturn = null;

  // Clear modal inputs
  const texts = document.getElementById('returnReasonText');
  const error = document.getElementById('returnReasonError');
  if (texts) {
    texts.style.display = 'none';
    texts.value = '';
  }
  if (error) error.style.display = 'none';
  const radios = document.querySelectorAll('input[name="returnReason"]');
  radios.forEach(r => r.checked = false);
};

// Global: Download Invoice
window.downloadInvoice = async function (orderId) {
  try {
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
  } catch (err) {
    showToast("Invoice not available", "error");
  }
};

// Global: Retry Payment
window.retryPayment = async function (orderId) {
  const retryBtn = document.getElementById(`retry-btn-${orderId}`);
  if (retryBtn) {
    retryBtn.disabled = true;
    const originalText = retryBtn.innerHTML;
    retryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing...';
  }

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
              if (retryBtn) {
                retryBtn.disabled = false;
                retryBtn.innerHTML = originalText;
              }
            }
          } catch (err) {
            console.error(err);
            showToast("Verification error", "error");
            if (retryBtn) {
              retryBtn.disabled = false;
              retryBtn.innerHTML = originalText;
            }
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
            if (retryBtn) {
              retryBtn.disabled = false;
              retryBtn.innerHTML = originalText;
            }
          }
        }
      };
      const rzp = new Razorpay(options);
      rzp.open();
    } else {
      showToast(result.message || "Failed to start payment", "error");
      if (retryBtn) {
        retryBtn.disabled = false;
        retryBtn.innerHTML = originalText;
      }
      hideLoading();
    }
  } catch (err) {
    console.error(err);
    showToast("Something went wrong", "error");
    if (retryBtn) {
      retryBtn.disabled = false;
      retryBtn.innerHTML = originalText;
    }
    hideLoading();
  }
};

// Event Listeners (Tabs, Filters, Modals)
document.addEventListener("DOMContentLoaded", () => {

  // Tab Logic
  const tabAll = document.getElementById("tabAll");
  const tabReturns = document.getElementById("tabReturns");
  window.currentTab = "all";

  function switchTab(tab) {
    window.currentTab = tab;
    if (tabAll) tabAll.classList.toggle("active", tab === "all");
    if (tabReturns) tabReturns.classList.toggle("active", tab === "returns");
    filterOrders();
  }

  if (tabAll) tabAll.addEventListener("click", () => switchTab("all"));
  if (tabReturns) tabReturns.addEventListener("click", () => switchTab("returns"));

  // Filter Logic
  const statusFilter = document.getElementById("statusFilter");
  const orderSearch = document.getElementById("orderSearch");
  let searchDebounce;

  function filterOrders() {
    const statusVal = statusFilter ? statusFilter.value.toLowerCase() : "";
    const searchVal = orderSearch ? orderSearch.value.toLowerCase().trim() : "";
    const cards = document.querySelectorAll(".order-card");

    cards.forEach(card => {
      const cardStatus = (card.dataset.status || "").toLowerCase();
      const cardId = (card.dataset.id || "").toLowerCase();
      const cardText = card.innerText.toLowerCase();

      // Tab filter
      let tabMatch = true;
      if (window.currentTab === "returns") {
        const returnStatuses = ["returned", "return requested"];
        tabMatch = returnStatuses.some(s => cardStatus.includes(s));
      }

      // Status dropdown filter
      const statusMatch = !statusVal || cardStatus === statusVal;

      // Search filter
      const searchMatch = !searchVal || cardId.includes(searchVal) || cardText.includes(searchVal);

      card.style.display = (tabMatch && statusMatch && searchMatch) ? "" : "none";
    });
  }

  if (statusFilter) statusFilter.addEventListener("change", filterOrders);
  if (orderSearch) {
    orderSearch.addEventListener("input", () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(filterOrders, 300);
    });
  }

  // Cancel Confirmation Button
  const confirmCancelBtn = document.getElementById('confirmCancelBtn');
  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', async () => {
      if (!window.orderToCancel) return;

      const btn = document.getElementById('confirmCancelBtn');
      const originalText = btn.innerText;
      btn.innerText = "Cancelling...";
      btn.disabled = true;

      try {
        const res = await fetch(`/user/orders/cancel/${window.orderToCancel}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" }
        });
        const result = await res.json();

        if (result.success) {
          showToast("Order cancelled successfully", "success");
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast(result.message || "Failed to cancel order", "error");
          btn.innerText = originalText;
          btn.disabled = false;
        }
      } catch (err) {
        showToast("Something went wrong", "error");
        btn.innerText = originalText;
        btn.disabled = false;
      }
    });
  }

  // Page Cache Buster
  window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
      window.location.reload();
    }
  });

  // Global click for modal overlays
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeCancelModal();
      closeReturnModal();
    }
  });

  // Return Modal Reason Toggle
  const returnReasonRadios = document.querySelectorAll('input[name="returnReason"]');
  const returnReasonText = document.getElementById('returnReasonText');
  const returnReasonError = document.getElementById('returnReasonError');

  returnReasonRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      if (returnReasonError) returnReasonError.style.display = 'none';
      if (e.target.value === 'Other') {
        if (returnReasonText) {
          returnReasonText.style.display = 'block';
          returnReasonText.focus();
        }
      } else {
        if (returnReasonText) {
          returnReasonText.style.display = 'none';
          returnReasonText.value = '';
        }
      }
    });
  });

  // Return Confirmation Button
  const confirmReturnBtn = document.getElementById('confirmReturnBtn');
  if (confirmReturnBtn) {
    confirmReturnBtn.addEventListener('click', async () => {
      if (!window.orderToReturn) return;

      const selectedRadio = document.querySelector('input[name="returnReason"]:checked');
      let reason = "";

      if (selectedRadio) {
        reason = selectedRadio.value === 'Other' ? (returnReasonText ? returnReasonText.value.trim() : '') : selectedRadio.value;
      }

      if (!reason) {
        if (returnReasonError) returnReasonError.style.display = 'block';
        if (returnReasonText && selectedRadio && selectedRadio.value === 'Other') returnReasonText.focus();
        return;
      }

      const originalText = confirmReturnBtn.innerText;
      confirmReturnBtn.innerText = "Requesting...";
      confirmReturnBtn.disabled = true;

      try {
        const res = await fetch(`/user/orders/return/${window.orderToReturn}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason })
        });
        const result = await res.json();

        if (result.success) {
          showToast("Return requested successfully", "success");
          setTimeout(() => window.location.reload(), 800);
        } else {
          showToast(result.message || "Failed to request return", "error");
          confirmReturnBtn.innerText = originalText;
          confirmReturnBtn.disabled = false;
        }
      } catch (err) {
        showToast("Something went wrong", "error");
        confirmReturnBtn.innerText = originalText;
        confirmReturnBtn.disabled = false;
        closeReturnModal();
      }
    });
  }
});
