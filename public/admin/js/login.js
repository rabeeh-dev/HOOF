/**
 * @file public/admin/js/login.js
 * @description Administrative login page logic, including form validation, API submission, and UI feedback.
 */

// ==========================================
// FORM ELEMENT SELECTORS
// ==========================================

const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("adminPassword");
const emailInput = document.getElementById("adminEmail");
const adminLoginForm = document.getElementById("adminLoginForm");

// ==========================================
// PASSWORD VISIBILITY TOGGLE
// ==========================================

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", () => {
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Toggle icon
    const icon = togglePassword.querySelector("i");
    if (type === "text") {
      icon.classList.remove("fa-eye");
      icon.classList.add("fa-eye-slash");
    } else {
      icon.classList.remove("fa-eye-slash");
      icon.classList.add("fa-eye");
    }
  });
}

// ==========================================
// LOGIN FORM SUBMISSION
// ==========================================

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("adminEmail").value.trim();
    const password = document.getElementById("adminPassword").value;
    const submitBtn = adminLoginForm.querySelector(".admin-signin-btn");

    clearFormErrors();

    // Validation
    if (!email || !password) {
      showToast("Error", "Please fill in all fields", "error");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    const btnIcon = submitBtn.querySelector("i");
    btnIcon.className = "fas fa-spinner fa-spin";

    try {
      // API call to the admin login endpoint
      const response = await fetch('/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast("Success", "Login successful! Redirecting...", "success");
        setTimeout(() => {
          window.location.href = "/admin/dashboard";
        }, 1000);
      } else {
        showToast("Login Failed", data.message || "Invalid credentials", "error");
        submitBtn.disabled = false;
        btnIcon.className = "fas fa-arrow-right";
      }
    } catch (error) {
      showToast("Error", "Server connection failed", "error");
      submitBtn.disabled = false;
      btnIcon.className = "fas fa-arrow-right";
    }
  });
}

// ==========================================
// INPUT VALIDATION & FEEDBACK
// ==========================================

if (emailInput) {
  emailInput.addEventListener("blur", () => {
    const email = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && !emailRegex.test(email)) {
      highlightError("adminEmail");
    } else if (email) {
      clearError("adminEmail");
    }
  });

  emailInput.addEventListener("input", () => {
    clearError("adminEmail");
  });
}

if (passwordInput) {
  passwordInput.addEventListener("input", () => {
    clearError("adminPassword");
  });
}

/**
 * Highlights a form field with an error state.
 * @param {string} inputId - ID of the input element.
 */
function highlightError(inputId) {
  const input = document.getElementById(inputId);
  const formGroup = input.closest(".admin-form-group");

  formGroup.classList.remove("success");
  formGroup.classList.add("error");
}

/**
 * Highlights a form field with a success state.
 * @param {string} inputId - ID of the input element.
 */
function highlightSuccess(inputId) {
  const input = document.getElementById(inputId);
  const formGroup = input.closest(".admin-form-group");

  formGroup.classList.remove("error");
  formGroup.classList.add("success");
}

/**
 * Clears the error/success state from a form field.
 * @param {string} inputId - ID of the input element.
 */
function clearError(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const formGroup = input.closest(".admin-form-group");

  formGroup.classList.remove("error");
  formGroup.classList.remove("success");
}

/**
 * Clears errors/success states from all form fields.
 */
function clearFormErrors() {
  document.querySelectorAll(".admin-form-group").forEach(group => {
    group.classList.remove("error");
    group.classList.remove("success");
  });
}

// ==========================================
// TOAST NOTIFICATION SYSTEM
// ==========================================

/**
 * Displays a login-specific toast notification.
 * @param {string} title - Toast title.
 * @param {string} message - Toast message.
 * @param {string} [type="error"] - Type: error, success.
 */
function showToast(title, message, type = "error") {
  // Remove existing toast
  const existingToast = document.querySelector(".admin-toast");
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast
  const toast = document.createElement("div");
  toast.className = `admin-toast ${type}`;

  const icon = type === "error" ? "fa-circle-exclamation" : "fa-circle-check";

  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <div class="admin-toast-content">
      <h4>${title}</h4>
      <p>${message}</p>
    </div>
  `;

  document.body.appendChild(toast);

  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.style.animation = "slideIn 0.3s ease reverse";
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4000);
}

// ==========================================
// UTILITIES & INITIALIZATION
// ==========================================

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Clear form with Ctrl/Cmd + K
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    if (adminLoginForm) {
      adminLoginForm.reset();
      clearFormErrors();
      showToast("Form Cleared", "All fields have been reset", "success");
    }
  }
});

// Auto-focus on email field when page loads
window.addEventListener("load", () => {
  if (emailInput) {
    emailInput.focus();
  }
});

// Security notice logic (demo)
console.log("%c⚠️ SECURITY NOTICE", "color: red; font-size: 20px; font-weight: bold;");
console.log("%cIP Address and login attempts are being logged for security purposes.", "color: orange; font-size: 14px;");
console.log("%cUnauthorized access attempts will be reported.", "color: orange; font-size: 14px;");