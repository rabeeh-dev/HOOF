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

    // --- ADDRESS SELECTORS ---
    const openAddressModal = document.getElementById("openAddressModal");
    const closeAddressModal = document.getElementById("closeAddressModal");
    const addressModal = document.getElementById("addressModal");
    const addressForm = document.getElementById("addressForm");

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
            personalInputs.forEach(input => input.disabled = false);
            formActions.style.display = "flex";
            editToggleBtn.style.display = "none";
            if(personalInputs[0]) personalInputs[0].focus();
            showToast("Edit mode enabled. Basic details unlocked.", "info");
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", () => {
            personalInputs.forEach(input => input.disabled = true);
            formActions.style.display = "none";
            editToggleBtn.style.display = "block";
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
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    showToast("Profile updated successfully!", "success");
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

    // --- 6. ADDRESS MODAL LOGIC ---
    if (openAddressModal) {
        openAddressModal.addEventListener("click", () => {
            addressModal.style.display = "flex";
        });
    }

    if (closeAddressModal) {
        closeAddressModal.addEventListener("click", () => {
            addressModal.style.display = "none";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            addressModal.style.display = "none";
        }
    });

    if (addressForm) {
        addressForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(addressForm);
            const data = Object.fromEntries(formData.entries());

            try {
                const response = await fetch('/user/address/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    showToast("Address added successfully!", "success");
                    addressModal.style.display = "none";
                    addressForm.reset();
                    setTimeout(() => location.reload(), 1000);
                } else {
                    showToast(result.message || "Failed to add address", "error");
                }
            } catch (err) {
                showToast("Network error. Please try again.", "error");
            }
        });
    }
});

// --- GLOBAL FUNCTIONS ---

// Function to handle Address Deletion
async function deleteAddress(addressId) {
    if (!confirm("Are you sure you want to delete this address?")) return;

    try {
        const response = await fetch(`/user/address/delete/${addressId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            showToast("Address deleted successfully", "success");
            
            // Dynamically remove the card from the UI
            const addressCard = document.getElementById(`address-${addressId}`);
            if (addressCard) addressCard.remove();
            
            // Check if grid is empty to refresh and show empty state
            const grid = document.getElementById("addressGrid");
            if (grid && grid.querySelectorAll('.address-card').length === 0) {
                setTimeout(() => location.reload(), 800);
            }
        } else {
            showToast(result.message || "Failed to delete address", "error");
        }
    } catch (err) {
        showToast("Error deleting address", "error");
    }
}

async function verifyAndChange(type) {
    if (type === 'email') {
        showToast("Security: An OTP has been sent to your current email.", "info");
        setTimeout(() => { window.location.href = "/user/profile/change-email-start"; }, 1500);
    } else if (type === 'password') {
        showToast("Sending reset link to your email...", "info");
        try {
            const response = await fetch("/user/profile/change-password-request");
            if (response.ok) {
                showToast("Password reset link shared to your email!", "success");
            } else {
                showToast("Failed to send reset link. Try again later.", "error");
            }
        } catch (error) {
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

// Auto-hide the success message after 5 seconds
document.addEventListener("DOMContentLoaded", () => {
    const successAlert = document.querySelector('.server-message.success');
    if (successAlert) {
        setTimeout(() => {
            successAlert.style.transition = "opacity 0.5s ease";
            successAlert.style.opacity = "0";
            setTimeout(() => successAlert.remove(), 500);
        }, 5000);
    }
});