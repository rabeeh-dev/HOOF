/**
 * @file public/user/js/shop.js
 * @description Logic for the shop page, including server-side filtering, sorting, search, and "Add to Cart" interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // SELECTORS & INITIALIZATION
    // ==========================================

    const filterToggle = document.getElementById("filterToggle");
    const sidebarContent = document.getElementById("sidebarContent");
    const priceRange = document.getElementById("priceRange");
    const maxPriceDisplay = document.getElementById("maxPriceDisplay");
    const sortSelect = document.getElementById("sortSelect");
    const searchInput = document.getElementById("searchInput");

    // ==========================================
    // MOBILE UI INTERACTIONS
    // ==========================================

    if (filterToggle) {
        // Toggle filter sidebar on mobile
        filterToggle.addEventListener("click", () => {
            sidebarContent.classList.toggle("open");
            const icon = filterToggle.querySelector("i");
            icon.classList.toggle("fa-filter");
            icon.classList.toggle("fa-times");
        });
    }

    // ==========================================
    // FILTER & SEARCH INTERACTIONS
    // ==========================================

    if (priceRange) {
        // Update price display as user slides
        priceRange.addEventListener("input", (e) => {
            maxPriceDisplay.value = e.target.value;
        });
    }

    if (searchInput) {
        // Apply filters on search input Enter key
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                window.applyFilters();
            }
        });
    }

    // ==========================================
    // SERVER-SIDE FILTERING LOGIC
    // ==========================================

    /**
     * Gathers all active filters/sort and reloads the page with query parameters.
     */
    window.applyFilters = () => {
        const urlParams = new URLSearchParams(window.location.search);

        // Update Sort parameters
        if (sortSelect) {
            urlParams.set("sort", sortSelect.value);
        }

        // Update Price parameters
        if (priceRange) {
            urlParams.set("maxPrice", priceRange.value);
        }

        // Update Search parameters
        if (searchInput && searchInput.value.trim() !== "") {
            urlParams.set("search", searchInput.value.trim());
        } else {
            urlParams.delete("search");
        }

        // Reset to page 1 on filter change
        urlParams.set("page", "1");

        // Redirect to apply filters
        window.location.href = `${window.location.pathname}?${urlParams.toString()}`;
    };
});

// ==========================================
// CART OPERATIONS
// ==========================================

/**
 * Global function to add a product to the user's cart.
 * @param {string} productId - MongoDB ID of the product.
 */
async function addToCart(productId) {
    try {
        const response = await fetch('/user/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId, quantity: 1 })
        });

        const result = await response.json();

        if (result.success) {
            showToast("Added to bag!", "success");
            // Update cart count badge if available
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
// TOAST NOTIFICATIONS
// ==========================================

/**
 * Displays a toast notification message.
 * @param {string} message - Message content.
 * @param {string} type - Notification type: success, info, error.
 */
function showToast(message, type = "info") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
    position: fixed; 
    top: 100px; 
    right: 20px; 
    background: white; 
    padding: 1rem 2rem; 
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
    z-index: 1000;
    border-left: 5px solid ${type === 'success' ? '#2ecc71' : '#3498db'};
  `;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ==========================================
// NAVBAR SEARCH
// ==========================================

/**
 * Performs a global search from the navbar.
 */
function performSearch() {
    const navSearch = document.getElementById('navSearchInput');
    const query = navSearch?.value.trim();
    if (query) {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
}

// Listener for navbar search Enter key
document.getElementById('navSearchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});