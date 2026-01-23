// Toggle Password Visibility
const togglePassword = document.getElementById("togglePassword");
const passwordInput = document.getElementById("adminPassword");

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

// Admin Login Form Submission
const adminLoginForm = document.getElementById("adminLoginForm");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => { // Added 'async'
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
    btnIcon.className = "fas fa-spinner fa-spin"; // Added spin animation
    
    try {
      // ACTUAL API CALL to your Node.js Server
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

// Real-time validation
const emailInput = document.getElementById("adminEmail");
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

// Helper Functions
function highlightError(inputId) {
  const input = document.getElementById(inputId);
  const formGroup = input.closest(".admin-form-group");
  
  formGroup.classList.remove("success");
  formGroup.classList.add("error");
}

function highlightSuccess(inputId) {
  const input = document.getElementById(inputId);
  const formGroup = input.closest(".admin-form-group");
  
  formGroup.classList.remove("error");
  formGroup.classList.add("success");
}

function clearError(inputId) {
  const input = document.getElementById(inputId);
  const formGroup = input.closest(".admin-form-group");
  
  formGroup.classList.remove("error");
  formGroup.classList.remove("success");
}

function clearFormErrors() {
  document.querySelectorAll(".admin-form-group").forEach(group => {
    group.classList.remove("error");
    group.classList.remove("success");
  });
}

// Toast Notification
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

// Prevent form resubmission on page refresh
if (window.history.replaceState) {
  window.history.replaceState(null, null, window.location.href);
}

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Clear form with Ctrl/Cmd + K
  if ((e.ctrlKey || e.metaKey) && e.key === "k") {
    e.preventDefault();
    adminLoginForm.reset();
    clearFormErrors();
    showToast("Form Cleared", "All fields have been reset", "success");
  }
});

// Auto-focus on email field when page loads
window.addEventListener("load", () => {
  if (emailInput) {
    emailInput.focus();
  }
});

// Log IP for security (demo only)
console.log("%c⚠️ SECURITY NOTICE", "color: red; font-size: 20px; font-weight: bold;");
console.log("%cIP Address and login attempts are being logged for security purposes.", "color: orange; font-size: 14px;");
console.log("%cUnauthorized access attempts will be reported.", "color: orange; font-size: 14px;");