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