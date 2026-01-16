document.addEventListener("DOMContentLoaded", () => {

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

  // ✅ FORM VALIDATION (FIXED)
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      const password = document.getElementById('password')?.value;
      const confirmPassword = document.getElementById('confirmPassword')?.value;
      const terms = document.getElementById('terms');

      if (password !== confirmPassword) {
        e.preventDefault();
        alert('Passwords do not match');
        return;
      }

      if (!terms?.checked) {
        e.preventDefault();
        alert('Please accept the terms');
        return;
      }

      // ✅ allow normal form submit
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
      setTimeout(() => message.remove(), 400);
    }, 4000);
  }

  // Toast styles
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
      transition: all 0.4s ease;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      max-width: 350px;
      font-family: Poppins, sans-serif;
    }
    .message-toast.success { background: #28a745; }
    .message-toast.error { background: #dc3545; }
    .message-toast.info { background: #333; }
  `;
  document.head.appendChild(toastStyle);

  // Input focus effects
  document.querySelectorAll(".signup-form input").forEach(input => {
    input.addEventListener("focus", function() {
      this.closest(".form-group")?.classList.add("focused");
    });
    input.addEventListener("blur", function() {
      this.closest(".form-group")?.classList.remove("focused");
    });
  });

});
