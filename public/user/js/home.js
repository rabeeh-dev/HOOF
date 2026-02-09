
// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(section => observer.observe(section));

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
    setTimeout(() => message.remove(), 400);
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