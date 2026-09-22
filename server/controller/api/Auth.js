/**
 * @file controller/api/Auth.js
 * @description API Controller for User authentication, registration, OTP, and password recovery.
 * Resolves actions in JSON responses suitable for the React frontend.
 */

const authService = require("../../services/Auth");
const passwordService = require("../../services/Password");
const User = require("../../model/User");
const crypto = require("crypto");

/**
 * @desc    Get current authenticated user session details.
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ success: false, message: "Unauthenticated" });
        }

        const user = await User.findById(req.session.userId).select("fullName email isBlocked");
        if (!user) {
            req.session.destroy();
            return res.status(401).json({ success: false, message: "User not found" });
        }

        if (user.isBlocked) {
            req.session.destroy();
            return res.status(403).json({ success: false, message: "Account is suspended" });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: "user"
            }
        });
    } catch (err) {
        console.error("API getMe error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * @desc    Authenticate user credentials and establish session.
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Email and password are required" });
        }

        const user = await authService.authenticateUser(email, password);

        // Populate session
        req.session.userId = user._id;
        req.session.userName = user.fullName;
        req.session.userEmail = user.email;

        req.session.save((err) => {
            if (err) {
                console.error("API Login Session Save Error:", err);
                return res.status(500).json({ success: false, message: "Session creation failed" });
            }
            return res.status(200).json({
                success: true,
                message: "Login successful",
                user: {
                    id: user._id,
                    name: user.fullName,
                    email: user.email,
                    role: "user"
                }
            });
        });
    } catch (err) {
        console.error("API Login Error:", err);
        return res.status(401).json({ success: false, message: err.message || "Invalid credentials" });
    }
};

/**
 * @desc    Trigger signup process (creates pending user in session & sends OTP).
 * @route   POST /api/auth/signup
 * @access  Public
 */
exports.signup = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword, referralCode } = req.body;

        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        const result = await authService.initiateSignup(fullName, email, password, referralCode || null);

        req.session.pendingUser = result.pendingUser;
        req.session.otpEmail = email;

        console.log("OTP (DEV API):", result.otp);

        return res.status(200).json({
            success: true,
            message: "OTP sent successfully to email",
            email
        });
    } catch (err) {
        console.error("API Signup error:", err);
        return res.status(400).json({ success: false, message: err.message || "Signup failed" });
    }
};

/**
 * @desc    Verify OTP code and complete signup or profile update.
 * @route   POST /api/auth/verify-otp
 * @access  Public / Session-based
 */
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        if (!otp) {
            return res.status(400).json({ success: false, message: "OTP code is required" });
        }

        const isOld = !!req.session.changeEmailFlow;
        const isNew = !!req.session.newEmailOtpSent;

        let mode = "NEW_SIGNUP";
        let email = req.session.pendingUser?.email;

        if (isNew) {
            mode = "NEW_EMAIL_UPDATE";
            email = req.session.tempNewEmail;
        } else if (isOld) {
            mode = "VERIFY_OLD_EMAIL";
            email = req.session.currentEmailToVerify;
        }

        if (!email) {
            return res.status(400).json({ success: false, message: "Session expired or email invalid" });
        }

        const result = await authService.verifyOtpCode({
            otp,
            email,
            mode,
            userId: req.session.userId,
            pendingUserData: req.session.pendingUser
        });

        // Clean session
        if (mode === "NEW_EMAIL_UPDATE") {
            req.session.emailVerifiedForChange = req.session.newEmailOtpSent = req.session.tempNewEmail = null;
        } else if (mode === "VERIFY_OLD_EMAIL") {
            req.session.emailVerifiedForChange = true;
            req.session.changeEmailFlow = null;
        } else {
            req.session.pendingUser = null;
            req.session.otpEmail = null;

            if (result.newUser) {
                req.session.userId = result.newUser._id;
                req.session.userName = result.newUser.fullName;
                req.session.userEmail = result.newUser.email;
            }
        }

        return res.status(200).json({
            success: true,
            message: "OTP verified successfully",
            user: result.newUser ? {
                id: result.newUser._id,
                name: result.newUser.fullName,
                email: result.newUser.email,
                role: "user"
            } : null
        });
    } catch (err) {
        console.error("API OTP verification error:", err);
        return res.status(400).json({ success: false, message: err.message || "OTP verification failed" });
    }
};

/**
 * @desc    Resend OTP to the pending user email.
 * @route   POST /api/auth/resend-otp
 * @access  Public / Session-based
 */
exports.resendOtp = async (req, res) => {
    try {
        const email = req.session.otpEmail;
        if (!email) {
            return res.status(400).json({ success: false, message: "Session expired. Please signup again." });
        }

        const otp = await authService.processResendOtp(email);
        console.log("RESEND OTP (DEV API):", otp);

        return res.status(200).json({ success: true, message: "OTP resent successfully" });
    } catch (err) {
        console.error("API Resend OTP error:", err);
        const status = err.status || 500;
        return res.status(status).json({ success: false, message: err.message || "Failed to resend OTP" });
    }
};

/**
 * @desc    Trigger forgot password email recovery.
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        await passwordService.initiatePasswordReset(email, true);

        // Generic response for security purposes
        return res.status(200).json({
            success: true,
            message: "If an account exists, a recovery link has been sent to your email."
        });
    } catch (err) {
        console.error("API Forgot password error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

/**
 * @desc    Complete password reset via token link.
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        if (!password || !confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ success: false, message: "Passwords do not match" });
        }

        await passwordService.resetPassword(token, password);

        return res.status(200).json({
            success: true,
            message: "Password reset successful! You can now log in."
        });
    } catch (err) {
        console.error("API Reset Password Error:", err);
        return res.status(400).json({ success: false, message: err.message || "Invalid or expired reset link" });
    }
};

/**
 * @desc    Logout customer and clear session cookies.
 * @route   POST /api/auth/logout
 * @access  Private
 */
exports.logout = (req, res) => {
    req.session.userId = null;
    req.session.userName = null;

    req.session.destroy((err) => {
        if (err) {
            console.error("API Logout Error:", err);
            return res.status(500).json({ success: false, message: "Logout failed" });
        }
        res.clearCookie("hoof.user.sid", { path: "/" });
        return res.status(200).json({ success: true, message: "Logout successful" });
    });
};
