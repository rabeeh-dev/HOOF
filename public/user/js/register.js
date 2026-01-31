document.addEventListener("DOMContentLoaded", () => {

  // Mobile nav toggle
  const toggle = document.getElementById("nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (toggle && navLinks) {
    toggle.addEventListener("click", () => {
      navLinks.classList.toggle("open");
    });
  }

  // --- EYE TOGGLE FEATURE ---
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

  // Close mobile menu on link click
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks?.classList.remove("open");
    });
  });

  // Scroll reveal
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

  // ===== PASSWORD STRENGTH =====
  const newPassword = document.getElementById("password");
  const strengthBar = document.getElementById("strengthBar");

  if (newPassword && strengthBar) {
    newPassword.addEventListener("input", () => {
      const password = newPassword.value;
      let strength = 0;

      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^A-Za-z0-9]/.test(password)) strength++;

      const percent = (strength / 5) * 100;
      strengthBar.style.width = percent + "%";

      const colors = [
        "#dc3545", // weak
        "#ffc107",
        "#ff914d",
        "#28a745",
        "#198754"  // strong
      ];

      strengthBar.style.background = colors[strength - 1] || "#ddd";
    });
  }

  // ===== INLINE VALIDATION =====
  function validateField(input) {
    const formGroup = input.closest(".form-group");
    const errorMsg = formGroup?.querySelector(".error-message");
    if (!formGroup || !errorMsg) return true;

    let isValid = true;
    let message = "";

    // Reset
    formGroup.classList.remove("error", "success");
    errorMsg.textContent = "";

    // 1. Required Check
    if (input.hasAttribute("required") && !input.value.trim()) {
      isValid = false;
      message = `${input.previousElementSibling.innerText || "This field"} is required`;
    }
    // 2. Email Check
    else if (input.type === "email" && input.value.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(input.value.trim())) {
        isValid = false;
        message = "Please enter a valid email address";
      }
    }
    // 3. Password Match Check
    else if (input.id === "confirmPassword") {
      const password = document.getElementById("password")?.value;
      if (password && input.value !== password) {
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

  const inputs = document.querySelectorAll(".signup-form input:not([type='checkbox'])");

  inputs.forEach(input => {
    // Validate on blur (when user leaves field)
    input.addEventListener("blur", () => {
      validateField(input);
      input.closest(".form-group")?.classList.remove("focused");
    });

    // Clear error on input (as user types)
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

  // ===== FORM SUBMISSION =====
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      let isFormValid = true;

      // Validate all fields
      inputs.forEach(input => {
        if (!validateField(input)) isFormValid = false;
      });

      const terms = document.getElementById('terms');
      if (!terms?.checked) {
        e.preventDefault();
        showMessage('Please accept the terms', 'error');
        return;
      }

      if (!isFormValid) {
        e.preventDefault();
        // Check for specific password mismatch to show toast as well (optional, but requested in original behavior)
        const password = document.getElementById("password")?.value;
        const confirm = document.getElementById("confirmPassword")?.value;
        if (password !== confirm) {
          showMessage('Passwords do not match', 'error');
        } else {
          showMessage('Please fix the errors above', 'error');
        }
      }
    });
  }
});