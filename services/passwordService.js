/**
 * @file services/passwordService.js
 * @description Service layer for password recovery and reset operations.
 */

const User = require("../model/User");
const crypto = require("crypto");
const { sendResetPasswordEmail } = require("../utils/sendEmail");
const bcrypt = require("bcrypt");

class PasswordService {
    /**
     * Initiates the password reset process by generating a token and sending a reset email.
     * @param {string} email - User's email address.
     * @returns {Promise<boolean>} True if the process completed (always true for security).
     */
    async initiatePasswordReset(email) {
        // 1. Fetch user
        const user = await User.findOne({ email });

        // 2. Business Rule: Only process for local auth providers
        if (user && user.authProvider === "local") {

            // 3. Security: Generate raw token for email and hashed version for DB
            const resetToken = crypto.randomBytes(32).toString("hex");
            const hashedToken = crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");

            // 4. Persistence: Save hashed token and set 15-minute expiry
            user.resetPasswordToken = hashedToken;
            user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
            await user.save();

            // 5. Communication: Send the raw token in the email
            await sendResetPasswordEmail(email, resetToken);
        }

        // Always return true to keep the response generic for security
        return true;
    }

    /**
     * Resets the user's password using a valid reset token.
     * @param {string} token - The raw reset token from the email.
     * @param {string} password - The new plain-text password.
     * @returns {Promise<boolean>} True if successful.
     * @throws {Error} If the token is invalid or expired.
     */
    async resetPassword(token, password) {
        // 1. Hash the incoming token to match DB storage
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // 2. Find user with valid token and expiry
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new Error("Invalid or expired reset link");
        }

        // 3. Security: Hash the new password
        user.password = await bcrypt.hash(password, 10);

        // 4. Cleanup: Clear reset fields
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        await user.save({ validateBeforeSave: false });
        return true;
    }
}

module.exports = new PasswordService();