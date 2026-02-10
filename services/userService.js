const fs = require('fs');
const path = require('path');
const User = require("../model/User");

class UserService {
    /**
     * Updates basic profile information
     * @param {string} userId 
     * @param {Object} updateData 
     */
    async updateProfileData(userId, updateData) {
        const { fullName, phoneNumber, dateOfBirth } = updateData;

        // 1. Database logic: Find and update
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                fullName: fullName,
                phone: phoneNumber,
                dob: dateOfBirth
            },
            { new: true, runValidators: true } // runValidators ensures data integrity
        );

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }

    async updateUserProfileImage(userId, filename, publicRoot) {
        const newImagePath = `/uploads/profile/${filename}`;
        
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        // 1. SAFE CLEANUP
        // Only try to delete if there is an existing path
        if (user.profileImage && user.profileImage.startsWith('/uploads/profile/')) {
            const oldPath = path.join(publicRoot, user.profileImage);
            
            try {
                // Check if file exists before trying to delete
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log("Old profile image deleted successfully.");
                }
            } catch (err) {
                // LOG THE ERROR BUT DO NOT CRASH
                console.error("Warning: Could not delete old file:", err.message);
            }
        }

        // 2. UPDATE DATABASE (This will now run even if deletion failed)
        user.profileImage = newImagePath;
        await user.save();

        return newImagePath;
    }

    async removeUserProfileImage(userId, publicRoot) {
        const user = await User.findById(userId);
        
        if (!user || !user.profileImage) {
            throw new Error("No image found to delete");
        }

        // 1. SAFE FILE DELETION
        const imagePath = path.join(publicRoot, user.profileImage);
        try {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } catch (fileErr) {
            // Log but don't block the database update
            console.warn("File already missing or could not be deleted:", fileErr.message);
        }

        // 2. CLEAR DATABASE FIELD
        user.profileImage = ""; // or null, depending on your schema
        await user.save();

        return true;
    }

    async searchProducts(searchQuery, page = 1, limit = 12) {
    const skip = (page - 1) * limit;
    
    // Create a Case-Insensitive regex search
    const filter = {
        isBlocked: false, // Only show active products
        $or: [
            { productName: { $regex: searchQuery, $options: 'i' } },
            { brand: { $regex: searchQuery, $options: 'i' } }
        ]
    };

    const products = await Product.find(filter)
        .populate('category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalProducts = await Product.countDocuments(filter);

    return {
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page,
        totalResults: totalProducts
    };
}
}

module.exports = new UserService();