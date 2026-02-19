/**
 * @file public/user/js/order-success.js
 * @description Celebration animations for order success page.
 */

// ==========================================
// TOAST NOTIFICATIONS (Self-contained)
// ==========================================

function showToast(message, type = "info") {
  const existing = document.querySelector(".toast-notification");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = `toast-notification toast-${type}`;
  const borderColor = type === "success" ? "#2ecc71" : type === "error" ? "#dc3545" : "#3498db";
  toast.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
    z-index: 1000;
    border-left: 5px solid ${borderColor};
  `;
  toast.innerHTML = `<span>${message}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ==========================================
// CONFETTI CANVAS
// ==========================================

function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function makeParticles(count, canvasWidth, canvasHeight) {
  const colors = ["#ff914d", "#e26820", "#2ecc71", "#3498db", "#f1c40f", "#e74c3c", "#9b59b6", "#1abc9c"];
  const particles = [];
  for (let i = 0; i < count; i++) {
    const size = 8 + Math.random() * 8;
    particles.push({
      x: Math.random() * canvasWidth,
      y: canvasHeight * (Math.random() * 0.4 - 0.2),
      vx: (Math.random() * 8 - 4),
      vy: (Math.random() * -12 - 6),
      gravity: 0.35,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() * 10 - 5),
      size,
      opacity: 1,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: Math.random() > 0.5 ? "rect" : "circle"
    });
  }
  return particles;
}

function runConfetti(canvas, ctx, initialCount) {
  let particles = makeParticles(initialCount, window.innerWidth, window.innerHeight);

  function drawParticle(p) {
    ctx.globalAlpha = p.opacity;
    ctx.fillStyle = p.color;

    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
    ctx.restore();
  }

  function step() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotationSpeed;
      p.opacity *= 0.995;
      drawParticle(p);
    });

    particles = particles.filter((p) => p.y <= window.innerHeight && p.opacity >= 0.05);

    ctx.globalAlpha = 1;
    if (particles.length > 0) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);

  // Second burst
  setTimeout(() => {
    const more = makeParticles(80, window.innerWidth, window.innerHeight);
    particles = particles.concat(more);
    requestAnimationFrame(step);
  }, 800);
}

// ==========================================
// AMOUNT COUNT-UP
// ==========================================

function countUpAmount(targetAmount, elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  const target = Number(targetAmount) || 0;
  let current = 0;
  const step = target / 90;

  function tick() {
    current += step;
    if (current >= target) current = target;
    el.textContent = `₹${Math.floor(current).toLocaleString("en-IN")}`;
    if (current < target) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

// ==========================================
// RIPPLE EFFECT
// ==========================================

function addRipple(btn, ev) {
  const rect = btn.getBoundingClientRect();
  const x = ev.clientX - rect.left;
  const y = ev.clientY - rect.top;

  const ripple = document.createElement("span");
  ripple.className = "ripple";
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
}

// ==========================================
// PAGESHOW CACHE BUSTER
// ==========================================

window.addEventListener("pageshow", function (event) {
  if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
    window.location.reload();
  }
});

// ==========================================
// INIT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("confettiCanvas");
  if (!canvas) return;

  const ctx = setupCanvas(canvas);
  runConfetti(canvas, ctx, 180);

  window.addEventListener("resize", () => {
    setupCanvas(canvas);
  });

  const amountEl = document.getElementById("totalAmount");
  const amount = amountEl ? Number(amountEl.dataset.amount || 0) : 0;
  setTimeout(() => countUpAmount(amount, "totalAmount"), 1800);

  const trackBtn = document.getElementById("trackOrderBtn");
  if (trackBtn) {
    trackBtn.addEventListener("click", (e) => {
      addRipple(trackBtn, e);
    });
  }
});

