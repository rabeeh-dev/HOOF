/**
 * @file services/userService.js
 * @description Service layer for user profile management, image uploads, and search functionalities.
 */

const fs = require('fs');
const path = require('path');
const User = require("../model/User");
const Product = require("../model/Product");

class UserService {
    /**
     * Updates basic profile information for a user.
     * @param {string} userId - User ID to update.
     * @param {Object} updateData - New profile data.
     * @param {string} updateData.fullName - Updated full name.
     * @param {string} updateData.phoneNumber - Updated phone number.
     * @param {string} updateData.dateOfBirth - Updated date of birth.
     * @returns {Promise<Object>} The updated user document.
     * @throws {Error} If user is not found.
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
     * Handles profile image upload and replaces existing image if present.
     * @param {string} userId - User ID.
     * @param {string} filename - New image filename.
     * @param {string} publicRoot - Absolute path to the public root directory.
     * @returns {Promise<string>} The path to the new profile image.
     * @throws {Error} If user is not found.
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
     * Removes the user's profile image and clears the database field.
     * @param {string} userId - User ID.
     * @param {string} publicRoot - Absolute path to the public root directory.
     * @returns {Promise<boolean>} True if successful.
     * @throws {Error} If no image exists to delete.
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
     * Performs a real-time/AJAX search for products based on a query.
     * @param {string} searchQuery - The search term (product name or brand).
     * @param {number} [page=1] - Current page number.
     * @param {number} [limit=12] - Number of results per page.
     * @returns {Promise<Object>} Object containing products, totalPages, currentPage, and totalResults.
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
     * Retrieves products for the general shop page with pagination and multiple filters.
     * @param {Object} params - Search and filter parameters.
     * @param {number} params.page - Current page number.
     * @param {number} params.limit - Results per page.
     * @param {string} [params.category] - Category ID filter.
     * @param {string} [params.search] - Search term filter.
     * @param {string} [params.sort] - Sorting criteria.
     * @param {number} [params.maxPrice] - Maximum price filter.
     * @returns {Promise<Object>} Object containing products, totalPages, and currentPage.
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
            .sort({ createdAt: -1 }) // Sort by newest by default
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