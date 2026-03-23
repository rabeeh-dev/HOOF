/**
 * @file public/user/js/layout.js
 * @description Global client-side logic for the user-facing site layout, including navigation and profile dropdowns.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // MOBILE NAVIGATION TOGGLE
    // ==========================================

    const toggle = document.getElementById("nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (toggle && navLinks) {
        toggle.addEventListener("click", () => navLinks.classList.toggle("open"));

        // Close mobile menu on link click
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => navLinks.classList.remove("open"));
        });
    }

    // ==========================================
    // PROFILE DROPDOWN FUNCTIONALITY
    // ==========================================

    const profileToggle = document.getElementById("profileToggle");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileToggle && profileDropdown) {
        // Toggle dropdown on profile icon click
        profileToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            profileDropdown.classList.toggle("active");
        });

        // Close dropdown when clicking outside
        document.addEventListener("click", (e) => {
            if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove("active");
            }
        });

        // Prevent dropdown from closing when clicking inside it
        profileDropdown.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // Handle dropdown menu item clicks
        profileDropdown.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                // 1. If it's the logout button, let the form submit naturally
                if (item.classList.contains('logout')) {
                    return;
                }

                // 2. Check if the item is a link (like the Profile link)
                if (item.getAttribute('href') && item.getAttribute('href') !== '#') {
                    profileDropdown.classList.remove("active");
                    return;
                }

                // 3. For placeholder items with "#", prevent default behavior
                if (item.getAttribute('href') === '#') {
                    e.preventDefault();
                    profileDropdown.classList.remove("active");
                }
            });
        });

        // Close dropdown on escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                profileDropdown.classList.remove("active");
            }
        });
    }
});
/**
 * Global helper to show the loading overlay
 * @param {string} text - Optional loading text to display
 */
function showLoading(text) {
    const overlay = document.getElementById("global-loading-overlay");
    if (overlay) {
        if (text) {
            const textEl = overlay.querySelector(".loading-text");
            if (textEl) textEl.textContent = text;
        }
        overlay.style.display = "flex";
    }
}

/**
 * Global helper to hide the loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById("global-loading-overlay");
    if (overlay) {
        overlay.style.display = "none";
    }
}

// Show loading overlay globally on all page navigations
window.addEventListener('beforeunload', () => {
    showLoading();
});

// Hide loading overlay if user navigated back (bfcache)
window.addEventListener("pageshow", (event) => {
    if (event.persisted) hideLoading();
});

// ==========================================
// SOCKET.IO REAL-TIME UPDATES
// ==========================================

(function () {
    if (typeof io === 'undefined') return;

    const socket = io();

    // ---------- PRODUCT BLOCKED/UNBLOCKED ----------
    socket.on('product:statusChanged', function (data) {
        const { productId, isBlocked } = data;

        // --- SHOP PAGE: product cards ---
        const shopCard = document.querySelector(`.product-card[data-product-id="${productId}"]`);
        if (shopCard) {
            if (isBlocked) {
                shopCard.classList.add('product-unavailable');
                // Add overlay if not present
                if (!shopCard.querySelector('.unavailable-overlay')) {
                    const imgDiv = shopCard.querySelector('.product-image');
                    if (imgDiv) {
                        const overlay = document.createElement('div');
                        overlay.className = 'unavailable-overlay';
                        overlay.innerHTML = '<span class="unavailable-text">UNAVAILABLE</span>';
                        imgDiv.prepend(overlay);
                    }
                }
                // Replace price with "Unavailable"
                const footer = shopCard.querySelector('.product-footer');
                if (footer) {
                    const price = footer.querySelector('.product-price');
                    const cartBtn = footer.querySelector('.add-to-cart-btn');
                    if (price) { price.className = 'product-price unavailable-price'; price.textContent = 'Unavailable'; }
                    if (cartBtn) cartBtn.style.display = 'none';
                }
                // Remove wishlist button
                const wishBtn = shopCard.querySelector('.wishlist-btn');
                if (wishBtn) wishBtn.style.display = 'none';
                // Disable clicks on image/name
                const img = shopCard.querySelector('.product-image img');
                const name = shopCard.querySelector('.product-name');
                if (img) { img.style.cursor = 'default'; img.onclick = null; img.removeAttribute('onclick'); }
                if (name) { name.style.cursor = 'default'; name.onclick = null; name.removeAttribute('onclick'); }
            } else {
                // Unblocked — reload the page to restore full state
                window.location.reload();
            }
        }

        // --- CART PAGE: cart items ---
        const cartItem = document.querySelector(`.cart-item[data-product-id="${productId}"]`);
        if (cartItem) {
            if (isBlocked) {
                cartItem.classList.add('cart-item-blocked');
                // Add overlay
                if (!cartItem.querySelector('.cart-blocked-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'cart-blocked-overlay';
                    overlay.innerHTML = '<span class="cart-blocked-tag"><i class="fas fa-ban"></i> UNAVAILABLE</span>';
                    cartItem.prepend(overlay);
                }
                // Hide qty controls
                const qtyCtrl = cartItem.querySelector('.qty-control');
                if (qtyCtrl) qtyCtrl.style.display = 'none';
                // Change price to unavailable
                const priceRow = cartItem.querySelector('.cart-item-price-row');
                if (priceRow) priceRow.innerHTML = '<span class="cart-item-unavailable-label">Unavailable</span>';
                // Show banner and disable checkout
                _showCartBlockedState();
            } else {
                // Unblocked — reload to restore
                window.location.reload();
            }
        }

        // --- WISHLIST PAGE: product cards ---
        const wishlistCard = document.querySelector(`#wishlist-item-${productId}`);
        if (wishlistCard) {
            if (isBlocked) {
                wishlistCard.classList.add('product-unavailable');
                const imgDiv = wishlistCard.querySelector('.product-image');
                if (imgDiv && !imgDiv.querySelector('.unavailable-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'unavailable-overlay';
                    overlay.innerHTML = '<span class="unavailable-text">UNAVAILABLE</span>';
                    imgDiv.prepend(overlay);
                }
                const footer = wishlistCard.querySelector('.product-footer');
                if (footer) {
                    const variant = footer.querySelector('.wishlist-variant-selector');
                    const priceRow = footer.querySelector('div:last-child');
                    if (variant) variant.style.display = 'none';
                    if (priceRow) priceRow.innerHTML = '<p class="product-price unavailable-price" style="margin:0;">Unavailable</p>';
                }
                const img = wishlistCard.querySelector('.product-image img');
                const name = wishlistCard.querySelector('.product-name');
                if (img) { img.removeAttribute('onclick'); img.style.cursor = 'default'; }
                if (name) { name.removeAttribute('onclick'); name.style.cursor = 'default'; }
            } else {
                window.location.reload();
            }
        }

        // Show toast if product found on this page
        if (shopCard || cartItem || wishlistCard) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: isBlocked ? 'warning' : 'success',
                    title: isBlocked ? 'Product Unavailable' : 'Product Available',
                    text: isBlocked ? 'A product has been marked as unavailable by the admin.' : 'A product is now available again.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 4000
                });
            }
        }
    });

    // ---------- CATEGORY LISTED/UNLISTED ----------
    socket.on('category:statusChanged', function (data) {
        const { categoryId, isListed } = data;

        if (!isListed) {
            // Unlist — find all products with this category and mark unavailable
            const cards = document.querySelectorAll(`[data-category-id="${categoryId}"]`);
            cards.forEach(function (card) {
                // Treat like a product block
                if (card.classList.contains('product-card') && !card.classList.contains('product-unavailable')) {
                    card.classList.add('product-unavailable');
                    const imgDiv = card.querySelector('.product-image');
                    if (imgDiv && !imgDiv.querySelector('.unavailable-overlay')) {
                        const overlay = document.createElement('div');
                        overlay.className = 'unavailable-overlay';
                        overlay.innerHTML = '<span class="unavailable-text">UNAVAILABLE</span>';
                        imgDiv.prepend(overlay);
                    }
                    const footer = card.querySelector('.product-footer');
                    if (footer) {
                        const price = footer.querySelector('.product-price');
                        const cartBtn = footer.querySelector('.add-to-cart-btn');
                        if (price) { price.className = 'product-price unavailable-price'; price.textContent = 'Unavailable'; }
                        if (cartBtn) cartBtn.style.display = 'none';
                    }
                }
                if (card.classList.contains('cart-item') && !card.classList.contains('cart-item-blocked')) {
                    card.classList.add('cart-item-blocked');
                    if (!card.querySelector('.cart-blocked-overlay')) {
                        const overlay = document.createElement('div');
                        overlay.className = 'cart-blocked-overlay';
                        overlay.innerHTML = '<span class="cart-blocked-tag"><i class="fas fa-ban"></i> UNAVAILABLE</span>';
                        card.prepend(overlay);
                    }
                    const qtyCtrl = card.querySelector('.qty-control');
                    if (qtyCtrl) qtyCtrl.style.display = 'none';
                    const priceRow = card.querySelector('.cart-item-price-row');
                    if (priceRow) priceRow.innerHTML = '<span class="cart-item-unavailable-label">Unavailable</span>';
                    _showCartBlockedState();
                }
            });
            if (cards.length > 0 && typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Category Unavailable',
                    text: 'A category has been unlisted. Some products may be unavailable.',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 4000
                });
            }
        } else {
            // Re-listed — reload to restore
            const cards = document.querySelectorAll(`[data-category-id="${categoryId}"]`);
            if (cards.length > 0) window.location.reload();
        }
    });

    // Helper: show blocked state in cart summary
    function _showCartBlockedState() {
        const summaryCol = document.querySelector('.order-summary');
        if (!summaryCol) return;

        // Add banner if not already there
        const container = document.querySelector('.cart-section .container');
        if (container && !container.querySelector('.cart-blocked-banner')) {
            const banner = document.createElement('div');
            banner.className = 'cart-blocked-banner';
            banner.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>Some items in your bag are currently unavailable and have been excluded from your total. Please remove them to proceed.</span>';
            const layout = container.querySelector('.cart-layout');
            if (layout) container.insertBefore(banner, layout);
        }

        // Disable checkout button
        const checkoutBtn = summaryCol.querySelector('.checkout-btn');
        if (checkoutBtn && !checkoutBtn.classList.contains('checkout-btn-disabled')) {
            // Replace with disabled button
            const disabledBtn = document.createElement('button');
            disabledBtn.className = 'checkout-btn checkout-btn-disabled';
            disabledBtn.disabled = true;
            disabledBtn.textContent = 'Proceed to Checkout';

            // Add message
            if (!summaryCol.querySelector('.checkout-blocked-msg')) {
                const msg = document.createElement('div');
                msg.className = 'checkout-blocked-msg';
                msg.innerHTML = '<i class="fas fa-info-circle"></i><span>Remove unavailable items to checkout</span>';
                checkoutBtn.parentNode.insertBefore(msg, checkoutBtn);
            }
            checkoutBtn.parentNode.replaceChild(disabledBtn, checkoutBtn);
        }

        // Recalc totals excluding blocked items
        let newTotal = 0;
        let newItems = 0;
        document.querySelectorAll('.cart-item').forEach(function (item) {
            if (!item.classList.contains('cart-item-blocked')) {
                const priceEl = item.querySelector('.cart-item-sale-price');
                const qtyEl = item.querySelector('.qty-count');
                if (priceEl && qtyEl) {
                    const price = parseFloat(priceEl.textContent.replace(/[^\d.]/g, '')) || 0;
                    const qty = parseInt(qtyEl.textContent) || 0;
                    newTotal += price * qty;
                    newItems += qty;
                }
            }
        });

        const subtotalEl = document.getElementById('summary-subtotal');
        const shippingEl = document.getElementById('summary-shipping');
        const totalEl = document.getElementById('summary-total');
        const countEl = document.querySelector('.cart-toolbar .results-count span');

        const shipping = newTotal >= 999 ? 0 : 99;
        if (subtotalEl) subtotalEl.textContent = '₹' + newTotal;
        if (shippingEl) {
            shippingEl.textContent = shipping === 0 ? 'FREE' : '₹' + shipping;
            shippingEl.className = shipping === 0 ? 'shipping-free' : '';
        }
        if (totalEl) totalEl.textContent = '₹' + (newTotal + shipping);
        if (countEl) countEl.textContent = newItems;
    }
})();
