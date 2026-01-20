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

// Input focus effect
document.querySelectorAll(".login-form input").forEach(input => {
  input.addEventListener("focus", () => {
    input.closest(".form-group").classList.add("focused");
  });
  input.addEventListener("blur", () => {
    input.closest(".form-group").classList.remove("focused");
  });
});
