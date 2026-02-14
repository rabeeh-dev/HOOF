/**
 * @file public/user/js/home.js
 * @description Client-side logic for the home page, including scroll reveals and toast notifications.
 */

// ==========================================
// UI EFFECTS (Scroll Reveal)
// ==========================================

// Scroll reveal observer initialization
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.15 });

// Apply observer to all reveal elements
document.querySelectorAll(".reveal").forEach(section => observer.observe(section));

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

/**
 * Displays a toast message notification.
 * @param {string} text - Message content.
 * @param {string} [type="info"] - Toast type: success, error, info.
 */
function showMessage(text, type = "info") {
  const existing = document.querySelector(".message-toast");
  if (existing) existing.remove();

  const message = document.createElement("div");
  message.className = `message-toast ${type}`;
  message.textContent = text;
  document.body.appendChild(message);

  requestAnimationFrame(() => {
    message.style.transform = "translateX(0)";
  });

  setTimeout(() => {
    message.style.transform = "translateX(400px)";
    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 400);
  }, 4000);
}

// Toast styling
const toastStyle = document.createElement("style");
toastStyle.textContent = `
  .message-toast {
    position: fixed; 
    top: 100px; 
    right: 20px; 
    padding: 1.2rem 1.8rem;
    border-radius: 12px; 
    color: white; 
    font-weight: 500; 
    z-index: 10000;
    transform: translateX(400px); 
    transition: all 0.4s ease;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3); 
    max-width: 350px;
    font-family: Poppins, sans-serif;
  }
  .message-toast.success { background: #28a745; }
  .message-toast.error { background: #dc3545; }
  .message-toast.info { background: #333; }
`;
document.head.appendChild(toastStyle);

// ==========================================
// CART OPERATIONS
// ==========================================

/**
 * Adds a product to the cart via AJAX.
 * @param {string} productId - Product ID.
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
      showMessage("Added to bag!", "success");
      // Update badge if exists
      const badge = document.querySelector(".cart-count");
      if (badge) badge.textContent = parseInt(badge.textContent) + 1;
    } else {
      showMessage(result.message || "Login required", "info");
    }
  } catch (err) {
    showMessage("Error adding to cart", "error");
  }
}