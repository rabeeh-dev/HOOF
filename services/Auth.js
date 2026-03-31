/**
 * @file services/authService.js
 * @description Service layer for user authentication, OTP management, and registration logic.
 */

const User = require("../model/User");
const Otp = require("../model/Otp");
const ReferralConfig = require("../model/ReferralConfig");
const bcrypt = require("bcrypt");
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail } = require("../utils/sendEmail");
const walletService = require('./Wallet');

class AuthService {
    /**
     * Initiates the signup process by validating the user, hashing the password, and sending an OTP.
     * @param {string} fullName - User's full name.
     * @param {string} email - User's email address.
     * @param {string} password - User's plain-text password.
     * @returns {Promise<Object>} Object containing pending user data and the raw OTP.
     * @throws {Error} If the user already exists.
     */
    async initiateSignup(fullName, email, password, referralCode = null) {
        // 1. Business Logic: Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new Error("User already exists");
        }

        // 1b. Validate referral code if provided
        if (referralCode) {
            const referrer = await User.findOne({ referralCode: referralCode.toUpperCase() });
            if (!referrer) {
                throw new Error("Invalid referral code");
            }
        }

        // 2. Security: Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. OTP Logic: Generate and Hash
        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // 4. Persistence: Clean old OTPs and create new one
        await Otp.deleteMany({ email });
        await Otp.create({
            email,
            otp: hashedOtp,
            expiresAt: Date.now() + 5 * 60 * 1000,
            lastSentAt: new Date(),
        });

        // 5. Communication: Send Email
        await sendOtpEmail(email, otp);

        // Return the processed data back to the controller
        return {
            pendingUser: {
                fullName,
                email,
                password: hashedPassword,
                referralCode: referralCode ? referralCode.toUpperCase() : null,
            },
            otp // Raw OTP for dev console
        };
    }

    /**
     * Verifies the provided OTP code and performs actions based on the verification mode.
     * @param {Object} params - Parameters for verification.
     * @param {string} params.otp - The OTP code to verify.
     * @param {string} params.email - User's email.
     * @param {string} params.mode - The verification flow (e.g., NEW_SIGNUP, NEW_EMAIL_UPDATE).
     * @param {string} [params.userId] - User ID (required for email update).
     * @param {Object} [params.pendingUserData] - Data for creating a new user (for signup).
     * @returns {Promise<Object>} Object containing success status and redirect URL.
     * @throws {Error} If OTP record is missing, expired, or invalid.
     */
    async verifyOtpCode({ otp, email, mode, userId, pendingUserData }) {
        // 1. Fetch latest OTP
        const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });

        // 2. Validation
        if (!otpRecord) throw new Error("No OTP record found");
        if (otpRecord.expiresAt < Date.now()) throw new Error("OTP has expired");

        const isMatch = await bcrypt.compare(otp, otpRecord.otp);
        if (!isMatch) throw new Error("Invalid OTP code");

        // 3. Cleanup OTPs for this email
        await Otp.deleteMany({ email });

        // 4. Execute business logic based on mode
        let redirectUrl = "";

        if (mode === 'NEW_EMAIL_UPDATE') {
            await User.findByIdAndUpdate(userId, { email });
            redirectUrl = "/user/profile?emailChanged=true";
        }
        else if (mode === 'VERIFY_OLD_EMAIL') {
            redirectUrl = "/user/profile/change-email-form";
        }
        else { // Default: NEW_SIGNUP
            const newUserData = {
                ...pendingUserData,
                authProvider: "local",
                isEmailVerified: true
            };

            // Handle referral: link the new user to the referrer
            if (pendingUserData.referralCode) {
                const referrer = await User.findOne({ referralCode: pendingUserData.referralCode });
                if (referrer) {
                    newUserData.referredBy = referrer._id;
                    // Credit referral points from config (defaults to 10)
                    const refConfig = await ReferralConfig.getConfig();
                    if (refConfig.isActive && refConfig.pointsPerReferral > 0) {
                        referrer.referralPoints = (referrer.referralPoints || 0) + refConfig.pointsPerReferral;
                        await referrer.save();
                    }
                }
            }

            // Remove the referralCode from newUserData so it doesn't conflict
            delete newUserData.referralCode;

            await User.create(newUserData);
            redirectUrl = "/user/login?signupSuccess=true";
        }

        return { success: true, redirectUrl };
    }

    /**
     * Processes a request to resend an OTP, enforcing a 1-minute rate limit.
     * @param {string} email - User's email address.
     * @returns {Promise<string>} The raw OTP code.
     * @throws {Error} If the rate limit is exceeded.
     */
    async processResendOtp(email) {
        // 1. Business Rule: Check for 1-minute cooldown
        const existingOtp = await Otp.findOne({ email });

        if (existingOtp?.lastSentAt) {
            const diff = Date.now() - existingOtp.lastSentAt.getTime();
            if (diff < 60 * 1000) {
                // We throw a custom error to differentiate rate limiting from other errors
                const error = new Error("Please wait 1 minute before requesting another OTP");
                error.status = 429;
                throw error;
            }
        }

        // 2. Clear old OTPs
        await Otp.deleteMany({ email });

        // 3. Generate and Hash new OTP
        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, 10);

        // 4. Save new OTP
        await Otp.create({
            email,
            otp: hashedOtp,
            expiresAt: Date.now() + 5 * 60 * 1000,
            lastSentAt: new Date(),
        });

        // 5. Send Email
        await sendOtpEmail(email, otp);

        return otp; // Return raw OTP for dev logging
    }

    /**
     * Authenticates a user by email and password, ensuring account is not blocked.
     * @param {string} email - User's email.
     * @param {string} password - Plain-text password.
     * @returns {Promise<Object>} Sanitized user document data.
     * @throws {Error} If authentication fails or account is suspended.
     */
    async authenticateUser(email, password) {
        // 1. Fetch user with password
        const user = await User.findOne({ email }).select("+password");

        // 2. Check existence and provider
        if (!user || user.authProvider !== "local") {
            throw new Error("Invalid email or password");
        }

        // 3. Business Rule: The Ban Check
        if (user.isBlocked) {
            throw new Error("Your account has been suspended. Please contact support.");
        }

        // 4. Security: Password Match
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error("Invalid email or password");
        }

        // Return user data (without password) for the controller to use
        return {
            _id: user._id,
            fullName: user.fullName,
            email: user.email
        };
    }
}

module.exports = new AuthService();