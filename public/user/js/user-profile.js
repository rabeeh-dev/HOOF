document.addEventListener("DOMContentLoaded", () => {
    // --- SELECTORS ---
    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.querySelector(".nav-links");
    const profileToggle = document.getElementById("profileToggle");
    const profileDropdown = document.getElementById("profileDropdown");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const profileForm = document.getElementById("profileForm");
    const editToggleBtn = document.getElementById("editToggleBtn");
    const cancelEditBtn = document.getElementById("cancelEdit");
    const formActions = document.getElementById("formActions");
    const personalInputs = document.querySelectorAll("#profileForm input:not([type='email']):not([type='password'])");

    // --- 1. MOBILE NAVIGATION ---
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
    }

    document.querySelectorAll(".nav-links a").forEach(link => {
        link.addEventListener("click", () => navLinks.classList.remove("open"));
    });

    // --- 2. PROFILE DROPDOWN ---
    if (profileToggle && profileDropdown) {
        profileToggle.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            profileDropdown.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove("active");
            }
        });

        profileDropdown.addEventListener("click", (e) => e.stopPropagation());

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") profileDropdown.classList.remove("active");
        });
    }

    // --- 3. TAB NAVIGATION ---
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.getAttribute("data-tab");
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));

            button.classList.add("active");
            const targetContent = document.getElementById(`${targetTab}-tab`);
            if (targetContent) targetContent.classList.add("active");
        });
    });

    // --- 4. EDIT PROFILE LOGIC ---
    if (editToggleBtn) {
        editToggleBtn.addEventListener("click", () => {
            // Unlock inputs (Full Name, Phone, etc.)
            personalInputs.forEach(input => input.disabled = false);
            
            // UI Changes
            formActions.style.display = "flex";
            editToggleBtn.style.display = "none";
            
            // Focus first editable input
            if(personalInputs[0]) personalInputs[0].focus();
            
            showToast("Edit mode enabled. Basic details unlocked.", "info");
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            // Re-lock inputs
            personalInputs.forEach(input => input.disabled = true);
            
            // UI Changes
            formActions.style.display = "none";
            editToggleBtn.style.display = "block";
            
            // Reset form to original values
            profileForm.reset();
            showToast("Edit cancelled.", "info");
        });
    }

    // --- 5. AJAX FORM SUBMISSION ---
    if (profileForm) {
        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const formData = new FormData(profileForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/user/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                const result = await response.json();

                if (result.success) {
                    showToast("Profile updated successfully!", "success");
                    
                    // Update sidebar and locked UI
                    const displayName = document.getElementById("display-name");
                    if(displayName) displayName.textContent = data.fullName;
                    
                    personalInputs.forEach(input => input.disabled = true);
                    formActions.style.display = "none";
                    editToggleBtn.style.display = "block";
                } else {
                    showToast(result.message || "Update failed", "error");
                }
            } catch (err) {
                showToast("Network error. Please try again.", "error");
            }
        });
    }

    // --- 6. UTILITIES (Copy, FAQ, etc.) ---
    const copyCodeBtn = document.getElementById("copyCodeBtn");
    if (copyCodeBtn) {
        copyCodeBtn.addEventListener("click", () => {
            const referralCode = document.getElementById("referralCode");
            referralCode.select();
            document.execCommand("copy");
            showToast("Referral code copied!", "success");
        });
    }

    document.querySelectorAll(".faq-item").forEach(item => {
        item.querySelector(".faq-question").addEventListener("click", () => {
            const isActive = item.classList.contains("active");
            document.querySelectorAll(".faq-item").forEach(f => f.classList.remove("active"));
            if (!isActive) item.classList.add("active");
        });
    });
});

// --- GLOBAL FUNCTIONS ---

async function verifyAndChange(type) {
    if (type === 'email') {
        // Show OTP toast and redirect to start the double-verification process
        showToast("Security: An OTP has been sent to your current email.", "info");
        
        // Delay redirect slightly so user can see the toast
        setTimeout(() => {
            window.location.href = "/user/profile/change-email-start";
        }, 1500);

    } else if (type === 'password') {
        // Show processing toast
        showToast("Sending reset link to your email...", "info");

        try {
            // Call the route we created in the controller
            const response = await fetch("/user/profile/change-password-request");
            
            if (response.ok) {
                showToast("Password reset link shared to your email!", "success");
            } else {
                showToast("Failed to send reset link. Try again later.", "error");
            }
        } catch (error) {
            console.error("Password reset error:", error);
            showToast("Network error. Please try again.", "error");
        }
    }
}

function showToast(message, type = "info") {
    const existingToast = document.querySelector(".toast-notification");
    if (existingToast) existingToast.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Ensure toast styles are available
if (!document.getElementById("toast-styles")) {
    const style = document.createElement("style");
    style.id = "toast-styles";
    style.textContent = `
        .toast-notification {
            position: fixed; top: 100px; right: 20px;
            padding: 1rem 1.5rem; border-radius: 12px;
            color: white; z-index: 10000; opacity: 0;
            transform: translateX(400px); transition: all 0.3s ease;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .toast-notification.show { opacity: 1; transform: translateX(0); }
        .toast-success { background: #28a745; }
        .toast-error { background: #dc3545; }
        .toast-info { background: #ff914d; }
    `;
    document.head.appendChild(style);
}