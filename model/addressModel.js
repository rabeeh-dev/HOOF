const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    fullName: { 
        type: String, 
        required: true,
        trim: true 
    },
    mobile: { 
        type: String, 
        required: true,
        match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number']
    },
    houseName: { 
        type: String, 
        required: true 
    },
    pincode: { 
        type: String, 
        required: true,
        match: [/^\d{6}$/, 'Please enter a valid 6-digit pincode']
    },
    city: { 
        type: String, 
        required: true 
    },
    state: { 
        type: String, 
        required: true 
    },
    addressType: { 
        type: String, 
        enum: ['Home', 'Work', 'Other'], 
        default: 'Home' 
    },
    isDefault: { 
        type: Boolean, 
        default: false 
    }
}, { timestamps: true });

module.exports = mongoose.model("Address", addressSchema);