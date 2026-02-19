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

// Global: Request Return
window.requestReturn = async function (orderId) {
  if (!confirm("Request a return for this order?")) return;
  try {
    const res = await fetch(`/user/orders/return/${orderId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" }
    });
    const result = await res.json();
    if (result.success) {
      showToast("Return requested successfully", "success");
      setTimeout(() => window.location.reload(), 800);
    } else {
      showToast(result.message || "Failed to request return", "error");
    }
  } catch (err) {
    showToast("Something went wrong", "error");
  }
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

  // Global click for modal overlay (only needed for cancel modal now)
  window.addEventListener("click", (e) => {
    if (e.target.classList.contains("modal-overlay")) {
      closeCancelModal();
    }
  });
});
