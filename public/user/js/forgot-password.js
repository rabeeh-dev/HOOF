/**
 * @file public/user/js/forgot-password.js
 * @description Client-side logic for the forgot password page, including validation and UI effects.
 */

// ==========================================
// NAVIGATION & UI EFFECTS
// ==========================================

const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (toggle && navLinks) {
  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    if (navLinks) {
      navLinks.classList.remove("open");
    }
  });
});

// Scroll Reveal Observer
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

// ==========================================
// FORGOT PASSWORD FORM LOGIC
// ==========================================

const forgotPasswordForm = document.getElementById("forgotPasswordForm");
const inputs = document.querySelectorAll(".login-form input");

/**
 * Validates a form field and display error/success messages.
 * @param {HTMLInputElement} input - The input element to validate.
 * @returns {boolean} - Returns true if valid, false otherwise.
 */
function validateField(input) {
  const formGroup = input.closest(".form-group");
  const errorMsg = formGroup?.querySelector(".error-message");
  if (!formGroup || !errorMsg) return true;

  let isValid = true;
  let message = "";

  // Reset states
  formGroup.classList.remove("error", "success");
  errorMsg.textContent = "";

  // Required Field Check
  if (input.hasAttribute("required") && !input.value.trim()) {
    isValid = false;
    message = `${input.previousElementSibling.innerText || "This field"} is required`;
  }
  // Email Format Check
  else if (input.type === "email" && input.value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(input.value.trim())) {
      isValid = false;
      message = "Please enter a valid email address";
    }
  }

  if (!isValid) {
    formGroup.classList.add("error");
    errorMsg.textContent = message;
  } else if (input.value.trim()) {
    formGroup.classList.add("success");
  }

  return isValid;
}

// Input Event Listeners
inputs.forEach(input => {
  // Validate on blur
  input.addEventListener("blur", () => {
    validateField(input);
    input.closest(".form-group")?.classList.remove("focused");
  });

  // Clear error on input
  input.addEventListener("input", () => {
    const formGroup = input.closest(".form-group");
    if (formGroup?.classList.contains("error")) {
      validateField(input);
    }
  });

  // Focus effect
  input.addEventListener("focus", () => {
    input.closest(".form-group")?.classList.add("focused");
  });
});

// Form Submission Handling
if (forgotPasswordForm) {
  forgotPasswordForm.addEventListener("submit", (e) => {
    // Validate all fields before submission
    let isFormValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) isFormValid = false;
    });

    if (!isFormValid) {
      e.preventDefault();
      return;
    }

    const submitBtn = forgotPasswordForm.querySelector(".login-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");

    // UI loading state
    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-flex";
  });
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

/**
 * Displays a toast message notification.
 * @param {string} text - Message content.
 * @param {string} type - Toast type: success, error, info.
 */
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

// Toast styling injection
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
  .message-toast.info { background: #333; }
`;
document.head.appendChild(toastStyle);

// Input trimming on blur
const emailInput = document.getElementById("resetEmail");
if (emailInput) {
  emailInput.addEventListener("blur", function () {
    this.value = this.value.trim();
  });
}
