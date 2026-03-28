/* ==================== ADMIN COUPON MANAGEMENT JS ==================== */

/**
 * Open the modal for adding a new coupon.
 */
function openAddCouponModal() {
    const modal = document.getElementById('couponModal');
    const form = document.getElementById('couponForm');
    const title = document.getElementById('modalTitle');

    // Reset form
    form.reset();
    document.getElementById('couponId').value = '';

    title.innerText = 'Add New Coupon';
    modal.classList.add('show');
    
    // Trigger change to set correct visibility for default dropdown state
    const dt = document.getElementById('discountType');
    if (dt) dt.dispatchEvent(new Event('change'));
}

/**
 * Open the modal for editing an existing coupon.
 * @param {string} id - The ID of the coupon to edit.
 */
async function openEditCouponModal(id) {
    showLoading("Fetching coupon details...");
    try {
        const response = await fetch(`/admin/coupons/${id}`);
        const data = await response.json();

        if (!data.success) {
            Swal.fire('Error', data.message || 'Failed to fetch coupon details', 'error');
            return;
        }

        const coupon = data.coupon;
        const modal = document.getElementById('couponModal');
        const title = document.getElementById('modalTitle');

        // Populate form
        document.getElementById('couponId').value = coupon._id;
        document.getElementById('couponCode').value = coupon.couponCode;
        document.getElementById('description').value = coupon.description;
        document.getElementById('discountType').value = coupon.discountType;
        document.getElementById('discountValue').value = coupon.discountValue;
        document.getElementById('minPurchaseAmount').value = coupon.minPurchaseAmount;
        document.getElementById('maxDiscountAmount').value = coupon.maxDiscountAmount || '';
        document.getElementById('usageLimit').value = coupon.usageLimit;

        // Dispatch change after setting discountType
        document.getElementById('discountType').dispatchEvent(new Event('change'));

        // Format date for input[type="date"]
        if (coupon.expiryDate) {
            const date = new Date(coupon.expiryDate);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('expiryDate').value = formattedDate;
        }

        title.innerText = 'Edit Coupon';
        modal.classList.add('show');
    } finally {
        hideLoading();
    }
}

/**
 * Close the coupon modal.
 */
function closeCouponModal() {
    document.getElementById('couponModal').classList.remove('show');
}

/**
 * Handle form submission for adding or updating a coupon.
 * @param {Event} e 
 */
async function submitCouponForm(e) {
    e.preventDefault();

    const id = document.getElementById('couponId').value;
    const form = document.getElementById('couponForm');
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());

    // Convert numbers
    payload.discountValue = parseFloat(payload.discountValue);
    payload.minPurchaseAmount = parseFloat(payload.minPurchaseAmount);
    payload.maxDiscountAmount = payload.maxDiscountAmount ? parseFloat(payload.maxDiscountAmount) : undefined;
    payload.usageLimit = parseInt(payload.usageLimit);

    // Confirmation for 100% discount
    if (payload.discountType === 'percentage' && payload.discountValue === 100) {
        const result = await Swal.fire({
            title: '100% Discount Detected!',
            text: 'You have given percentage 100. Are you sure you want to proceed with this free offer?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, Proceed',
            cancelButtonText: 'No, Cancel',
            confirmButtonColor: '#ff914d',
            cancelButtonColor: '#d33'
        });
        if (!result.isConfirmed) return; // User cancelled
    }

    const url = id ? `/admin/coupons/edit/${id}` : '/admin/coupons/add';
    const method = id ? 'PATCH' : 'POST';
    showLoading(id ? "Updating coupon..." : "Creating new coupon...");

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        hideLoading();

        if (data.success) {
            Swal.fire({
                title: 'Success!',
                text: data.message,
                icon: 'success',
                timer: 1500
            }).then(() => window.location.reload());
        } else {
            Swal.fire('Error', data.message || 'Operation failed', 'error');
        }
    } catch (err) {
        console.error("Submit coupon error:", err);
        hideLoading();
        Swal.fire('Error', 'Something went wrong', 'error');
    }
}

/**
 * Toggle the status (Active/Blocked) of a coupon.
 * @param {string} id 
 */
async function toggleCouponStatus(id) {
    const result = await Swal.fire({
        title: 'Change Status?',
        text: "Are you sure you want to toggle this coupon's status?",
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#ff914d',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, change it!'
    });

    if (result.isConfirmed) {
        showLoading("Updating coupon status...");
        try {
            const response = await fetch(`/admin/coupons/toggle-status/${id}`, { method: 'PATCH' });
            const data = await response.json();

            if (data.success) {
                Swal.fire({
                    title: 'Updated!',
                    text: data.message,
                    icon: 'success',
                    timer: 1000
                }).then(() => window.location.reload());
            } else {
                Swal.fire('Error', data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error("Toggle status error:", err);
            Swal.fire('Error', 'Something went wrong', 'error');
        } finally {
            hideLoading();
        }
    }
}

/**
 * Filter coupons in the table based on search input.
 */
function searchCoupons() {
    const filter = document.getElementById('couponSearch').value.toLowerCase();
    const rows = document.querySelectorAll('#couponTableBody tr');

    rows.forEach(row => {
        const code = row.querySelector('.coupon-code-cell').textContent.toLowerCase();
        const desc = row.cells[1].textContent.toLowerCase();

        if (code.includes(filter) || desc.includes(filter)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Auto-bind UX toggle
document.addEventListener('DOMContentLoaded', () => {
    const discountTypeEl = document.getElementById('discountType');
    const maxDiscountGroup = document.getElementById('maxDiscountGroup');
    const maxDiscountInput = document.getElementById('maxDiscountAmount');

    if (discountTypeEl && maxDiscountGroup && maxDiscountInput) {
        discountTypeEl.addEventListener('change', () => {
            if (discountTypeEl.value === 'percentage') {
                maxDiscountGroup.style.display = 'block';
                maxDiscountInput.setAttribute('required', 'true');
            } else {
                maxDiscountGroup.style.display = 'none';
                maxDiscountInput.removeAttribute('required');
                maxDiscountInput.value = ''; // flat coupons don't use max discount
            }
        });
        // Run once on initial load
        discountTypeEl.dispatchEvent(new Event('change'));
    }
});
