/**
 * @file public/user/js/change-email.js
 * @description Logic for the user email update page, including nav toggles, profile dropdowns, and form validation.
 */

// ==========================================
// NAVIGATION & UI
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

// ==========================================
// PROFILE DROPDOWN
// ==========================================

const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");

if (profileToggle && profileDropdown) {
  // Toggle dropdown on profile icon click
  profileToggle.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    profileDropdown.classList.toggle("active");
  });

  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
      profileDropdown.classList.remove("active");
    }
  });

  // Prevent dropdown from closing when clicking inside it
  profileDropdown.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Handle dropdown menu item clicks
  document.querySelectorAll(".dropdown-item").forEach(item => {
    item.addEventListener("click", (e) => {
      // If it's the logout button, let the browser handle it
      if (item.classList.contains('logout')) {
        return;
      }

      e.preventDefault();
      profileDropdown.classList.remove("active");
    });
  });

  // Close dropdown on escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      profileDropdown.classList.remove("active");
    }
  });
}

// ==========================================
// CHANGE EMAIL FORM
// ==========================================

const changeEmailForm = document.getElementById("changeEmailForm");
if (changeEmailForm) {
  changeEmailForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newEmail = document.getElementById("newEmail").value.trim();
    const confirmEmail = document.getElementById("confirmEmail").value.trim();
    const submitBtn = changeEmailForm.querySelector(".change-email-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const btnLoader = submitBtn.querySelector(".btn-loader");

    // Clear previous errors
    clearErrors();

    // Validation
    if (!newEmail || !confirmEmail) {
      showMessage("Please fill in both email fields", "error");
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      showMessage("Please enter a valid email address", "error");
      highlightError("newEmail");
      return;
    }

    // Check if emails match
    if (newEmail !== confirmEmail) {
      showMessage("Email addresses do not match", "error");
      highlightError("confirmEmail");
      return;
    }

    // Show loading state
    submitBtn.disabled = true;
    btnText.style.display = "none";
    btnLoader.style.display = "inline-flex";

    // Simulate API call
    setTimeout(() => {
      // Reset button state
      submitBtn.disabled = false;
      btnText.style.display = "inline";
      btnLoader.style.display = "none";

      // Show success message
      showMessage("Email changed successfully! Please verify your new email. 📧", "success");

      // Reset form
      changeEmailForm.reset();
    }, 2000);
  });
}

// ==========================================
// INLINE VALIDATION
// ==========================================

const newEmailInput = document.getElementById("newEmail");
const confirmEmailInput = document.getElementById("confirmEmail");

if (newEmailInput) {
  newEmailInput.addEventListener("blur", function () {
    this.value = this.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (this.value && !emailRegex.test(this.value)) {
      highlightError("newEmail");
      showMessage("Please enter a valid email address", "error");
    } else {
      clearError("newEmail");
    }
  });
}

if (confirmEmailInput) {
  confirmEmailInput.addEventListener("blur", function () {
    this.value = this.value.trim();
    const newEmailText = document.getElementById("newEmail").value.trim();

    if (this.value && newEmailText && this.value !== newEmailText) {
      highlightError("confirmEmail");
      showMessage("Email addresses do not match", "error");
    } else {
      clearError("confirmEmail");
    }
  });
}

/**
 * Highlights a form field with an error state.
 * @param {string} inputId - ID of the input element.
 */
function highlightError(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.style.borderColor = "#dc3545";
    input.style.boxShadow = "0 0 0 4px rgba(220, 53, 69, 0.1)";
  }
}

/**
 * Clears the error state from a form field.
 * @param {string} inputId - ID of the input element.
 */
function clearError(inputId) {
  const input = document.getElementById(inputId);
  if (input) {
    input.style.borderColor = "";
    input.style.boxShadow = "";
  }
}

/**
 * Clears error states from all form fields.
 */
function clearErrors() {
  clearError("newEmail");
  clearError("confirmEmail");
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
    transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    max-width: 350px;
    font-family: Poppins, sans-serif;
  }
  .message-toast.success { background: #28a745; }
  .message-toast.error { background: #dc3545; }
  .message-toast.info { background: #333; }
  
  @media (max-width: 480px) {
    .message-toast {
      right: 10px;
      left: 10px;
      max-width: none;
    }
  }
`;
document.head.appendChild(toastStyle);

// Input interactions
document.querySelectorAll(".change-email-form input").forEach(input => {
  input.addEventListener("focus", function () {
    this.parentElement.parentElement.classList.add("focused");
  });
  input.addEventListener("blur", function () {
    this.parentElement.parentElement.classList.remove("focused");
  });
});