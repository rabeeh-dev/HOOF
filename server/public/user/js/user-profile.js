/**
 * @file public/user/js/user-profile.js
 * @description Logic for the user profile page, including tab navigation, profile editing, address management, and image cropping with HEIC support.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // SELECTORS & INITIALIZATION
    // ==========================================

    const navToggle = document.getElementById("nav-toggle");
    const navLinks = document.querySelector(".nav-links");

    // Auto-dismiss success popup modal
    const successPopup = document.getElementById('successPopupModal');
    if (successPopup) {
        const closePopup = () => successPopup.remove();
        const okBtn = document.getElementById('closeSuccessPopup');
        if (okBtn) okBtn.addEventListener('click', closePopup);
        successPopup.querySelector('.modal-overlay')?.addEventListener('click', closePopup);
        setTimeout(closePopup, 4000);
    }

    const profileToggle = document.getElementById("profileToggle");
    const profileDropdown = document.getElementById("profileDropdown");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");
    const profileForm = document.getElementById("profileForm");
    const editToggleBtn = document.getElementById("editToggleBtn");
    const cancelEditBtn = document.getElementById("cancelEdit");
    const formActions = document.getElementById("formActions");


    const imageUpload = document.getElementById('imageUpload');
    const cropperModal = document.getElementById('cropperModal');
    const cropperImage = document.getElementById('cropperImage');
    const cropButton = document.getElementById('cropButton');
    const closeCropper = document.getElementById('closeCropper');

    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const imageDeleteModal = document.getElementById('imageDeleteModal');
    const confirmImageDelete = document.getElementById('confirmImageDelete');
    const cancelImageDelete = document.getElementById('cancelImageDelete');
    let cropper;

    // ==========================================
    // NAVIGATION & DROPDOWN
    // ==========================================

    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
    }



    // ==========================================
    // TAB NAVIGATION
    // ==========================================

    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.getAttribute("data-tab");
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(`${targetTab}-tab`)?.classList.add("active");
        });
    });

    // ==========================================
    // PROFILE EDITING
    // ==========================================

    /**
     * Returns all editable input fields in the profile form.
     * @returns {NodeList}
     */
    const getEditableInputs = () => document.querySelectorAll("#profileForm input:not([type='email']):not([type='password'])");

    if (editToggleBtn) {
        editToggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const inputs = getEditableInputs();
            inputs.forEach(input => input.disabled = false);

            if (formActions) formActions.style.display = "flex";
            editToggleBtn.style.display = "none";
            showToast("Edit mode enabled.", "info");
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener("click", (e) => {
            e.preventDefault();
            const inputs = getEditableInputs();
            inputs.forEach(input => input.disabled = true);

            if (formActions) formActions.style.display = "none";
            editToggleBtn.style.display = "block";
            if (profileForm) profileForm.reset();
        });
    }

    // Handle profile update submission
    if (profileForm) {
        const phoneInput = document.getElementById("phoneNumber");
        const dobInput = document.getElementById("dateOfBirth");
        const phoneError = document.getElementById("phoneError");
        const dobError = document.getElementById("dobError");

        const validatePhone = () => {
            const phone = phoneInput.value.trim();
            if (!/^\d{10}$/.test(phone)) {
                phoneError.textContent = "Phone number must be exactly 10 digits.";
                phoneError.className = "validation-message error";
                return false;
            } else {
                phoneError.textContent = "";
                phoneError.className = "validation-message success";
                return true;
            }
        };

        const validateDob = () => {
            if (!dobInput.value) return true; // Optional, or handle as required
            const dob = new Date(dobInput.value);
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
            }

            if (age < 18) {
                dobError.textContent = "You must be at least 18 years old.";
                dobError.className = "validation-message error";
                return false;
            } else {
                dobError.textContent = "";
                dobError.className = "validation-message success";
                return true;
            }
        };

        if (phoneInput) phoneInput.addEventListener('input', validatePhone);
        if (dobInput) dobInput.addEventListener('change', validateDob);

        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const isPhoneValid = validatePhone();
            const isDobValid = validateDob();

            if (!isPhoneValid || !isDobValid) {
                showToast("Please fix the errors before saving.", "error");
                return;
            }

            const formData = {
                fullName: document.getElementById("fullName").value,
                phoneNumber: document.getElementById("phoneNumber").value,
                dateOfBirth: document.getElementById("dateOfBirth").value
            };

            try {
                const response = await fetch('/user/profile/update', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (result.success) {
                    showToast(result.message, "success");
                    const sidebarName = document.getElementById('sidebarName');
                    if (sidebarName) sidebarName.textContent = formData.fullName;

                    // Lock fields back
                    getEditableInputs().forEach(input => input.disabled = true);
                    if (formActions) formActions.style.display = "none";
                    editToggleBtn.style.display = "block";
                } else {
                    showToast(result.message, "error");
                }
            } catch (err) {
                showToast("Server error", "error");
            }
        });
    }

    // ==========================================
    // PROFILE IMAGE HANDLING (CROPPER & HEIC)
    // ==========================================

    if (imageUpload) {
        imageUpload.addEventListener('change', async function (e) {
            let file = e.target.files[0];
            if (!file) return;

            // Handle HEIC conversion for iPhone photos
            if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
                showToast("Converting iPhone photo...", "info");
                try {
                    // Note: heic2any is expected to be available globally
                    const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
                    file = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
                } catch (err) {
                    showToast("Conversion failed", "error");
                    return;
                }
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                if (cropperImage) {
                    cropperImage.src = event.target.result;
                    if (cropperModal) cropperModal.style.display = 'flex';
                    if (cropper) cropper.destroy();
                    // Initialize CropperJS
                    cropper = new Cropper(cropperImage, { aspectRatio: 1, viewMode: 1, background: false });
                }
            };
            reader.readAsDataURL(file);
        });
    }

    if (cropButton) {
        cropButton.addEventListener('click', () => {
            if (!cropper) return;
            cropButton.textContent = "Updating...";
            cropButton.disabled = true;

            cropper.getCroppedCanvas({ width: 400, height: 400 }).toBlob(async (blob) => {
                const formData = new FormData();
                formData.append('profileImage', blob, 'profile.jpg');
                try {
                    const res = await fetch('/user/profile/update-image', { method: 'POST', body: formData });
                    const result = await res.json();
                    if (result.success) {
                        const avatar = document.getElementById('profileAvatar');
                        if (avatar) {
                            avatar.innerHTML = `<img src="${result.imagePath}" id="avatarImg">`;
                        }
                        if (removePhotoBtn) removePhotoBtn.style.display = 'flex';
                        if (cropperModal) cropperModal.style.display = 'none';
                        showToast("Image Updated!", "success");
                    }
                } catch (err) {
                    showToast("Upload failed", "error");
                } finally {
                    cropButton.textContent = "Crop & Save";
                    cropButton.disabled = false;
                }
            }, 'image/jpeg');
        });
    }

    // ==========================================
    // PROFILE IMAGE DELETION
    // ==========================================

    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            if (imageDeleteModal) imageDeleteModal.style.display = 'flex';
        });
    }

    const closeImageDeleteModal = () => {
        if (imageDeleteModal) imageDeleteModal.style.display = 'none';
    };

    if (cancelImageDelete) cancelImageDelete.onclick = closeImageDeleteModal;

    if (confirmImageDelete) {
        confirmImageDelete.addEventListener('click', async () => {
            confirmImageDelete.disabled = true;
            confirmImageDelete.textContent = "Deleting...";
            try {
                const response = await fetch('/user/profile/delete-image', { method: 'DELETE' });
                const result = await response.json();
                if (result.success) {
                    const sidebarNameEl = document.getElementById('sidebarName');
                    const fullName = sidebarNameEl ? sidebarNameEl.textContent.trim() : "U";
                    const avatar = document.getElementById('profileAvatar');
                    if (avatar) {
                        avatar.innerHTML = `<span id="avatarLetter">${fullName.charAt(0)}</span>`;
                    }
                    if (removePhotoBtn) removePhotoBtn.style.display = 'none';
                    showToast("Profile photo removed", "success");
                    closeImageDeleteModal();
                }
            } catch (err) {
                showToast("Error removing photo", "error");
            } finally {
                confirmImageDelete.disabled = false;
                confirmImageDelete.textContent = "Yes, Delete";
            }
        });
    }

    // ==========================================
    // MODAL OVERLAY INTERACTIONS
    // ==========================================

    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            const modals = [cropperModal, imageDeleteModal, document.getElementById("deleteConfirmModal")];
            modals.forEach(m => {
                if (m) m.style.display = "none";
            });
            if (cropper) cropper.destroy();
        }
    });

    if (closeCropper) {
        closeCropper.onclick = () => {
            if (cropperModal) cropperModal.style.display = 'none';
            if (cropper) cropper.destroy();
        };
    }
});

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================

/**
 * Displays a toast notification.
 * @param {string} message - Message content.
 * @param {string} type - Notification type: success, info, error.
 */
function showToast(message, type = "info") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();
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

/**
 * Handle navigation for change email/password actions with confirmation popup.
 * @param {string} type - Action type: 'email' or 'password'
 */
function verifyAndChange(type) {
    const isEmail = type === 'email';
    const title = isEmail ? 'Change Email' : 'Update Password';
    const message = isEmail
        ? 'We will send a verification OTP to your current email to confirm your identity.'
        : 'We will send a password reset link to your registered email address.';
    const icon = isEmail ? 'fa-envelope' : 'fa-lock';
    const redirectUrl = isEmail
        ? '/user/profile/change-email-start'
        : '/user/profile/change-password-request';

    // Remove existing confirm modal if any
    const existing = document.getElementById('verifyConfirmModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'verifyConfirmModal';
    modal.className = 'custom-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-container" style="max-width: 420px; text-align: center;">
            <div class="modal-header" style="justify-content: center; border: none; padding-bottom: 0;">
                <div style="background: rgba(255, 145, 77, 0.1); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                    <i class="fas ${icon}" style="font-size: 2.5rem; color: var(--accent, #ff914d);"></i>
                </div>
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 10px;">${title}</h3>
            <p style="color: #666; margin-bottom: 25px; line-height: 1.6;">${message}</p>
            <div class="modal-footer" style="display: flex; gap: 12px; border: none; padding: 0;">
                <button type="button" class="btn primary" id="confirmVerifyBtn" style="flex: 1;">Yes, Proceed</button>
                <button type="button" class="btn outline" id="cancelVerifyBtn" style="flex: 1;">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirmVerifyBtn').addEventListener('click', () => {
        if (typeof showLoading === 'function') {
            showLoading('Processing Request...');
        }
        window.location.href = redirectUrl;
    });
    modal.querySelector('#cancelVerifyBtn').addEventListener('click', () => {
        modal.remove();
    });
    modal.querySelector('.modal-overlay').addEventListener('click', () => {
        modal.remove();
    });
}