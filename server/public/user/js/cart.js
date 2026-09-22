/**
 * @file public/user/js/cart.js
 * @description Client-side logic for the cart page.
 */

// ==========================================
// TOAST NOTIFICATIONS (Self-contained)
// ==========================================

function showToast(message, type = "info") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    const borderColor = type === "success" ? "#2ecc71" : type === "error" ? "#dc3545" : "#3498db";
    toast.style.cssText = `
    position: fixed; top: 100px; right: 20px;
    background: white; padding: 1rem 2rem; border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000;
    border-left: 5px solid ${borderColor};
    animation: fadeIn 0.3s ease;
  `;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ==========================================
// UPDATE QUANTITY
// ==========================================

async function updateQuantity(productId, change) {
    const qtySpan = document.getElementById(`qty-${productId}`);
    if (!qtySpan) return;

    let currentQty = parseInt(qtySpan.innerText);
    let newQty = currentQty + change;

    // Minimum limit check
    if (newQty < 1) {
        // Optional: Ask for confirmation to remove
        return;
    }

    // Maximum limit check (5 per item)
    if (newQty > 5) {
        Swal.fire({
            icon: 'warning',
            title: 'Limit Exceeded',
            text: 'You can only add a maximum of 5 items per product.',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
        return;
    }

    try {
        const response = await fetch("/user/cart/update", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity: newQty }),
        });
        const result = await response.json();

        if (result.success) {
            // Update count in DOM
            qtySpan.textContent = newQty;

            // Update summary totals
            updateSummary(result.cart);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || "Could not update quantity",
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: "Something went wrong",
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    }
}

// ==========================================
// REMOVE ITEM
// ==========================================

async function removeItem(productId) {
    try {
        const response = await fetch(`/user/cart/remove/${productId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();

        if (result.success) {
            const card = document.getElementById(`cart-item-${productId}`);
            if (card) {
                card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                card.style.opacity = "0";
                card.style.transform = "translateX(30px)";
                setTimeout(() => {
                    card.remove();
                    // If no items left, reload page to show empty state
                    if (!document.querySelector(".cart-item")) {
                        window.location.reload();
                    }
                }, 300);
            }

            // Update badge
            const badge = document.querySelector(".cart-count");
            if (badge && result.cart) {
                badge.textContent = result.cart.totalItems;
            }

            updateSummary(result.cart);
            showToast("Removed from bag", "success");
        } else {
            showToast(result.message || "Could not remove item", "error");
        }
    } catch (err) {
        showToast("Error removing item", "error");
    }
}

// ==========================================
// UPDATE SUMMARY (Live DOM Update)
// ==========================================

function updateSummary(cart) {
    if (!cart) return;

    const subtotalEl = document.getElementById("summary-subtotal");
    const shippingEl = document.getElementById("summary-shipping");
    const totalEl = document.getElementById("summary-total");
    const countEl = document.querySelector(".cart-toolbar .results-count span");

    const subtotal = cart.totalAmount || 0;
    const shipping = subtotal >= 999 ? 0 : 99;
    const total = subtotal + shipping;

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal}`;
    if (shippingEl) {
        shippingEl.textContent = shipping === 0 ? "FREE" : `₹${shipping}`;
        shippingEl.className = shipping === 0 ? "shipping-free" : "";
    }
    if (totalEl) totalEl.textContent = `₹${total}`;
    if (countEl) countEl.textContent = cart.totalItems || 0;
}

// ==========================================
// PROMO CODE (Placeholder)
// ==========================================


// ==========================================
// PAGESHOW CACHE BUSTER
// ==========================================

window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});

// ==========================================
// BLOCKED PRODUCT ALERT (on redirect from checkout)
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(window.location.search);
    if (params.get("unavailable") === "1") {
        Swal.fire({
            icon: 'error',
            title: 'Products Unavailable',
            text: 'Some products in your cart are currently unavailable and cannot be purchased. Please remove them and try again.',
            confirmButtonColor: '#dc3545'
        });
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
    }
});

