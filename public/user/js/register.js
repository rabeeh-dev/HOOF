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

// Form validation
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const terms = document.getElementById("terms").checked;

    // Validation
    if (!fullName || !email || !password || !confirmPassword) {
      showMessage("Please fill all fields", "error");
      return;
    }

    if (password !== confirmPassword) {
      showMessage("Passwords do not match", "error");
      return;
    }

    if (password.length < 6) {
      showMessage("Password must be at least 6 characters", "error");
      return;
    }

    if (!terms) {
      showMessage("Please accept terms and conditions", "error");
      return;
    }

    // Success
    showMessage("Account created successfully! Welcome to HOOF 🚀", "success");
    signupForm.reset();
  });
}

// Google signup
const googleBtn = document.querySelector(".google-signup");
if (googleBtn) {
  googleBtn.addEventListener("click", () => {
    showMessage("Google signup coming soon...", "info");
  });
}

// Toast message function
function showMessage(text, type) {
  // Remove existing messages
  const existing = document.querySelector(".message-toast");
  if (existing) existing.remove();

  const message = document.createElement("div");
  message.className = `message-toast ${type}`;
  message.textContent = text;
  
  document.body.appendChild(message);
  
  // Animate in
  requestAnimationFrame(() => {
    message.style.transform = "translateX(0)";
  });

  // Auto remove
  setTimeout(() => {
    message.style.transform = "translateX(400px)";
    setTimeout(() => {
      if (message.parentNode) message.remove();
    }, 400);
  }, 4000);
}

// Add CSS for toast (injected dynamically)
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

// Input effects
document.querySelectorAll(".signup-form input").forEach(input => {
  input.addEventListener("focus", function() {
    this.parentElement.parentElement.classList.add("focused");
  });
  input.addEventListener("blur", function() {
    this.parentElement.parentElement.classList.remove("focused");
  });
});
