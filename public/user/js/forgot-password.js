// ===============================
// NAVBAR & UI (UNCHANGED)
// ===============================
const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (toggle && navLinks) {
  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(section => {
  observer.observe(section);
});

// ===============================
// FORGOT PASSWORD FORM (FIXED)
// ===============================
const forgotPasswordForm = document.getElementById("forgotPasswordForm");

if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", () => {
    // ❗ DO NOT preventDefault
    // Browser must submit form normally

    const emailInput = document.getElementById("resetEmail");
    const email = emailInput.value.trim();

    const submitBtn = forgotPasswordForm.querySelector(".login-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");

    // Client-side validation only
    if (!email) {
      showMessage("Please enter your email address", "error");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showMessage("Please enter a valid email address", "error");
      return;
    }

    // UI loading state ONLY
    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-flex";

    // ✅ NO setTimeout
    // ✅ NO fake success
    // Backend will handle everything
  });
}

// ===============================
// TOAST MESSAGE (UNCHANGED)
// ===============================
function showMessage(text, type) {
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

// Toast CSS injection (UNCHANGED)
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
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    max-width: 350px;
    font-family: Poppins, sans-serif;
  }
  .message-toast.success { background: #28a745; }
  .message-toast.error { background: #dc3545; }
  .message-toast.info { background: ${getComputedStyle(document.documentElement).getPropertyValue('--accent')}; }
`;
document.head.appendChild(toastStyle);

// ===============================
// INPUT EFFECTS (UNCHANGED)
// ===============================
document.querySelectorAll(".login-form input").forEach(input => {
  input.addEventListener("focus", function() {
    this.parentElement.parentElement.classList.add("focused");
  });
  input.addEventListener("blur", function() {
    this.parentElement.parentElement.classList.remove("focused");
  });
});

const emailInput = document.getElementById("resetEmail");
if (emailInput) {
  emailInput.addEventListener("blur", function() {
    this.value = this.value.trim();
  });
}
