const User = require("../model/User");
const crypto = require("crypto");
const { sendResetPasswordEmail } = require("../utils/sendEmail");
const bcrypt = require("bcrypt");

class PasswordService {
    /**
     * Handles the forgot password request logic
     * @param {string} email 
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

    //Reset Password Function

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