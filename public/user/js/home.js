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

// PROFILE DROPDOWN FUNCTIONALITY
const profileToggle = document.getElementById("profileToggle");
const profileDropdown = document.getElementById("profileDropdown");

// Toggle dropdown on profile icon click
profileToggle.addEventListener("click", (e) => {
  e.preventDefault();
  e.stopPropagation();
  profileDropdown.classList.toggle("active");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
    profileDropdown.classList.remove("active");
  }
});

// Prevent dropdown from closing when clicking inside it
profileDropdown.addEventListener("click", (e) => {
  e.stopPropagation();
});

// Handle dropdown menu item clicks
// Handle dropdown menu item clicks
document.querySelectorAll(".dropdown-item").forEach(item => {
  item.addEventListener("click", (e) => {
    // 1. If it's the logout button, let the form submit naturally
    if (item.classList.contains('logout')) {
        return; 
    }

    // 2. Check if the item is a link (like the Profile link)
    // If it has a real href (not just "#"), let it navigate!
    if (item.getAttribute('href') && item.getAttribute('href') !== '#') {
        profileDropdown.classList.remove("active");
        return; // Exit and let the browser navigate to /user/profile
    }

    // 3. For placeholder items with "#", prevent default behavior
    e.preventDefault(); 
    const text = item.querySelector("span").textContent;
    profileDropdown.classList.remove("active");
    console.log(`Action for: ${text}`);
  });
});

// Close dropdown on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    profileDropdown.classList.remove("active");
  }
});