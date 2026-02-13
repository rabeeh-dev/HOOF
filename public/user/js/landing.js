/**
 * @file public/user/js/landing.js
 * @description Logic for the landing page, including mobile nav toggle and scroll reveal animations.
 */

// ==========================================
// NAVIGATION
// ==========================================

const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");

if (toggle && navLinks) {
  // Mobile nav toggle
  toggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });

  // Close mobile menu on link click
  document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
    });
  });
}

// ==========================================
// UI REVEAL ANIMATIONS
// ==========================================

// Scroll reveal observer for sections
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  },
  { threshold: 0.15 }
);

// Apply reveal effect to all sections
document.querySelectorAll("section").forEach((section) => {
  section.classList.add("reveal");
  observer.observe(section);
});

