/**
 * @file public/user/js/wishlist.js
 * @description Client-side logic for the wishlist page.
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
// REMOVE FROM WISHLIST
// ==========================================

async function removeFromWishlist(productId) {
    try {
        const response = await fetch(`/user/wishlist/remove/${productId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();

        if (result.success) {
            const card = document.getElementById(`wishlist-item-${productId}`);
            if (card) {
                card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                card.style.opacity = "0";
                card.style.transform = "scale(0.8)";
                setTimeout(() => {
                    card.remove();
                    updateWishlistCount();
                    // If no items left, reload to show empty state
                    if (!document.querySelector(".product-card")) {
                        window.location.reload();
                    }
                }, 300);
            }
            showToast("Removed from wishlist", "info");
        } else {
            showToast(result.message || "Could not remove item", "error");
        }
    } catch (err) {
        showToast("Error removing item", "error");
    }
}

// ==========================================
// ADD TO CART FROM WISHLIST
// ==========================================

async function addToCartFromWishlist(productId) {
    try {
        const response = await fetch("/user/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity: 1 }),
        });
        const result = await response.json();

        if (result.success) {
            showToast("Added to bag!", "success");
            const badge = document.querySelector(".cart-count");
            if (badge) {
                badge.textContent = parseInt(badge.textContent) + 1;
            }
        } else {
            showToast(result.message || "Login required", "info");
        }
    } catch (err) {
        showToast("Error adding to cart", "error");
    }
}

// ==========================================
// MOVE TO CART (Add + Remove)
// ==========================================

async function moveToCart(productId) {
    try {
        const response = await fetch("/user/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity: 1 }),
        });
        const result = await response.json();

        if (result.success) {
            const badge = document.querySelector(".cart-count");
            if (badge) badge.textContent = parseInt(badge.textContent) + 1;
            await removeFromWishlist(productId);
            showToast("Moved to bag!", "success");
        } else {
            showToast(result.message || "Login required", "info");
        }
    } catch (err) {
        showToast("Error moving to cart", "error");
    }
}

// ==========================================
// MOVE ALL TO CART
// ==========================================

async function moveAllToCart() {
    try {
        const response = await fetch("/user/wishlist/move-all", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();

        if (result.success) {
            showToast("All items moved to bag!", "success");
            setTimeout(() => window.location.reload(), 800);
        } else {
            showToast(result.message || "Could not move items", "error");
        }
    } catch (err) {
        showToast("Error moving items", "error");
    }
}

// ==========================================
// CLEAR WISHLIST
// ==========================================

async function clearWishlist() {
    if (!confirm("Remove all items from your wishlist?")) return;

    try {
        const response = await fetch("/user/wishlist/clear", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
        });
        const result = await response.json();

        if (result.success) {
            const cards = document.querySelectorAll(".product-card");
            cards.forEach((card, i) => {
                setTimeout(() => {
                    card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
                    card.style.opacity = "0";
                    card.style.transform = "scale(0.8)";
                }, i * 50);
            });
            setTimeout(() => window.location.reload(), cards.length * 50 + 400);
        } else {
            showToast(result.message || "Could not clear wishlist", "error");
        }
    } catch (err) {
        showToast("Error clearing wishlist", "error");
    }
}

// ==========================================
// UPDATE WISHLIST COUNT IN TOOLBAR
// ==========================================

function updateWishlistCount() {
    const countEl = document.querySelector(".wishlist-toolbar .results-count span");
    const remaining = document.querySelectorAll(".product-card").length;
    if (countEl) countEl.textContent = remaining;
}

// ==========================================
// PAGESHOW CACHE BUSTER
// ==========================================

window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});
