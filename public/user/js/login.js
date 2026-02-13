/**
 * @file public/user/js/login.js
 * @description Logic for the user login page, including form validation, scroll reveal, and password toggles.
 */

// ==========================================
// NAVIGATION & UI EFFECTS
// ==========================================

// Mobile nav toggle
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
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

// ==========================================
// FORM VALIDATION LOGIC
// ==========================================

/**
 * Validates a single input field and applies visual feedback.
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

// Setup listeners for all login form inputs
const inputs = document.querySelectorAll(".login-form input");

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

// Login Form Submit Handling
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    let isFormValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      e.preventDefault();
    }
  });
}

// ==========================================
// PASSWORD VISIBILITY TOGGLE
// ==========================================

const togglePassword = document.querySelector("#togglePassword");
const passwordInput = document.querySelector("#loginPassword");

if (togglePassword && passwordInput) {
  togglePassword.addEventListener("click", function (e) {
    // Toggle the type attribute
    const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Toggle the eye / eye-slash icon
    this.classList.toggle("fa-eye-slash");
    this.classList.toggle("fa-eye");
  });
}
