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
    navLinks.classList.remove("open");
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
const newPassword = document.getElementById("newPassword");
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

// ===== SHOW / HIDE PASSWORD =====
const confirmPassword = document.getElementById("confirmPassword");
const toggleNewPassword = document.getElementById("toggleNewPassword");
const toggleConfirmPassword = document.getElementById("toggleConfirmPassword");

if (toggleNewPassword && newPassword) {
  toggleNewPassword.addEventListener("click", () => {
    const type =
      newPassword.type === "password" ? "text" : "password";
    newPassword.type = type;
    toggleNewPassword.classList.toggle("fa-eye");
    toggleNewPassword.classList.toggle("fa-eye-slash");
  });
}

if (toggleConfirmPassword && confirmPassword) {
  toggleConfirmPassword.addEventListener("click", () => {
    const type =
      confirmPassword.type === "password" ? "text" : "password";
    confirmPassword.type = type;
    toggleConfirmPassword.classList.toggle("fa-eye");
    toggleConfirmPassword.classList.toggle("fa-eye-slash");
  });
}

// ===== INPUT FOCUS EFFECTS =====
document.querySelectorAll(".signup-form input").forEach(input => {
  input.addEventListener("focus", function () {
    this.closest(".form-group")?.classList.add("focused");
  });

  input.addEventListener("blur", function () {
    this.closest(".form-group")?.classList.remove("focused");
  });
});
