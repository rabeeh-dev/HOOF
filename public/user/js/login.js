// Mobile nav toggle - YOUR EXACT
const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");
if (toggle && navLinks) {
  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

// Close mobile menu - YOUR EXACT
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("open");
  });
});

// Scroll reveal - YOUR EXACT
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

// LOGIN FORM VALIDATION
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      showMessage("Please fill email and password", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }

    showMessage("Login successful! Welcome back to HOOF 🚀", "success");
    loginForm.reset();
  });
}

// Forgot password
document.querySelector(".forgot-password")?.addEventListener("click", (e) => {
  e.preventDefault();
  showMessage("Password reset link sent to your email!", "info");
});

// Google signup - YOUR EXACT
const googleBtn = document.querySelector(".google-signup");
if (googleBtn) {
  googleBtn.addEventListener("click", () => {
    showMessage("Continue with Google...", "info");
  });
}

// Toast message - YOUR EXACT
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

// Toast CSS - YOUR EXACT
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
  .message-toast.info { background: ${getComputedStyle(document.documentElement).getPropertyValue('--accent')}; }
`;
document.head.appendChild(toastStyle);

// Input effects - YOUR EXACT
document.querySelectorAll(".login-form input").forEach(input => {
  input.addEventListener("focus", function() {
    this.parentElement.parentElement.classList.add("focused");
  });
  input.addEventListener("blur", function() {
    this.parentElement.parentElement.classList.remove("focused");
  });
});
