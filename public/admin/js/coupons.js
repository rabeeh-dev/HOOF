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
}

/**
 * Open the modal for editing an existing coupon.
 * @param {string} id - The ID of the coupon to edit.
 */
async function openEditCouponModal(id) {
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

        // Format date for input[type="date"]
        if (coupon.expiryDate) {
            const date = new Date(coupon.expiryDate);
            const formattedDate = date.toISOString().split('T')[0];
            document.getElementById('expiryDate').value = formattedDate;
        }

        title.innerText = 'Edit Coupon';
        modal.classList.add('show');
    } catch (err) {
        console.error("Edit coupon error:", err);
        Swal.fire('Error', 'Something went wrong', 'error');
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

    const url = id ? `/admin/coupons/edit/${id}` : '/admin/coupons/add';
    const method = id ? 'PATCH' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

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
