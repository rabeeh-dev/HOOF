const Address = require("../model/Address");

// 1. Add Address
exports.addAddress = async (req, res) => {
    try {
        const { fullName, mobile, houseName, pincode, city, state, addressType } = req.body;

        // --- VALIDATION LOGIC ---
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

        const newAddress = new Address({
            userId: req.session.userId,
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

// 2. Delete Address
exports.deleteAddress = async (req, res) => {
    try {
        const addressId = req.params.id;
        await Address.findOneAndDelete({ _id: addressId, userId: req.session.userId });

        res.status(200).json({ success: true, message: "Address deleted successfully." });
    } catch (error) {
        console.error("Delete Address Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete address." });
    }
};