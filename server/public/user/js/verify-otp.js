/**
 * @file public/user/js/verify-otp.js
 * @description Logic for the OTP verification page, including countdown timer, auto-focus inputs, and AJAX submission.
 */

// ==========================================
// NAVIGATION
// ==========================================

const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (toggle && navLinks) {
  toggle.addEventListener("click", () => navLinks.classList.toggle("open"));
}

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => {
    if (navLinks) {
      navLinks.classList.remove("open");
    }
  });
});

// ==========================================
// UI EFFECTS (Scroll Reveal)
// ==========================================

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(section => observer.observe(section));

// ==========================================
// OTP INPUT HANDLING
// ==========================================

const otpInputs = document.querySelectorAll(".otp-input");

otpInputs.forEach((input, index) => {
  // Digit-only validation and auto-focus next
  input.addEventListener("input", e => {
    if (!/[0-9]/.test(e.target.value)) {
      e.target.value = "";
      return;
    }
    if (e.target.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  // Backspace auto-focus previous
  input.addEventListener("keydown", e => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });

  // Handle clipboard paste
  input.addEventListener("paste", e => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    data.split("").forEach((digit, i) => {
      if (otpInputs[i]) {
        otpInputs[i].value = digit;
      }
    });
    otpInputs[Math.min(data.length, 5)].focus();
  });
});

// ==========================================
// COUNTDOWN TIMER
// ==========================================

let timeLeft = 60; // 1 minutes
const timerEl = document.getElementById("timer");
const resendBtn = document.getElementById("resendOtp");

/**
 * Updates the visual timer every second.
 */
function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timerEl) {
    timerEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  if (timeLeft <= 0) {
    if (resendBtn) {
      resendBtn.style.display = "inline-block";
    }
    return;
  }

  timeLeft--;
  setTimeout(updateTimer, 1000);
}

// Start timer on load
updateTimer();

// ==========================================
// RESEND OTP
// ==========================================

resendBtn?.addEventListener("click", async () => {
  try {
    showLoading("Resending OTP...");
    const res = await fetch("/user/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    hideLoading();

    if (!res.ok) {
      showMessage(data.message || "Failed to resend OTP", "error");
      return;
    }

    showMessage("New OTP sent to your email!", "success");

    // Restart timer
    timeLeft = 120;
    resendBtn.style.display = "none";
    updateTimer();

  } catch (err) {
    showMessage("Something went wrong. Try again.", "error");
  }
});

// ==========================================
// FORM SUBMISSION (AJAX)
// ==========================================

const otpForm = document.getElementById("otpForm");

if (otpForm) {
  otpForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    let otpCode = "";

    otpInputs.forEach(input => {
      // Clear previous error state
      input.classList.remove("error");

      const val = input.value.trim();
      if (!val) {
        isValid = false;
        input.classList.add("error");
      }
      otpCode += val;
    });

    if (!isValid || otpCode.length !== 6) {
      showMessage("Please enter the full 6-digit code", "error");
      return;
    }

    // Submit via AJAX
    showLoading("Verifying code...");
    const btn = otpForm.querySelector("button[type='submit']");
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = "<i class='fas fa-spinner fa-spin'></i> Verifying...";

    try {
      const res = await fetch("/user/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp: otpCode })
      });

      const data = await res.json();

      if (data.success) {
        showMessage("Verified! Redirecting...", "success");
        setTimeout(() => {
          hideLoading();
          window.location.href = data.redirectUrl;
        }, 1000);
      } else {
        // Handle invalid OTP
        hideLoading();
        showMessage(data.message || "Invalid OTP", "error");
        btn.disabled = false;
        btn.innerHTML = originalText;

        // Clear and highlight inputs
        otpInputs.forEach(input => {
          input.value = "";
          input.classList.add("error");
        });
        otpInputs[0].focus();
      }

    } catch (err) {
      hideLoading();
      showMessage("Something went wrong. Try again.", "error");
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });

  // Remove error state on input
  otpInputs.forEach(input => {
    input.addEventListener("input", function () {
      this.classList.remove("error");
    });
  });
}

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

/**
 * Displays a toast notification message.
 * @param {string} text - Message content.
 * @param {string} type - Notification type: success, error, info.
 */
function showMessage(text, type) {
  document.querySelector(".message-toast")?.remove();

  const msg = document.createElement("div");
  msg.className = `message-toast ${type}`;
  msg.textContent = text;
  document.body.appendChild(msg);

  requestAnimationFrame(() => (msg.style.transform = "translateX(0)"));

  setTimeout(() => {
    msg.style.transform = "translateX(400px)";
    setTimeout(() => msg.remove(), 400);
  }, 4000);
}

// Global toast styling
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
  transition: all 0.4s cubic-bezier(0.25,0.46,0.45,0.94);
  box-shadow: 0 20px 40px rgba(0,0,0,0.3);
  max-width: 350px;
  font-family: Poppins, sans-serif;
}
.message-toast.success { background:#28a745; }
.message-toast.error { background:#dc3545; }
.message-toast.info { background:#333; }
`;
document.head.appendChild(toastStyle);

// ==========================================
// ADDITIONAL INTERACTIONS
// ==========================================

document.getElementById("contactSupport")?.addEventListener("click", e => {
  e.preventDefault();
  showMessage("Contact support: support@hoofsnkrs.com", "info");
});

document.querySelector(".google-signup")?.addEventListener("click", () => {
  showLoading("Redirecting to Google...");
});
