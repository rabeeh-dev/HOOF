/**
 * @file public/user/js/register.js
 * @description Logic for the user registration page, including form validation, password strength meter, and UI interactions.
 */

document.addEventListener("DOMContentLoaded", () => {
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
  // PASSWORD VISIBILITY TOGGLE
  // ==========================================

  /**
   * Handles the visibility toggle for password fields.
   * @param {string} iconId - ID of the icon element.
   * @param {string} inputId - ID of the input element.
   */
  const handleToggle = (iconId, inputId) => {
    const icon = document.getElementById(iconId);
    const input = document.getElementById(inputId);
    if (icon && input) {
      icon.addEventListener("click", () => {
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
      });
    }
  };

  handleToggle("togglePassword", "password");
  handleToggle("toggleConfirmPassword", "confirmPassword");

  // ==========================================
  // PASSWORD STRENGTH METER
  // ==========================================

  const newPassword = document.getElementById("password");
  const strengthBar = document.getElementById("strengthBar");

  if (newPassword && strengthBar) {
    newPassword.addEventListener("input", () => {
      const password = newPassword.value;
      let strength = 0;

      // Basic password strength criteria
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
  // INLINE FORM VALIDATION
  // ==========================================

  /**
   * Validates a form field and display appropriate feedback.
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
    // Password Match Check
    else if (input.id === "confirmPassword") {
      const passwordVal = document.getElementById("password")?.value;
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

  // Setup input event listeners
  const inputs = document.querySelectorAll(".signup-form input:not([type='checkbox'])");

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

    // Focus effects
    input.addEventListener("focus", () => {
      input.closest(".form-group")?.classList.add("focused");
    });
  });

  // ==========================================
  // FORM SUBMISSION HANDLING
  // ==========================================

  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      let isFormValid = true;

      // Validate all fields before submission
      inputs.forEach(input => {
        if (!validateField(input)) {
          isFormValid = false;
        }
      });

      // Check terms and conditions
      const terms = document.getElementById('terms');
      if (!terms?.checked) {
        e.preventDefault();
        showMessage('Please accept the terms', 'error');
        return;
      }

      if (!isFormValid) {
        e.preventDefault();
        const psw = document.getElementById("password")?.value;
        const confirmPsw = document.getElementById("confirmPassword")?.value;
        if (psw !== confirmPsw) {
          showMessage('Passwords do not match', 'error');
        } else {
          showMessage('Please fix the errors above', 'error');
        }
      }
    });
  }
});