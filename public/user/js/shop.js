/**
 * HOOF - Shop Functionality
 * Handles Server-Side filtering, sorting, and UI interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- SELECTORS ---
    const filterToggle = document.getElementById("filterToggle");
    const sidebarContent = document.getElementById("sidebarContent");
    const priceRange = document.getElementById("priceRange");
    const maxPriceDisplay = document.getElementById("maxPriceDisplay");
    const sortSelect = document.getElementById("sortSelect");

    // --- 1. MOBILE FILTER TOGGLE ---
    if (filterToggle) {
        filterToggle.addEventListener("click", () => {
            sidebarContent.classList.toggle("open");
            const icon = filterToggle.querySelector("i");
            icon.classList.toggle("fa-filter");
            icon.classList.toggle("fa-times");
        });
    }

    // --- 2. PRICE RANGE DISPLAY ---
    if (priceRange) {
        priceRange.addEventListener("input", (e) => {
            maxPriceDisplay.value = e.target.value;
        });
    }

    // --- 2.1 SEARCH INTERACTION ---
    const searchInput = document.getElementById("searchInput");
    if (searchInput) {
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") {
                window.applyFilters();
            }
        });
    }

    // --- 3. SERVER-SIDE FILTERING LOGIC ---
    // This function gathers all active filters and reloads the page with a Query String
    window.applyFilters = () => {
        const urlParams = new URLSearchParams(window.location.search);

        // Update Sort
        if (sortSelect) {
            urlParams.set("sort", sortSelect.value);
        }

        // Update Max Price
        if (priceRange) {
            urlParams.set("maxPrice", priceRange.value);
        }

        // Update Search
        const searchInput = document.getElementById("searchInput");
        if (searchInput && searchInput.value.trim() !== "") {
            urlParams.set("search", searchInput.value.trim());
        } else {
            urlParams.delete("search");
        }

        // Reset to page 1 on new filter
        urlParams.set("page", "1");

        // Redirect with new parameters
        window.location.href = `${window.location.pathname}?${urlParams.toString()}`;
    };
});

/**
 * Global Add to Cart Function
 * @param {string} productId - MongoDB ID of the product
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
            // Update cart count badge if it exists
            const badge = document.querySelector(".cart-count");
            if (badge) badge.textContent = parseInt(badge.textContent) + 1;
        } else {
            showToast(result.message || "Login required", "info");
        }
    } catch (err) {
        showToast("Error adding to cart", "error");
    }
}

/**
 * Toast Notifications
 */
function showToast(message, type = "info") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.style.cssText = `
        position: fixed; top: 100px; right: 20px; 
        background: white; padding: 1rem 2rem; border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1); z-index: 1000;
        border-left: 5px solid ${type === 'success' ? '#2ecc71' : '#3498db'};
    `;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// Add this to your main script/navbar script
function performSearch() {
    const searchInput = document.getElementById('navSearchInput');
    const query = searchInput.value.trim();
    if (query) {
        window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
}

// Event listener for Enter key
document.getElementById('navSearchInput')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});