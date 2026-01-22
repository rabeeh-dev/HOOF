const Address = require("../model/addressModel");

// 1. Add Address
exports.addAddress = async (req, res) => {
    try {
        const { fullName, mobile, houseName, pincode, city, state, addressType } = req.body;

        const newAddress = new Address({
            userId: req.session.userId,
            fullName,
            mobile,
            houseName,
            pincode,
            city,
            state,
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
        // Ensure the address belongs to the logged-in user before deleting
        await Address.findOneAndDelete({ _id: addressId, userId: req.session.userId });
        
        res.status(200).json({ success: true, message: "Address deleted successfully." });
    } catch (error) {
        console.error("Delete Address Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete address." });
    }
};