/**
 * @file public/user/js/wishlist.js
 * @description Client-side logic for the wishlist page with SweetAlert notifications.
 */

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
            removeItemFromDOM(productId);
            Swal.fire({
                icon: 'success',
                title: 'Removed',
                text: 'Item removed from wishlist',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || "Could not remove item",
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
// ADD TO CART (Moves from Wishlist to Cart)
// ==========================================

async function addToCartFromWishlist(productId) {
    try {
        const variantSelect = document.getElementById(`variant-select-${productId}`);
        const size = variantSelect ? variantSelect.value : null;

        if (!size) {
            Swal.fire({
                icon: 'warning',
                title: 'Select Size',
                text: 'Please select a size before adding to cart',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
            return;
        }

        // Backend now handles removing from wishlist when added to cart
        const response = await fetch("/user/cart/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId, quantity: 1, size }),
        });
        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Added to Bag',
                text: 'Item moved to your shopping bag',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });

            // Update Cart Count
            const cartBadge = document.querySelector(".cart-count");
            if (cartBadge) {
                // Fetch fresh count or increment (safer to just increment for visual speed)
                let current = parseInt(cartBadge.innerText) || 0;
                cartBadge.innerText = current + 1;
            }

            // Remove from Wishlist UI
            removeItemFromDOM(productId);

        } else {
            Swal.fire({
                icon: 'info',
                text: result.message || "Could not add to cart",
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
            text: "Error adding to cart",
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
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
            Swal.fire({
                icon: 'success',
                title: 'Success',
                text: 'All items moved to bag!',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.reload();
            });
        } else {
            Swal.fire({
                icon: 'info',
                text: result.message || "Could not move items"
            });
        }
    } catch (err) {
        console.error(err);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: "Something went wrong"
        });
    }
}

// ==========================================
// CLEAR WISHLIST
// ==========================================

async function clearWishlist() {
    const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will remove all items from your wishlist.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#000',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, clear it!'
    });

    if (result.isConfirmed) {
        try {
            const response = await fetch("/user/wishlist/clear", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
            const data = await response.json();

            if (data.success) {
                Swal.fire(
                    'Cleared!',
                    'Your wishlist is empty.',
                    'success'
                ).then(() => {
                    window.location.reload();
                });
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (err) {
            Swal.fire('Error', 'Could not clear wishlist', 'error');
        }
    }
}

// ==========================================
// HELPER: REMOVE ITEM DOM & UPDATE COUNTS
// ==========================================

function removeItemFromDOM(productId) {
    const card = document.getElementById(`wishlist-item-${productId}`);
    if (card) {
        card.style.transition = "opacity 0.3s ease, transform 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.8)";

        setTimeout(() => {
            card.remove();
            updateWishlistCount();

            // Check if empty
            if (!document.querySelector(".product-card")) {
                location.reload(); // Reload to show empty state
            }
        }, 300);
    }
}

function updateWishlistCount() {
    const remaining = document.querySelectorAll(".product-card").length;

    // Update Page Count
    const countEl = document.querySelector(".wishlist-toolbar .results-count span");
    if (countEl) countEl.textContent = remaining;

    // Update Header Badge
    const headerBadge = document.querySelector('.nav-icon[title="Wishlist"] .nav-badge');
    if (headerBadge) headerBadge.textContent = remaining;
}

// ==========================================
// PAGESHOW CACHE BUSTER
// ==========================================

window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});
