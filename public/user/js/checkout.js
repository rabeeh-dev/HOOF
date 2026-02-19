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
let newAddressData = null;

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
    newAddressData = null;

    // Update visual state
    document.querySelectorAll(".address-card").forEach(card => {
        card.classList.remove("selected");
    });

    const selectedCard = document.querySelector(`[data-address-id="${addressId}"]`);
    if (selectedCard) {
        selectedCard.classList.add("selected");
    }

    // Hide new address form if open
    const newAddressForm = document.getElementById("newAddressForm");
    if (newAddressForm && newAddressForm.style.display !== "none") {
        toggleNewAddressForm();
    }
}

function toggleNewAddressForm() {
    const form = document.getElementById("newAddressForm");
    if (!form) return;

    const isVisible = form.style.display !== "none";
    form.style.display = isVisible ? "none" : "block";

    if (!isVisible) {
        // Clear selected address when showing new form
        selectedAddressId = null;
        document.querySelectorAll(".address-card").forEach(card => {
            card.classList.remove("selected");
        });
    }
}

function saveNewAddress() {
    const fullName = document.getElementById("newFullName")?.value.trim();
    const phone = document.getElementById("newPhone")?.value.trim();
    const addressLine1 = document.getElementById("newAddressLine1")?.value.trim();
    const addressLine2 = document.getElementById("newAddressLine2")?.value.trim();
    const city = document.getElementById("newCity")?.value.trim();
    const state = document.getElementById("newState")?.value.trim();
    const pincode = document.getElementById("newPincode")?.value.trim();
    const setAsDefault = document.getElementById("setAsDefault")?.checked;

    if (!fullName || !phone || !addressLine1 || !city || !state || !pincode) {
        showToast("Please fill all required fields", "error");
        return;
    }

    // Store new address data
    newAddressData = {
        fullName,
        phone,
        addressLine1,
        addressLine2: addressLine2 || "",
        city,
        state,
        pincode,
        isDefault: setAsDefault || false
    };

    selectedAddressId = null;
    showToast("Address saved", "success");
}

function editAddress(addressId) {
    // For now, just go back to step 1 and let user select
    // In a full implementation, you might open a modal or navigate to address management
    goToStep(1);
    showToast("Please select an address or add a new one", "info");
}

// ==========================================
// PAYMENT SELECTION
// ==========================================

function selectPayment(type) {
    selectedPaymentMethod = type;

    // Update visual state
    document.querySelectorAll(".payment-card").forEach(card => {
        card.classList.remove("selected");
    });

    const selectedCard = document.querySelector(`[data-payment="${type}"]`);
    if (selectedCard && !selectedCard.classList.contains("disabled")) {
        selectedCard.classList.add("selected");
    }

    // Show/hide payment fields with smooth animation
    const upiFields = document.getElementById("upiFields");
    const cardFields = document.getElementById("cardFields");

    if (type === "upi") {
        if (cardFields) {
            cardFields.classList.remove("show");
            setTimeout(() => {
                if (!cardFields.classList.contains("show")) {
                    cardFields.style.display = "none";
                }
            }, 300);
        }
        if (upiFields) {
            upiFields.style.display = "block";
            setTimeout(() => {
                upiFields.classList.add("show");
            }, 10);
        }
    } else if (type === "card") {
        if (upiFields) {
            upiFields.classList.remove("show");
            setTimeout(() => {
                if (!upiFields.classList.contains("show")) {
                    upiFields.style.display = "none";
                }
            }, 300);
        }
        if (cardFields) {
            cardFields.style.display = "block";
            setTimeout(() => {
                cardFields.classList.add("show");
            }, 10);
        }
    } else {
        if (upiFields) {
            upiFields.classList.remove("show");
            setTimeout(() => {
                if (!upiFields.classList.contains("show")) {
                    upiFields.style.display = "none";
                }
            }, 300);
        }
        if (cardFields) {
            cardFields.classList.remove("show");
            setTimeout(() => {
                if (!cardFields.classList.contains("show")) {
                    cardFields.style.display = "none";
                }
            }, 300);
        }
    }
}

// ==========================================
// CARD NUMBER FORMATTER
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const cardNumberInput = document.getElementById("cardNumber");
    if (cardNumberInput) {
        cardNumberInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\s/g, "").replace(/\D/g, "");
            if (value.length > 16) value = value.slice(0, 16);
            
            // Add space every 4 digits (max 19 chars: 16 digits + 3 spaces)
            let formatted = "";
            for (let i = 0; i < value.length; i += 4) {
                formatted += value.slice(i, i + 4);
                if (i + 4 < value.length) formatted += " ";
            }
            
            // Limit to 19 characters total
            if (formatted.length > 19) {
                formatted = formatted.slice(0, 19);
            }
            
            e.target.value = formatted;
        });
    }

    // Card expiry formatter (MM/YY)
    const cardExpiryInput = document.getElementById("cardExpiry");
    if (cardExpiryInput) {
        cardExpiryInput.addEventListener("input", (e) => {
            let value = e.target.value.replace(/\D/g, "");
            if (value.length > 4) value = value.slice(0, 4);
            
            if (value.length >= 2) {
                value = value.slice(0, 2) + "/" + value.slice(2);
            }
            
            e.target.value = value;
        });
    }

    // CVV formatter (only digits, max 3)
    const cardCvvInput = document.getElementById("cardCvv");
    if (cardCvvInput) {
        cardCvvInput.addEventListener("input", (e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
        });
    }
});

// ==========================================
// STEP VALIDATION
// ==========================================

function validateStep1() {
    if (selectedAddressId) {
        return true;
    }

    if (newAddressData) {
        return true;
    }

    // Check if new address form is visible and filled
    const newAddressForm = document.getElementById("newAddressForm");
    if (newAddressForm && newAddressForm.style.display !== "none") {
        const fullName = document.getElementById("newFullName")?.value.trim();
        const phone = document.getElementById("newPhone")?.value.trim();
        const addressLine1 = document.getElementById("newAddressLine1")?.value.trim();

        if (!fullName || !phone || !addressLine1) {
            showToast("Please fill all required address fields", "error");
            return false;
        }

        // Save address data
        saveNewAddress();
        return true;
    }

    showToast("Please select an address or add a new one", "error");
    return false;
}

function validateStep2() {
    if (!selectedPaymentMethod) {
        showToast("Please select a payment method", "error");
        return false;
    }

    if (selectedPaymentMethod === "upi") {
        const upiId = document.getElementById("upiId")?.value.trim();
        if (!upiId || !upiId.includes("@")) {
            showToast("Please enter a valid UPI ID", "error");
            return false;
        }
    } else if (selectedPaymentMethod === "card") {
        const cardNumber = document.getElementById("cardNumber")?.value.replace(/\s/g, "");
        const cardholderName = document.getElementById("cardholderName")?.value.trim();
        const cardExpiry = document.getElementById("cardExpiry")?.value.trim();
        const cardCvv = document.getElementById("cardCvv")?.value.trim();

        if (!cardNumber || cardNumber.length !== 16) {
            showToast("Please enter a valid card number", "error");
            return false;
        }

        if (!cardholderName) {
            showToast("Please enter cardholder name", "error");
            return false;
        }

        if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
            showToast("Please enter a valid expiry date (MM/YY)", "error");
            return false;
        }

        if (!cardCvv || cardCvv.length !== 3) {
            showToast("Please enter a valid CVV", "error");
            return false;
        }
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
        } else if (newAddressData) {
            addressHtml = `
                <strong>${newAddressData.fullName}</strong><br>
                ${newAddressData.phone}<br>
                ${newAddressData.addressLine1}<br>
                ${newAddressData.addressLine2 ? newAddressData.addressLine2 + "<br>" : ""}
                ${newAddressData.city}, ${newAddressData.state} - ${newAddressData.pincode}
            `;
        }

        deliverySummary.innerHTML = addressHtml || "No address selected";
    }

    // Populate payment summary
    const paymentSummary = document.getElementById("paymentSummary");
    if (paymentSummary) {
        let paymentHtml = "";

        if (selectedPaymentMethod === "upi") {
            const upiId = document.getElementById("upiId")?.value.trim() || "";
            paymentHtml = `UPI: ${upiId}`;
        } else if (selectedPaymentMethod === "card") {
            const cardNumber = document.getElementById("cardNumber")?.value.replace(/\s/g, "") || "";
            const last4 = cardNumber.slice(-4);
            paymentHtml = `Card: **** **** **** ${last4}`;
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
    placeOrderBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Placing Order...';

    try {
        // Collect payment details
        let paymentDetails = {};
        if (selectedPaymentMethod === "upi") {
            paymentDetails = {
                type: "upi",
                upiId: document.getElementById("upiId")?.value.trim() || ""
            };
        } else if (selectedPaymentMethod === "card") {
            const cardNumber = document.getElementById("cardNumber")?.value.replace(/\s/g, "") || "";
            paymentDetails = {
                type: "card",
                last4: cardNumber.slice(-4),
                cardholderName: document.getElementById("cardholderName")?.value.trim() || "",
                expiry: document.getElementById("cardExpiry")?.value.trim() || ""
            };
        } else {
            paymentDetails = {
                type: "cod"
            };
        }

        // Prepare payload
        const payload = {
            addressId: selectedAddressId,
            newAddress: newAddressData,
            paymentMethod: selectedPaymentMethod,
            paymentDetails: paymentDetails
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
            showToast("Order placed successfully!", "success");
            // Redirect after a short delay
            setTimeout(() => {
                window.location.href = result.redirectUrl || "/user/orders";
            }, 1500);
        } else {
            showToast(result.message || "Something went wrong", "error");
            placeOrderBtn.disabled = false;
            placeOrderBtn.innerHTML = originalText;
        }
    } catch (error) {
        console.error("Place order error:", error);
        showToast("Something went wrong. Please try again.", "error");
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerHTML = originalText;
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
