/**
 * @file controller/addressController.js
 * @description Handles address-related operations for the user, including adding and deleting delivery addresses.
 */

const Address = require("../model/Address");
const User = require("../model/User");

/**
 * @desc    Render the dedicated address management page.
 * @route   GET /user/address
 * @access  Private (isUser)
 */
exports.getAddressPage = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) return res.redirect('/user/login');

        const user = await User.findById(userId);
        const addresses = await Address.find({ userId });

        res.render('User/user-address', {
            user,
            addresses,
            title: 'My Addresses | HOOF',
            layout: 'layouts/user'
        });
    } catch (err) {
        console.error("Address Page Error:", err);
        res.redirect('/user/profile');
    }
};

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

        const isDefault = req.body.isDefault === true || req.body.isDefault === 'true' || req.body.isDefault === 'on';

        // If setting as default, unset all other defaults first
        if (isDefault) {
            await Address.updateMany({ userId: req.session.userId }, { isDefault: false });
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
            addressType,
            isDefault
        });

        await newAddress.save();
        res.status(200).json({
            success: true,
            message: "Address added successfully!",
            address: {
                _id: newAddress._id,
                fullName: newAddress.fullName,
                mobile: newAddress.mobile,
                houseName: newAddress.houseName,
                city: newAddress.city,
                state: newAddress.state,
                pincode: newAddress.pincode,
                addressType: newAddress.addressType,
                isDefault: newAddress.isDefault
            }
        });

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

/**
 * @desc    Updates an existing address. Validates fields and handles default address logic.
 * @route   PUT /user/address/edit/:id
 * @access  Private (isUser)
 */
exports.editAddress = async (req, res) => {
    try {
        const { fullName, mobile, houseName, pincode, city, state, addressType } = req.body;

        const errors = [];
        if (!fullName || fullName.trim().length < 3) errors.push("Name must be at least 3 characters.");
        if (!/^[6-9]\d{9}$/.test(mobile)) errors.push("Enter a valid 10-digit mobile number.");
        if (!houseName || houseName.trim().length < 2) errors.push("House name/Flat is required.");
        if (!/^\d{6}$/.test(pincode)) errors.push("Enter a valid 6-digit pincode.");
        if (!city || city.trim().length < 2) errors.push("City is required.");
        if (!state || state.trim().length < 2) errors.push("State is required.");

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: errors[0] });
        }

        const isDefault = req.body.isDefault === true || req.body.isDefault === 'true' || req.body.isDefault === 'on';

        if (isDefault) {
            await Address.updateMany({ userId: req.session.userId }, { isDefault: false });
        }

        await Address.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            {
                fullName: fullName.trim(),
                mobile: mobile.trim(),
                houseName: houseName.trim(),
                pincode: pincode.trim(),
                city: city.trim(),
                state: state.trim(),
                addressType,
                isDefault
            }
        );

        res.status(200).json({ success: true, message: "Address updated successfully!" });
    } catch (error) {
        console.error("Edit Address Error:", error);
        res.status(500).json({ success: false, message: "Failed to update address." });
    }
};