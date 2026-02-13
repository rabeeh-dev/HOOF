/**
 * @file public/user/js/layout.js
 * @description Global client-side logic for the user-facing site layout, including navigation and profile dropdowns.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // MOBILE NAVIGATION TOGGLE
    // ==========================================

    const toggle = document.getElementById("nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    if (toggle && navLinks) {
        toggle.addEventListener("click", () => navLinks.classList.toggle("open"));

        // Close mobile menu on link click
        navLinks.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => navLinks.classList.remove("open"));
        });
    }

    // ==========================================
    // PROFILE DROPDOWN FUNCTIONALITY
    // ==========================================

    const profileToggle = document.getElementById("profileToggle");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileToggle && profileDropdown) {
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
        profileDropdown.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", (e) => {
                // 1. If it's the logout button, let the form submit naturally
                if (item.classList.contains('logout')) {
                    return;
                }

                // 2. Check if the item is a link (like the Profile link)
                if (item.getAttribute('href') && item.getAttribute('href') !== '#') {
                    profileDropdown.classList.remove("active");
                    return;
                }

                // 3. For placeholder items with "#", prevent default behavior
                if (item.getAttribute('href') === '#') {
                    e.preventDefault();
                    profileDropdown.classList.remove("active");
                }
            });
        });

        // Close dropdown on escape key
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                profileDropdown.classList.remove("active");
            }
        });
    }
});
