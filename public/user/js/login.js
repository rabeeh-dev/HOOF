// Mobile nav toggle
const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (toggle && navLinks) {
  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// Close mobile menu
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// Scroll reveal
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

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

  if (!isValid) {
    formGroup.classList.add("error");
    errorMsg.textContent = message;
  } else if (input.value.trim()) {
    formGroup.classList.add("success");
  }

  return isValid;
}

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

// Form Submission
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    let isFormValid = true;
    inputs.forEach(input => {
      if (!validateField(input)) isFormValid = false;
    });

    if (!isFormValid) {
      e.preventDefault();
    }
  });
}

// Password Toggle
const togglePassword = document.querySelector("#togglePassword");
const password = document.querySelector("#loginPassword");

if (togglePassword && password) {
  togglePassword.addEventListener("click", function (e) {
    // toggle the type attribute
    const type = password.getAttribute("type") === "password" ? "text" : "password";
    password.setAttribute("type", type);

    // toggle the eye slash icon
    this.classList.toggle("fa-eye-slash");
    this.classList.toggle("fa-eye");
  });
}
