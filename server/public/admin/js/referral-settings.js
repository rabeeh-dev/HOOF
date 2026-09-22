/**
 * @file referral-settings.js
 * @description Client-side logic for admin referral settings page.
 */

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('referralSettingsForm');
    const saveBtn = document.getElementById('saveBtn');

    // Live preview
    const pointsPerReferralInput = document.getElementById('pointsPerReferral');
    const pointsPerRupeeInput = document.getElementById('pointsPerRupee');
    const previewReferralValue = document.getElementById('previewReferralValue');
    const previewPtsPerRupee = document.getElementById('previewPtsPerRupee');
    const previewRupeeValue = document.getElementById('previewRupeeValue');

    function updatePreview() {
        const ppr = parseInt(pointsPerReferralInput.value) || 0;
        const ppru = parseInt(pointsPerRupeeInput.value) || 1;

        previewReferralValue.textContent = ppr + ' pts';
        previewPtsPerRupee.textContent = ppru;
        previewRupeeValue.textContent = '₹' + (ppr / ppru).toFixed(2);
    }

    pointsPerReferralInput.addEventListener('input', updatePreview);
    pointsPerRupeeInput.addEventListener('input', updatePreview);

    pointsPerRupeeInput.addEventListener('input', updatePreview);

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const pointsPerReferral = parseInt(pointsPerReferralInput.value);
        const pointsPerRupee = parseInt(pointsPerRupeeInput.value);
        const minWithdrawPoints = parseInt(document.getElementById('minWithdrawPoints').value);
        const isActive = true; // Hardcoded to always active since toggle is removed

        // Client-side validation
        if (pointsPerReferral < 0) {
            return Swal.fire('Error', 'Points per referral cannot be negative', 'error');
        }
        if (pointsPerRupee < 1) {
            return Swal.fire('Error', 'Points per rupee must be at least 1', 'error');
        }
        if (minWithdrawPoints < 1) {
            return Swal.fire('Error', 'Minimum withdrawal must be at least 1', 'error');
        }

        const originalText = saveBtn.innerHTML;
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
            const res = await fetch('/admin/referral', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pointsPerReferral,
                    pointsPerRupee,
                    minWithdrawPoints,
                    isActive
                })
            });

            const data = await res.json();

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Saved!',
                    text: data.message,
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', data.message || 'Failed to save settings', 'error');
            }
        } catch (err) {
            console.error('Save error:', err);
            Swal.fire('Error', 'Something went wrong. Please try again.', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        }
    });
});
