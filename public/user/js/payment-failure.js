/**
 * @file public/user/js/payment-failure.js
 * @description Logic for retrying payments from the failure page.
 */

// Fallback loading helpers since layout.js is missing on this standalone page
function showLoading(text = "Processing...") {
    const overlay = document.getElementById("global-loading-overlay");
    if (overlay) {
        const textEl = overlay.querySelector(".loading-text");
        if (textEl) textEl.textContent = text;
        overlay.style.display = "flex";
    }
}

function hideLoading() {
    const overlay = document.getElementById("global-loading-overlay");
    if (overlay) overlay.style.display = "none";
}

function showToast(message, type = "info") {
    const existing = document.querySelector(".toast-notification");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast-notification toast-${type}`;
    const borderColor = type === "success" ? "#2ecc71" : type === "error" ? "#dc3545" : "#3498db";
    toast.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        z-index: 1000;
        border-left: 5px solid ${borderColor};
        animation: fadeInUp 0.3s ease;
    `;
    toast.innerHTML = `<span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

document.addEventListener("DOMContentLoaded", () => {
    const retryBtn = document.getElementById("retryPaymentBtn");
    if (!retryBtn) return;

    retryBtn.addEventListener("click", async () => {
        const orderId = retryBtn.getAttribute("data-order-id");

        // Loading state
        const originalText = retryBtn.innerHTML;
        retryBtn.disabled = true;
        retryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Initializing...';
        showLoading("Re-initializing payment...");

        try {
            const response = await fetch("/user/checkout/retry-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId })
            });

            const result = await response.json();

            if (result.success) {
                hideLoading();
                const options = {
                    key: result.keyId,
                    amount: result.amount,
                    currency: result.currency,
                    name: "HOOF SHOES",
                    description: "Retry Order Payment",
                    image: "/user/images/home-images/logo.png",
                    order_id: result.razorpayOrderId,
                    handler: async function (response) {
                        try {
                            showLoading("Verifying your payment...");
                            const verifyBody = {
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                orderId: result.orderId
                            };

                            const verifyRes = await fetch("/user/checkout/verify-payment", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(verifyBody)
                            });

                            const verifyResult = await verifyRes.json();
                            if (verifyResult.success) {
                                window.location.href = verifyResult.redirectUrl;
                            } else {
                                showToast(verifyResult.message || "Verification failed", "error");
                                retryBtn.style.display = 'none';
                            }
                        } catch (err) {
                            console.error(err);
                            showToast("Verification error", "error");
                            retryBtn.style.display = 'none';
                        } finally {
                            hideLoading();
                        }
                    },
                    prefill: {
                        name: result.user.name,
                        email: result.user.email
                    },
                    theme: { color: "#c41e3a" },
                    modal: {
                        ondismiss: function () {
                            showToast("Payment cancelled", "info");
                            retryBtn.style.display = 'none';
                        }
                    }
                };
                const rzp = new Razorpay(options);
                rzp.open();
            } else {
                showToast(result.message || "Failed to start payment", "error");
                retryBtn.style.display = 'none';
                hideLoading();
            }
        } catch (err) {
            console.error(err);
            showToast("Something went wrong", "error");
            retryBtn.style.display = 'none';
            hideLoading();
        }
    });
});
