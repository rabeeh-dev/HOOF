/**
 * @file referral.js
 * @description Frontend logic for the referral page: copy code, withdraw to wallet.
 */

/**
 * Copy the referral code to the clipboard and show a toast.
 */
function copyReferralCode() {
    const code = document.getElementById('referralCode').textContent.trim();
    navigator.clipboard.writeText(code).then(() => {
        const btn = document.getElementById('copyCodeBtn');
        btn.classList.add('copied');
        btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        showToast('Referral code copied to clipboard!');
        setTimeout(() => {
            btn.classList.remove('copied');
            btn.innerHTML = '<i class="fas fa-copy"></i> Copy';
        }, 2500);
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = code;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('Referral code copied!');
    });
}

/**
 * Withdraw referral points to the HOOF wallet.
 */
async function withdrawToWallet() {
    const btn = document.getElementById('withdrawBtn');
    const originalText = btn.innerHTML;

    try {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        const res = await fetch('/user/referral/withdraw', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        const data = await res.json();

        if (data.success) {
            // Update the UI with new values
            document.getElementById('totalPoints').textContent = data.remainingPoints;
            document.getElementById('totalValue').textContent = '₹' + (data.remainingPoints / 100).toFixed(2);
            document.getElementById('withdrawPoints').textContent = data.remainingPoints + ' points';
            document.getElementById('withdrawValue').textContent = (data.remainingPoints / 100).toFixed(2);

            // Update sidebar stats
            const sidebarPoints = document.querySelector('.stat-item .stat-value[style*="accent"]');
            if (sidebarPoints) sidebarPoints.textContent = data.remainingPoints;

            const sidebarValue = document.querySelector('.stat-item .stat-value[style*="27ae60"]');
            if (sidebarValue) sidebarValue.textContent = '₹' + (data.remainingPoints / 100).toFixed(2);

            showToast(`₹${data.amountCredited.toFixed(2)} credited to your wallet!`);

            // Disable button if below minimum
            if (data.remainingPoints < 100) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-wallet"></i> Withdraw to Wallet';
                // Add hint if not present
                if (!document.querySelector('.withdraw-hint')) {
                    const hint = document.createElement('small');
                    hint.className = 'withdraw-hint';
                    hint.textContent = 'Minimum 100 points (₹1.00) required to withdraw';
                    btn.parentElement.appendChild(hint);
                }
            } else {
                btn.disabled = false;
                btn.innerHTML = originalText;
            }
        } else {
            showToast(data.message || 'Withdrawal failed', true);
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    } catch (err) {
        console.error('Withdraw error:', err);
        showToast('Something went wrong. Please try again.', true);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

/**
 * Show a toast notification.
 * @param {string} message
 * @param {boolean} isError
 */
function showToast(message, isError = false) {
    const toast = document.getElementById('referralToast');
    const msg = document.getElementById('toastMessage');
    msg.textContent = message;

    toast.classList.toggle('error', isError);
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
