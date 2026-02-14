document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // TOAST NOTIFICATION
    // ==========================================

    function showToast(message, type = "success") {
        const existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = `toast-notification ${type}`;
        toast.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 50);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==========================================
    // ADD ADDRESS MODAL
    // ==========================================

    const addressModal = document.getElementById("addressModal");
    const openAddressBtn = document.getElementById("openAddressModal");
    const closeAddressBtn = document.getElementById("closeAddressModal");

    if (openAddressBtn) {
        openAddressBtn.onclick = () => { if (addressModal) addressModal.style.display = "flex"; };
    }
    if (closeAddressBtn) {
        closeAddressBtn.onclick = () => { if (addressModal) addressModal.style.display = "none"; };
    }

    // Inline validation for add form
    const addrMobile = document.getElementById('addrMobile');
    const addrPincode = document.getElementById('addrPincode');
    const addrMobileError = document.getElementById('addrMobileError');
    const addrPincodeError = document.getElementById('addrPincodeError');

    const validateAddrMobile = () => {
        if (!/^\d{10}$/.test(addrMobile.value.trim())) {
            addrMobileError.textContent = "Must be exactly 10 digits.";
            addrMobileError.className = "validation-message error";
            addrMobile.style.borderColor = "#dc3545";
            return false;
        }
        addrMobileError.textContent = "";
        addrMobile.style.borderColor = "rgba(0,0,0,0.08)";
        return true;
    };

    const validateAddrPincode = () => {
        if (!/^\d{6}$/.test(addrPincode.value.trim())) {
            addrPincodeError.textContent = "Must be exactly 6 digits.";
            addrPincodeError.className = "validation-message error";
            addrPincode.style.borderColor = "#dc3545";
            return false;
        }
        addrPincodeError.textContent = "";
        addrPincode.style.borderColor = "rgba(0,0,0,0.08)";
        return true;
    };

    if (addrMobile) addrMobile.addEventListener('input', validateAddrMobile);
    if (addrPincode) addrPincode.addEventListener('input', validateAddrPincode);

    // Add address form submission
    const addAddressForm = document.getElementById("addAddressForm");
    if (addAddressForm) {
        addAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isMobileValid = validateAddrMobile();
            const isPincodeValid = validateAddrPincode();
            if (!isMobileValid || !isPincodeValid) {
                showToast("Please fix the errors before saving.", "error");
                return;
            }

            const formData = new FormData(addAddressForm);
            const data = Object.fromEntries(formData.entries());
            data.isDefault = addAddressForm.querySelector('[name="isDefault"]').checked;
            const saveBtn = document.getElementById('saveAddressBtn');
            if (saveBtn) { saveBtn.disabled = true; saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Saving...'; }

            try {
                const response = await fetch('/user/address/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    showToast(result.message, "success");
                    if (addressModal) addressModal.style.display = "none";
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showToast(result.message, "error");
                }
            } catch (err) {
                showToast("Failed to add address", "error");
            } finally {
                if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = '<i class="fas fa-plus" style="margin-right: 8px;"></i>Save Address'; }
            }
        });
    }

    // ==========================================
    // DELETE ADDRESS
    // ==========================================

    window.deleteAddress = async function (id) {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            const res = await fetch(`/user/address/delete/${id}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
                showToast(result.message, "success");
                const card = document.getElementById(`address-${id}`);
                if (card) card.remove();
                // Check if no addresses left
                const grid = document.getElementById('addressGrid');
                if (grid && grid.querySelectorAll('.address-card').length === 0) {
                    grid.innerHTML = `
                        <div class="empty-state">
                            <div style="text-align: center; padding: 40px 20px;">
                                <i class="fas fa-map-marked-alt" style="font-size: 3rem; color: rgba(0,0,0,0.15); margin-bottom: 16px;"></i>
                                <p style="color: #999; font-size: 1rem;">No addresses saved yet.</p>
                            </div>
                        </div>`;
                }
            } else {
                showToast(result.message, "error");
            }
        } catch (err) {
            showToast("Failed to delete address", "error");
        }
    };

    // ==========================================
    // EDIT ADDRESS MODAL
    // ==========================================

    const editAddressModal = document.getElementById('editAddressModal');
    const closeEditBtn = document.getElementById('closeEditAddressModal');

    if (closeEditBtn) {
        closeEditBtn.onclick = () => { if (editAddressModal) editAddressModal.style.display = "none"; };
    }

    window.openEditAddress = function (id) {
        const card = document.querySelector(`.address-card[data-id="${id}"]`);
        if (!card || !editAddressModal) return;

        document.getElementById('editAddrId').value = id;
        document.getElementById('editFullName').value = card.dataset.fullname;
        document.getElementById('editMobile').value = card.dataset.mobile;
        document.getElementById('editHouseName').value = card.dataset.housename;
        document.getElementById('editCity').value = card.dataset.city;
        document.getElementById('editState').value = card.dataset.state;
        document.getElementById('editPincode').value = card.dataset.pincode;
        document.getElementById('editAddrType').value = card.dataset.type;
        document.getElementById('editIsDefault').checked = card.dataset.default === 'true';

        editAddressModal.style.display = 'flex';
    };

    // Edit form submission
    const editAddressForm = document.getElementById('editAddressForm');
    if (editAddressForm) {
        const editMobile = document.getElementById('editMobile');
        const editPincode = document.getElementById('editPincode');
        const editMobileError = document.getElementById('editMobileError');
        const editPincodeError = document.getElementById('editPincodeError');

        const validateEditMobile = () => {
            if (!/^\d{10}$/.test(editMobile.value.trim())) {
                editMobileError.textContent = "Must be exactly 10 digits.";
                editMobileError.className = "validation-message error";
                editMobile.style.borderColor = "#dc3545";
                return false;
            }
            editMobileError.textContent = "";
            editMobile.style.borderColor = "rgba(0,0,0,0.08)";
            return true;
        };

        const validateEditPincode = () => {
            if (!/^\d{6}$/.test(editPincode.value.trim())) {
                editPincodeError.textContent = "Must be exactly 6 digits.";
                editPincodeError.className = "validation-message error";
                editPincode.style.borderColor = "#dc3545";
                return false;
            }
            editPincodeError.textContent = "";
            editPincode.style.borderColor = "rgba(0,0,0,0.08)";
            return true;
        };

        if (editMobile) editMobile.addEventListener('input', validateEditMobile);
        if (editPincode) editPincode.addEventListener('input', validateEditPincode);

        editAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!validateEditMobile() || !validateEditPincode()) {
                showToast("Please fix the errors before saving.", "error");
                return;
            }

            const id = document.getElementById('editAddrId').value;
            const formData = new FormData(editAddressForm);
            const data = Object.fromEntries(formData.entries());
            data.isDefault = document.getElementById('editIsDefault').checked;

            const updateBtn = document.getElementById('updateAddressBtn');
            if (updateBtn) { updateBtn.disabled = true; updateBtn.innerHTML = '<i class="fas fa-spinner fa-spin" style="margin-right: 8px;"></i>Updating...'; }

            try {
                const response = await fetch(`/user/address/edit/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await response.json();
                if (result.success) {
                    showToast(result.message, "success");
                    if (editAddressModal) editAddressModal.style.display = "none";
                    setTimeout(() => window.location.reload(), 1000);
                } else {
                    showToast(result.message, "error");
                }
            } catch (err) {
                showToast("Failed to update address", "error");
            } finally {
                if (updateBtn) { updateBtn.disabled = false; updateBtn.innerHTML = '<i class="fas fa-save" style="margin-right: 8px;"></i>Update Address'; }
            }
        });
    }

    // ==========================================
    // OVERLAY CLICK TO CLOSE
    // ==========================================

    window.addEventListener("click", (e) => {
        if (e.target.classList.contains("modal-overlay")) {
            const modals = [addressModal, editAddressModal];
            modals.forEach(m => { if (m) m.style.display = "none"; });
        }
    });
});
