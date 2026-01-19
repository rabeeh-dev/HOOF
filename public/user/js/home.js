// Mobile nav toggle
const toggle = document.getElementById("nav-toggle");
const navLinks = document.querySelector(".nav-links");
toggle.addEventListener("click", () => navLinks.classList.toggle("open"));

// Close mobile menu on link click
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", () => navLinks.classList.remove("open"));
});

// Scroll reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach(section => observer.observe(section));

// Cart functionality
let cartCount = 0;
const cartCounter = document.querySelector(".cart-count");

document.querySelectorAll(".product-btn, .action-btn.cart").forEach(btn => {
  btn.addEventListener("click", (e) => {
    cartCount++;
    cartCounter.textContent = cartCount;
    if (cartCount > 0) cartCounter.style.display = "flex";
    
    // Feedback
    const button = e.currentTarget;
    const originalText = button.textContent;
    if (button.classList.contains("product-btn")) {
      button.textContent = "Added!";
      button.style.background = "#28a745";
      setTimeout(() => {
        button.textContent = originalText;
        button.style.background = "";
      }, 1500);
    }
  });
});

// Wishlist toggle
document.querySelectorAll(".action-btn.wishlist").forEach(btn => {
  btn.addEventListener("click", () => {
    const icon = btn.querySelector("i");
    icon.classList.toggle("far");
    icon.classList.toggle("fas");
    icon.style.color = icon.classList.contains("fas") ? "var(--accent)" : "";
  });
});

// Search
document.querySelector(".search-input").addEventListener("keypress", (e) => {
  if (e.key === "Enter") alert(`Searching for: "${e.target.value}" sneakers...`);
});
