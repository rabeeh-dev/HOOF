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

    const openAddressModal = document.getElementById("openAddressModal");
    const closeAddressModal = document.getElementById("closeAddressModal");
    const addressModal = document.getElementById("addressModal");
    const addressForm = document.getElementById("addressForm");

    const deleteConfirmModal = document.getElementById("deleteConfirmModal");
    const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
    const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
    let addressIdToDelete = null;

    const imageUpload = document.getElementById('imageUpload');
    const cropperModal = document.getElementById('cropperModal');
    const cropperImage = document.getElementById('cropperImage');
    const cropButton = document.getElementById('cropButton');
    const closeCropper = document.getElementById('closeCropper');
    const closeCropperHeader = document.getElementById('closeCropperHeader');
    let cropper; 

    const removePhotoBtn = document.getElementById('removePhotoBtn');
    const imageDeleteModal = document.getElementById('imageDeleteModal');
    const confirmImageDelete = document.getElementById('confirmImageDelete');
    const cancelImageDelete = document.getElementById('cancelImageDelete');

    // --- 1. NAVIGATION & DROPDOWN ---
    if (navToggle && navLinks) {
        navToggle.addEventListener("click", () => navLinks.classList.toggle("open"));
    }
    if (profileToggle && profileDropdown) {
        profileToggle.addEventListener("click", (e) => {
            e.preventDefault(); e.stopPropagation();
            profileDropdown.classList.toggle("active");
        });
        document.addEventListener("click", (e) => {
            if (!profileToggle.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove("active");
            }
        });
    }

    // --- 2. TAB NAVIGATION ---
    tabButtons.forEach(button => {
        button.addEventListener("click", () => {
            const targetTab = button.getAttribute("data-tab");
            tabButtons.forEach(btn => btn.classList.remove("active"));
            tabContents.forEach(content => content.classList.remove("active"));
            button.classList.add("active");
            document.getElementById(`${targetTab}-tab`)?.classList.add("active");
        });
    });

 // --- 3. EDIT PROFILE & FORM ---

// This selector ensures we only target the inputs we want to edit
const getEditableInputs = () => document.querySelectorAll("#profileForm input:not([type='email']):not([type='password'])");

if (editToggleBtn) {
    editToggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const inputs = getEditableInputs();
        inputs.forEach(input => input.disabled = false);
        
        formActions.style.display = "flex";
        editToggleBtn.style.display = "none";
        showToast("Edit mode enabled.", "info");
    });
}

if (cancelEditBtn) {
    cancelEditBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const inputs = getEditableInputs();
        inputs.forEach(input => input.disabled = true);
        
        formActions.style.display = "none";
        editToggleBtn.style.display = "block";
        profileForm.reset(); // Reverts to original values
    });
}

// ADD THE SUBMIT LISTENER (To prevent URL change and use Service)
if (profileForm) {
    profileForm.addEventListener("submit", async (e) => {
        e.preventDefault(); // This stops the ?fullName=... in URL

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
                // Update Sidebar and UI
                document.getElementById('sidebarName').textContent = formData.fullName;
                
                // Lock the form back
                getEditableInputs().forEach(input => input.disabled = true);
                formActions.style.display = "none";
                editToggleBtn.style.display = "block";
            } else {
                showToast(result.message, "error");
            }
        } catch (err) {
            showToast("Server error", "error");
        }
    });
}

    // --- 4. ADDRESS MODALS ---
    if (openAddressModal) openAddressModal.onclick = () => addressModal.style.display = "flex";
    if (closeAddressModal) closeAddressModal.onclick = () => addressModal.style.display = "none";

    // --- 5. CROPPER & HEIC CONVERSION ---
    if (imageUpload) {
        imageUpload.addEventListener('change', async function (e) {
            let file = e.target.files[0];
            if (!file) return;

            if (file.type === "image/heic" || file.name.toLowerCase().endsWith(".heic")) {
                showToast("Converting iPhone photo...", "info");
                try {
                    const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.8 });
                    file = new File([convertedBlob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" });
                } catch (err) { showToast("Conversion failed", "error"); return; }
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                cropperImage.src = event.target.result;
                cropperModal.style.display = 'flex';
                if (cropper) cropper.destroy();
                cropper = new Cropper(cropperImage, { aspectRatio: 1, viewMode: 1, background: false });
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
                        document.getElementById('profileAvatar').innerHTML = `<img src="${result.imagePath}" id="avatarImg">`;
                        if (removePhotoBtn) removePhotoBtn.style.display = 'flex';
                        cropperModal.style.display = 'none';
                        showToast("Image Updated!", "success");
                    }
                } catch (err) { showToast("Upload failed", "error"); }
                finally { cropButton.textContent = "Crop & Save"; cropButton.disabled = false; }
            }, 'image/jpeg');
        });
    }

    // --- 6. CUSTOM IMAGE DELETE (FULLY COVERED) ---
    if (removePhotoBtn) {
        removePhotoBtn.addEventListener('click', () => {
            imageDeleteModal.style.display = 'flex';
        });
    }

    const closeImageDeleteModal = () => { imageDeleteModal.style.display = 'none'; };
    if (cancelImageDelete) cancelImageDelete.onclick = closeImageDeleteModal;

    if (confirmImageDelete) {
        confirmImageDelete.addEventListener('click', async () => {
            confirmImageDelete.disabled = true;
            confirmImageDelete.textContent = "Deleting...";
            try {
                const response = await fetch('/user/profile/delete-image', { method: 'DELETE' });
                const result = await response.json();
                if (result.success) {
                    const fullName = document.getElementById('sidebarName').textContent.trim();
                    document.getElementById('profileAvatar').innerHTML = `<span id="avatarLetter">${fullName.charAt(0)}</span>`;
                    if (removePhotoBtn) removePhotoBtn.style.display = 'none';
                    showToast("Profile photo removed", "success");
                    closeImageDeleteModal();
                }
            } catch (err) { showToast("Error removing photo", "error"); }
            finally { 
                confirmImageDelete.disabled = false; 
                confirmImageDelete.textContent = "Yes, Delete"; 
            }
        });
    }

    // --- GLOBAL MODAL CLICK TO CLOSE ---
    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            [addressModal, cropperModal, imageDeleteModal, deleteConfirmModal].forEach(m => {
                if(m) m.style.display = "none";
            });
            if (cropper) cropper.destroy();
        }
    });

    if (closeCropper) closeCropper.onclick = () => { cropperModal.style.display = 'none'; if(cropper) cropper.destroy(); };
});

function showToast(message, type = "info") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();
    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => { toast.classList.remove("show"); setTimeout(() => toast.remove(), 300); }, 3000);
}