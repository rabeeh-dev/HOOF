/**
 * @file public/user/js/about.js
 * @description Client-side logic for the About page — scroll reveal + stat counter animation.
 */

// ==========================================
// SCROLL REVEAL (IntersectionObserver)
// ==========================================
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("visible");
        }
    });
}, { threshold: 0.15 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

// ==========================================
// STAT COUNTER ANIMATION
// ==========================================
let statsAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting && !statsAnimated) {
            statsAnimated = true;
            animateStats();
        }
    });
}, { threshold: 0.15 });

const statsSection = document.querySelector(".about-stats-section");
if (statsSection) statsObserver.observe(statsSection);

function animateStats() {
    const statNumbers = document.querySelectorAll(".about-stat-number");
    statNumbers.forEach((el) => {
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || "";
        const isDecimal = el.dataset.decimal === "true";
        const duration = 1800;
        const stepTime = 30;
        const steps = Math.ceil(duration / stepTime);
        let current = 0;
        let step = 0;

        const interval = setInterval(() => {
            step++;
            current = (target / steps) * step;
            if (step >= steps) {
                current = target;
                clearInterval(interval);
            }
            if (isDecimal) {
                el.textContent = current.toFixed(1) + suffix;
            } else {
                el.textContent = Math.floor(current) + suffix;
            }
        }, stepTime);
    });
}

// ==========================================
// PAGE CACHE BUSTER
// ==========================================
window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance != "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});
