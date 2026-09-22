/**
 * @file public/user/js/landing.js
 * @description Logic for the landing page, including mobile nav toggle and scroll reveal animations.
 */

// ==========================================
// NAVIGATION
// ==========================================

const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (toggle && navLinks) {
  // Mobile nav toggle
  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  // Close mobile menu on link click
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
    });
  });
}

// ==========================================
// UI REVEAL ANIMATIONS
// ==========================================

// Scroll reveal observer for sections
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.15 }
);

// Apply reveal effect to all sections
document.querySelectorAll("section").forEach((section) => {
  section.classList.add("reveal");
  observer.observe(section);
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

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
      if (message.parentNode) message.remove();
    }, 400);
  }, 4000);
}

const toastStyle = document.createElement("style");
toastStyle.textContent = `
  .message-toast {
    position: fixed; top: 100px; right: 20px; padding: 1.2rem 1.8rem;
    border-radius: 12px; color: white; font-weight: 500; z-index: 10000;
    transform: translateX(400px); transition: all 0.4s ease;
    box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 350px;
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
      const badge = document.querySelector(".cart-count");
      if (badge) badge.textContent = parseInt(badge.textContent) + 1;
    } else {
      // Redirect to login if user not found/logged in
      if (result.message === 'User not found') {
        window.location.href = '/user/login';
      } else {
        showMessage(result.message || "Login required", "info");
      }
    }
  } catch (err) {
    showMessage("Please login to add to cart", "info");
    setTimeout(() => window.location.href = '/user/login', 1500);
  }
}

