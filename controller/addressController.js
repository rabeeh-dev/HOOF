/**
 * @file controller/addressController.js
 * @description Handles address-related operations for the user, including adding and deleting delivery addresses.
 */

const Address = require("../model/Address");

/**
 * @desc    Validates and saves a new delivery address for the logged-in user.
 * @route   POST /user/address/add
 * @access  Private (isUser)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */

exports.addAddress = async (req, res) => {
    try {
        const { fullName, mobile, houseName, pincode, city, state, addressType } = req.body;

        // --- INTERNAL VALIDATION LOGIC ---
        const errors = [];
        if (!fullName || fullName.trim().length < 3) {
            errors.push("Name must be at least 3 characters.");
        }
        if (!/^[6-9]\d{9}$/.test(mobile)) {
            errors.push("Enter a valid 10-digit mobile number.");
        }
        if (!houseName || houseName.trim().length < 2) {
            errors.push("House name/Flat is required.");
        }
        if (!/^\d{6}$/.test(pincode)) {
            errors.push("Enter a valid 6-digit pincode.");
        }
        if (!city || city.trim().length < 2) {
            errors.push("City is required.");
        }
        if (!state || state.trim().length < 2) {
            errors.push("State is required.");
        }

        // If any business rules are violated, return the first error found
        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0] });
        }

        // --- DATA PERSISTENCE ---
        const newAddress = new Address({
            userId: req.session.userId, // Linked to the active session
            fullName: fullName.trim(),
            mobile: mobile.trim(),
            houseName: houseName.trim(),
            pincode: pincode.trim(),
            city: city.trim(),
            state: state.trim(),
            addressType
        });

        await newAddress.save();
        res.status(200).json({ success: true, message: "Address added successfully!" });

    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ success: false, message: "Failed to add address." });
    }
};

/**
 * @desc    Permanently removes an address. Secured by checking userId against session.
 * @route   DELETE /user/address/delete/:id
 * @access  Private (isUser)
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @returns {void}
 */
exports.deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;

        // Ensure the address belongs to the logged-in user before deleting
        await Address.findOneAndDelete({ _id: addressId, userId: req.session.userId });

        res.status(200).json({ success: true, message: "Address deleted successfully." });
    } catch (error) {
        console.error("Delete Address Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete address." });
    }
};