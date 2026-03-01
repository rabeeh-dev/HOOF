/**
 * @file public/user/js/checkout.js
 * @description Client-side logic for the checkout page with multi-step form, validation, and order placement.
 */

// ==========================================
// TOAST NOTIFICATIONS (Self-contained)
// ==========================================

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

// ==========================================
// STATE MANAGEMENT
// ==========================================

let selectedAddressId = null;
let selectedPaymentMethod = null;

// ==========================================
// STEP NAVIGATION
// ==========================================

const steps = [
    document.getElementById("stepAddress"),
    document.getElementById("stepPayment"),
    document.getElementById("stepConfirm")
];

function goToStep(stepNumber) {
    // Hide all steps
    steps.forEach((step, index) => {
        if (step) {
            step.style.display = index === stepNumber - 1 ? "block" : "none";
            if (index === stepNumber - 1) {
                step.style.animation = "fadeInUp 0.4s ease";
            }
        }
    });

    // Update progress bar
    updateProgressBar(stepNumber);

    // Populate review step if going to step 3
    if (stepNumber === 3) {
        populateReviewStep();
    }
}

function updateProgressBar(activeStep) {
    const stepItems = document.querySelectorAll(".step-item");
    const connectors = document.querySelectorAll(".step-connector");

    stepItems.forEach((item, index) => {
        const stepNum = index + 1;
        if (stepNum <= activeStep) {
            item.classList.add("active");
        } else {
            item.classList.remove("active");
        }
    });

    connectors.forEach((connector, index) => {
        if (index + 1 < activeStep) {
            connector.classList.add("active");
        } else {
            connector.classList.remove("active");
        }
    });
}

// ==========================================
// ADDRESS SELECTION
// ==========================================

function selectAddress(addressId) {
    selectedAddressId = addressId;

    // Update visual state
    document.querySelectorAll(".address-card").forEach(card => {
        card.classList.remove("selected");
    });

    const selectedCard = document.querySelector(`[data-address-id="${addressId}"]`);
    if (selectedCard) {
        selectedCard.classList.add("selected");
    }
}

function toggleCheckoutAddressForm() {
    const wrap = document.getElementById("checkoutAddressFormWrap");
    if (!wrap) return;
    const open = wrap.style.display !== "none";
    wrap.style.display = open ? "none" : "block";
}

function setInlineValidation(el, msg, type) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.remove("error", "success");
    if (type) el.classList.add(type);
}

function validateCheckoutAddressInputs(payload) {
    const mobileOk = /^[6-9]\d{9}$/.test(payload.mobile);
    const pinOk = /^\d{6}$/.test(payload.pincode);

    setInlineValidation(document.getElementById("coMobileError"), mobileOk ? "" : "Enter a valid 10-digit mobile number.", mobileOk ? "" : "error");
    setInlineValidation(document.getElementById("coPincodeError"), pinOk ? "" : "Enter a valid 6-digit pincode.", pinOk ? "" : "error");

    if (!payload.fullName || payload.fullName.trim().length < 3) return { ok: false, message: "Name must be at least 3 characters." };
    if (!mobileOk) return { ok: false, message: "Enter a valid 10-digit mobile number." };
    if (!payload.houseName || payload.houseName.trim().length < 2) return { ok: false, message: "House name/Flat is required." };
    if (!pinOk) return { ok: false, message: "Enter a valid 6-digit pincode." };
    if (!payload.city || payload.city.trim().length < 2) return { ok: false, message: "City is required." };
    if (!payload.state || payload.state.trim().length < 2) return { ok: false, message: "State is required." };

    return { ok: true };
}

function renderCheckoutAddressCard(address) {
    const safe = (v) => String(v ?? "");
    const defaultBadge = address.isDefault ? `<span class="default-badge">DEFAULT</span>` : "";

    return `
        <div class="address-card" data-address-id="${safe(address._id)}" onclick="selectAddress('${safe(address._id)}')">
            <div class="address-radio">
                <div class="radio-circle"></div>
            </div>
            <div class="address-details">
                <div class="address-header">
                    <span class="address-name">${safe(address.fullName)}</span>
                    ${defaultBadge}
                </div>
                <div class="address-phone">${safe(address.mobile)}</div>
                <div class="address-lines">
                    ${safe(address.houseName)}<br>
                    ${safe(address.city)}, ${safe(address.state)} - ${safe(address.pincode)}
                </div>
                <a class="address-edit" href="/user/address" onclick="event.stopPropagation();">Manage</a>
            </div>
        </div>
    `;
}

async function submitCheckoutAddressForm(e) {
    e.preventDefault();

    const payload = {
        fullName: document.getElementById("coFullName")?.value.trim() || "",
        mobile: document.getElementById("coMobile")?.value.trim() || "",
        houseName: document.getElementById("coHouseName")?.value.trim() || "",
        city: document.getElementById("coCity")?.value.trim() || "",
        state: document.getElementById("coState")?.value.trim() || "",
        pincode: document.getElementById("coPincode")?.value.trim() || "",
        addressType: document.getElementById("coAddressType")?.value || "Home",
        isDefault: document.getElementById("coIsDefault")?.checked || false
    };

    const v = validateCheckoutAddressInputs(payload);
    if (!v.ok) {
        showToast(v.message || "Please fill all required fields", "error");
        return;
    }

    const btn = document.getElementById("coSaveAddressBtn");
    const original = btn ? btn.innerHTML : "";
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
        const res = await fetch("/user/address/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
            showToast(data.message || "Failed to add address", "error");
            return;
        }

        // Remove empty state if present
        const empty = document.getElementById("noAddressesState");
        if (empty) empty.remove();

        // Ensure saved list exists
        let list = document.getElementById("savedAddresses");
        if (!list) {
            const body = document.querySelector("#stepAddress .checkout-card-body");
            list = document.createElement("div");
            list.className = "saved-addresses";
            list.id = "savedAddresses";
            body?.insertBefore(list, body.firstChild);
        }

        const address = data.address;
        if (address) {
            if (payload.isDefault) {
                // If default chosen, clear other badges in UI for consistency
                document.querySelectorAll(".default-badge").forEach(b => b.remove());
            }
            list.insertAdjacentHTML("afterbegin", renderCheckoutAddressCard(address));
            selectAddress(address._id);
        }

        // Reset + collapse form
        document.getElementById("checkoutAddAddressForm")?.reset();
        setInlineValidation(document.getElementById("coMobileError"), "");
        setInlineValidation(document.getElementById("coPincodeError"), "");
        document.getElementById("checkoutAddressFormWrap").style.display = "none";

        showToast("Address added successfully!", "success");
    } catch (err) {
        console.error("Checkout add address error:", err);
        showToast("Failed to add address.", "error");
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = original;
        }
    }
}

// ==========================================
// PAYMENT SELECTION
// ==========================================

function selectPayment(type) {
    const selectedCard = document.querySelector(`[data-payment="${type}"]`);
    if (selectedCard && selectedCard.classList.contains("disabled")) {
        return;
    }

    selectedPaymentMethod = type;

    // Update visual state
    document.querySelectorAll(".payment-card").forEach(card => {
        card.classList.remove("selected");
    });

    if (selectedCard) {
        selectedCard.classList.add("selected");
    }
}

// ==========================================
// CARD NUMBER FORMATTER
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const checkoutAddAddressForm = document.getElementById("checkoutAddAddressForm");
    if (checkoutAddAddressForm) {
        checkoutAddAddressForm.addEventListener("submit", submitCheckoutAddressForm);
    }

    const mobile = document.getElementById("coMobile");
    if (mobile) {
        mobile.addEventListener("input", () => setInlineValidation(document.getElementById("coMobileError"), ""));
    }
    const pincode = document.getElementById("coPincode");
    if (pincode) {
        pincode.addEventListener("input", () => setInlineValidation(document.getElementById("coPincodeError"), ""));
    }
});

// ==========================================
// STEP VALIDATION
// ==========================================

function validateStep1() {
    if (selectedAddressId) {
        return true;
    }
    showToast("Please select a saved address (or add one below)", "error");
    return false;
}

function validateStep2() {
    if (!selectedPaymentMethod) {
        showToast("Please select a payment method", "error");
        return false;
    }
    return true;
}

function validateAndContinue(stepNumber) {
    if (stepNumber === 1) {
        if (validateStep1()) {
            goToStep(2);
        }
    } else if (stepNumber === 2) {
        if (validateStep2()) {
            goToStep(3);
        }
    }
}

// ==========================================
// POPULATE REVIEW STEP
// ==========================================

function populateReviewStep() {
    // Populate delivery summary
    const deliverySummary = document.getElementById("deliverySummary");
    if (deliverySummary) {
        let addressHtml = "";

        if (selectedAddressId) {
            const addressCard = document.querySelector(`[data-address-id="${selectedAddressId}"]`);
            if (addressCard) {
                const name = addressCard.querySelector(".address-name")?.textContent || "";
                const phone = addressCard.querySelector(".address-phone")?.textContent || "";
                const lines = addressCard.querySelector(".address-lines")?.textContent || "";
                addressHtml = `
                    <strong>${name}</strong><br>
                    ${phone}<br>
                    ${lines}
                `;
            }
        }

        deliverySummary.innerHTML = addressHtml || "No address selected";
    }

    // Populate payment summary
    const paymentSummary = document.getElementById("paymentSummary");
    if (paymentSummary) {
        let paymentHtml = "";

        if (selectedPaymentMethod === "upi") {
            paymentHtml = `UPI Payment (Redirecting...)`;
        } else if (selectedPaymentMethod === "wallet") {
            paymentHtml = `Wallet — Pay from your wallet balance`;
        } else if (selectedPaymentMethod === "cod") {
            paymentHtml = "Cash on Delivery - Pay on delivery";
        }

        paymentSummary.innerHTML = paymentHtml || "No payment method selected";
    }
}

// ==========================================
// PLACE ORDER
// ==========================================

async function placeOrder() {
    const placeOrderBtn = document.querySelector(".btn-place-order");
    if (!placeOrderBtn) return;

    // Validate before placing order
    if (!validateStep1() || !validateStep2()) {
        showToast("Please complete all steps", "error");
        return;
    }

    // Show loading state
    const originalText = placeOrderBtn.innerHTML;
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    showLoading("Preparing your order...");

    try {
        // Prepare payload
        const payload = {
            addressId: selectedAddressId,
            paymentMethod: selectedPaymentMethod,
            couponCode: appliedCoupon
        };

        // Send order request
        const response = await fetch("/user/checkout/place-order", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            if (result.paymentMethod === "upi") {
                hideLoading();
                // Handle Razorpay Payment
                const options = {
                    key: result.keyId,
                    amount: result.amount,
                    currency: result.currency,
                    name: "HOOF SHOES",
                    description: "Order Payment",
                    image: "/user/images/home-images/logo.png",
                    order_id: result.razorpayOrderId,
                    handler: async function (response) {
                        try {
                            showLoading("Verifying payment...");
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
                                showToast("Payment successful!", "success");
                                setTimeout(() => {
                                    window.location.href = verifyResult.redirectUrl;
                                }, 1000);
                            } else {
                                window.location.href = `/user/payment-failure/${result.orderId}`;
                            }
                        } catch (err) {
                            console.error("Verification error:", err);
                            window.location.href = `/user/payment-failure/${result.orderId}`;
                        } finally {
                            hideLoading();
                        }
                    },
                    prefill: {
                        name: result.user.name,
                        email: result.user.email
                    },
                    theme: {
                        color: "#c41e3a"
                    },
                    modal: {
                        ondismiss: function () {
                            window.location.href = `/user/payment-failure/${result.orderId}`;
                        }
                    }
                };
                const rzp1 = new Razorpay(options);
                rzp1.on('payment.failed', function (response) {
                    window.location.href = `/user/payment-failure/${result.orderId}`;
                });
                rzp1.open();
            } else {
                // COD or Wallet Flow
                showToast("Order placed successfully!", "success");
                setTimeout(() => {
                    window.location.href = result.redirectUrl || "/user/orders";
                }, 1500);
            }
        } else {
            showToast(result.message || "Something went wrong", "error");
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = originalText;
            hideLoading();
        }
    } catch (error) {
        console.error("Place order error:", error);
        showToast("Something went wrong. Please try again.", "error");
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalText;
        hideLoading();
    }
}

// ==========================================
// PAGESHOW CACHE BUSTER
// ==========================================

window.addEventListener("pageshow", function (event) {
    if (event.persisted || (typeof window.performance !== "undefined" && window.performance.navigation.type === 2)) {
        window.location.reload();
    }
});

// ==========================================
// COUPON SYSTEM
// ==========================================
let appliedCoupon = null;
let discountAmt = 0;

function openCouponModal() {
    const modal = document.getElementById("couponModal");
    const list = document.getElementById("availableCouponsList");
    modal.style.display = "flex";

    // Fetch available coupons
    fetch("/user/available-coupons")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.coupons.length === 0) {
                    list.innerHTML = '<div class="no-coupons">No coupons available at the moment.</div>';
                } else {
                    list.innerHTML = data.coupons.map(coupon => `
                        <div class="coupon-list-item">
                            <div class="coupon-item-header">
                                <span class="coupon-code-badge">${coupon.couponCode}</span>
                                <span class="coupon-discount-text">
                                    ${coupon.discountType === 'percentage' ? coupon.discountValue + '%' : '₹' + coupon.discountValue} OFF
                                </span>
                            </div>
                            <div class="coupon-desc">${coupon.description}</div>
                            <div class="coupon-item-footer">
                                <span class="coupon-expiry">Expires: ${new Date(coupon.expiryDate).toLocaleDateString()}</span>
                                <button class="btn-select-coupon" onclick="selectCoupon('${coupon.couponCode}')">Select</button>
                            </div>
                        </div>
                    `).join("");
                }
            } else {
                list.innerHTML = '<div class="error-msg">Failed to load coupons.</div>';
            }
        })
        .catch(err => {
            console.error(err);
            list.innerHTML = '<div class="error-msg">Something went wrong.</div>';
        });
}

function closeCouponModal() {
    document.getElementById("couponModal").style.display = "none";
}

function selectCoupon(code) {
    document.getElementById("couponCodeInput").value = code;
    closeCouponModal();
}

async function applyCoupon() {
    const code = document.getElementById("couponCodeInput").value.trim();
    if (!code) {
        showToast("Please enter a coupon code", "error");
        return;
    }

    try {
        const response = await fetch("/user/apply-coupon", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ couponCode: code })
        });

        const data = await response.json();
        if (data.success) {
            appliedCoupon = data.couponCode;
            discountAmt = data.discountAmount;

            // Update UI
            document.getElementById("appliedCouponCodeText").innerText = appliedCoupon;
            document.getElementById("appliedCouponInfo").style.display = "block";
            document.getElementById("couponCodeInput").value = "";
            document.querySelector(".coupon-input-group").style.display = "none";
            document.querySelector(".available-coupons-btn").style.display = "none";

            updateOrderSummary(discountAmt);
            showToast(data.message, "success");
        } else {
            showToast(data.message, "error");
        }
    } catch (err) {
        console.error(err);
        showToast("Failed to apply coupon", "error");
    }
}

function removeCoupon() {
    appliedCoupon = null;
    discountAmt = 0;

    // Update UI
    document.getElementById("appliedCouponInfo").style.display = "none";
    document.querySelector(".coupon-input-group").style.display = "flex";
    document.querySelector(".available-coupons-btn").style.display = "flex";

    updateOrderSummary(0);
    showToast("Coupon removed", "info");
}

function updateOrderSummary(discount) {
    const subtotal = parseFloat(document.querySelector(".summary-row span:last-child").innerText.replace("₹", ""));
    const discountRow = document.getElementById("summaryDiscountRow");
    const discountVal = document.getElementById("summaryDiscountAmount");
    const totalVal = document.querySelector(".summary-total span:last-child");

    if (discount > 0) {
        discountRow.style.display = "flex";
        discountVal.innerText = "-₹" + discount;
    } else {
        discountRow.style.display = "none";
    }

    // Recalculate total
    // Note: Shipping logic is handled server-side usually, but we need to match it here
    const shipping = subtotal >= 999 ? 0 : 99;
    const finalTotal = subtotal - discount + shipping;
    totalVal.innerText = "₹" + finalTotal;
}
