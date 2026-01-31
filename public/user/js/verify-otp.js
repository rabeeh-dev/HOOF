// ================= NAVBAR =================
const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (toggle && navLinks) {
  toggle.addEventListener("click", () => navLinks.classList.toggle("open"));
}

document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// ================= SCROLL REVEAL =================
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach(section => observer.observe(section));

// ================= OTP INPUT HANDLING =================
const otpInputs = document.querySelectorAll(".otp-input");

otpInputs.forEach((input, index) => {
  input.addEventListener("input", e => {
    if (!/[0-9]/.test(e.target.value)) {
      e.target.value = "";
      return;
    }
    if (e.target.value && index < otpInputs.length - 1) {
      otpInputs[index + 1].focus();
    }
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Backspace" && !input.value && index > 0) {
      otpInputs[index - 1].focus();
    }
  });

  input.addEventListener("paste", e => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    data.split("").forEach((digit, i) => {
      if (otpInputs[i]) otpInputs[i].value = digit;
    });
    otpInputs[Math.min(data.length, 5)].focus();
  });
});

// ================= TIMER =================
let timeLeft = 120;
const timerEl = document.getElementById("timer");
const resendBtn = document.getElementById("resendOtp");

function updateTimer() {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  timerEl.textContent = `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;

  if (timeLeft <= 0) {
    resendBtn.style.display = "inline-block";
    return;
  }

  timeLeft--;
  setTimeout(updateTimer, 1000);
}

updateTimer();

// ================= RESEND OTP (CONNECTED TO BACKEND) =================
resendBtn?.addEventListener("click", async () => {
  try {
    const res = await fetch("/user/resend-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();

    if (!res.ok) {
      showMessage(data.message || "Failed to resend OTP", "error");
      return;
    }

    showMessage("New OTP sent to your email!", "success");

    // Restart cooldown
    timeLeft = 120;
    resendBtn.style.display = "none";
    updateTimer();

  } catch (err) {
    showMessage("Something went wrong. Try again.", "error");
  }
});

// ================= OTP FORM SUBMIT =================
// ================= OTP FORM SUBMIT =================
const otpForm = document.getElementById("otpForm");
const otpHidden = document.getElementById("otpHidden");

if (otpForm) {
  otpForm.addEventListener("submit", (e) => {
    let isValid = true;
    let otpCode = "";

    otpInputs.forEach(input => {
      // Clear previous error
      input.classList.remove("error");

      const val = input.value.trim();
      if (!val) {
        isValid = false;
        input.classList.add("error");
      }
      otpCode += val;
    });

    if (!isValid || otpCode.length !== 6) {
      e.preventDefault();
      showMessage("Please enter the full 6-digit code", "error");
      return;
    }

    otpHidden.value = otpCode;
  });

  // Clear error on input
  otpInputs.forEach(input => {
    input.addEventListener("input", function () {
      this.classList.remove("error");
    });
  });
}

// ================= TOAST =================
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
.message-toast.info { background:var(--accent); }
`;
document.head.appendChild(toastStyle);

// ================= EXTRA =================
document.getElementById("contactSupport")?.addEventListener("click", e => {
  e.preventDefault();
  showMessage("Contact support: support@hoofsnkrs.com", "info");
});

document.querySelector(".google-signup")?.addEventListener("click", () => {
  showMessage("Continue with Google...", "info");
});
