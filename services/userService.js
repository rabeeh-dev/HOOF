const fs = require('fs');
const path = require('path');
const User = require("../model/User");
const Product = require("../model/Product"); // Essential for search/shop functions

class UserService {
    /**
     * Updates basic profile information
     */
    async updateProfileData(userId, updateData) {
        const { fullName, phoneNumber, dateOfBirth } = updateData;

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {
                fullName: fullName,
                phone: phoneNumber,
                dob: dateOfBirth
            },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            throw new Error("User not found");
        }

        return updatedUser;
    }

    /**
     * Handle Profile Image Upload
     */
    async updateUserProfileImage(userId, filename, publicRoot) {
        const newImagePath = `/uploads/profile/${filename}`;
        
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        if (user.profileImage && user.profileImage.startsWith('/uploads/profile/')) {
            const oldPath = path.join(publicRoot, user.profileImage);
            
            try {
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                    console.log("Old profile image deleted successfully.");
                }
            } catch (err) {
                console.error("Warning: Could not delete old file:", err.message);
            }
        }

        user.profileImage = newImagePath;
        await user.save();

        return newImagePath;
    }

    /**
     * Remove Profile Image
     */
    async removeUserProfileImage(userId, publicRoot) {
        const user = await User.findById(userId);
        
        if (!user || !user.profileImage) {
            throw new Error("No image found to delete");
        }

        const imagePath = path.join(publicRoot, user.profileImage);
        try {
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        } catch (fileErr) {
            console.warn("File already missing or could not be deleted:", fileErr.message);
        }

        user.profileImage = ""; 
        await user.save();

        return true;
    }

    /**
     * Real-time / AJAX Search Logic
     */
    async searchProducts(searchQuery, page = 1, limit = 12) {
        const skip = (page - 1) * limit;
        
        const filter = {
            isBlocked: false,
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

    /**
     * General Shop Page Logic with Pagination & Filters
     */
    async getShopProducts({ page, limit, category, search, sort, maxPrice }) {
    const skip = (page - 1) * limit;
    
    // 1. Same Filter for both Find and Count
    let query = { isBlocked: false };
    if (category) query.category = category;
    if (search) query.productName = { $regex: search, $options: 'i' };
    if (maxPrice) query.salePrice = { $lte: parseFloat(maxPrice) };

    // 2. Execute Queries
    const products = await Product.find(query)
        .populate('category')
        .sort({ createdAt: -1 }) // Add your sort logic here
        .skip(skip)
        .limit(limit);

    const totalProducts = await Product.countDocuments(query);

    return {
        products,
        totalPages: Math.ceil(totalProducts / limit),
        currentPage: page
    };
}
}

module.exports = new UserService();