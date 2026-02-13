/**
 * @file public/user/js/reset-password.js
 * @description Logic for the password reset page, including form validation, strength meter, and password visibility toggles.
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

// Close mobile menu on link click
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    if (navLinks) {
      navLinks.classList.remove("open");
    }
  });
});

// Scroll reveal observer
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
// PASSWORD STRENGTH METER
// ==========================================

const newPassword = document.getElementById("newPassword");
const strengthBar = document.getElementById("strengthBar");

if (newPassword && strengthBar) {
  newPassword.addEventListener("input", () => {
    const password = newPassword.value;
    let strength = 0;

    // Strength criteria
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const percent = (strength / 5) * 100;
    strengthBar.style.width = percent + "%";

    const colors = [
      "#dc3545", // Weak
      "#ffc107", // Fair
      "#ff914d", // Good
      "#28a745", // Strong
      "#198754"  // Very Strong
    ];

    strengthBar.style.background = colors[strength - 1] || "#ddd";
  });
}

// ==========================================
// VISIBILITY TOGGLE HANDLING
// ==========================================

const confirmPassword = document.getElementById("confirmPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

if (toggleNewPassword && newPassword) {
  toggleNewPassword.addEventListener("click", () => {
    const type = newPassword.type === "password" ? "text" : "password";
    newPassword.type = type;
    toggleNewPassword.classList.toggle("fa-eye");
    toggleNewPassword.classList.toggle("fa-eye-slash");
  });
}

if (toggleConfirmPassword && confirmPassword) {
  toggleConfirmPassword.addEventListener("click", () => {
    const type = confirmPassword.type === "password" ? "text" : "password";
    confirmPassword.type = type;
    toggleConfirmPassword.classList.toggle("fa-eye");
    toggleConfirmPassword.classList.toggle("fa-eye-slash");
  });
}

// ==========================================
// INLINE FORM VALIDATION
// ==========================================

/**
 * Validates a single input field.
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
  // Minimum Length Check
  else if (input.id === "newPassword" && input.value.length < 8) {
    isValid = false;
    message = "Password must be at least 8 characters";
  }
  // Password Match Check
  else if (input.id === "confirmPassword") {
    const passwordVal = document.getElementById("newPassword")?.value;
    if (passwordVal && input.value !== passwordVal) {
      isValid = false;
      message = "Passwords do not match";
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

// Setup event listeners for inputs
const inputs = document.querySelectorAll(".signup-form input");

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

// ==========================================
// FORM SUBMISSION HANDLING
// ==========================================

const resetForm = document.getElementById("resetForm");
if (resetForm) {
  resetForm.addEventListener("submit", (e) => {
    let isFormValid = true;

    // Validate all fields before submission
    inputs.forEach(input => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      e.preventDefault();
      showMessage("Please fix the errors above", "error");
    }
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
    box-shadow: 0 20px 40px rgba(0,0,0,0.3); max-width: 350px;
    font-family: Poppins, sans-serif;
  }
  .message-toast.success { background: #28a745; }
  .message-toast.error { background: #dc3545; }
  .message-toast.info { background: #333; }
`;
document.head.appendChild(toastStyle);
