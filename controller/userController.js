const User = require("../model/User");
const bcrypt = require("bcrypt");
const Otp = require("../model/Otp");
const path = require('path');
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail, sendResetPasswordEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const Address = require("../model/Address");
const authService = require("../services/authService");
const passwordService = require("../services/passwordService");
const userService = require("../services/userService");

/* =============================================================================
   AUTHENTICATION SECTION (Signup, Login, OTP)
============================================================================= */

/**
 * @route   GET /user/signup
 * @desc    Renders the registration page
 * @access  Public
 */
exports.signupPage = (req, res) => {
  res.render("User/auth/register", {
    layout: "layouts/user",
    message: null,
    formData: {},
  });
};

/**
 * @route   POST /user/signup
 * @desc    Handles user registration and initiates OTP verification
 * @access  Public
 */
exports.signup = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  try {
    if (!fullName || !email || !password || !confirmPassword) {
      return res.render("User/auth/register", {
        layout: "layouts/user",
        message: { type: "error", text: "All fields are required" },
        formData: { fullName, email },
      });
    }

    if (password.length < 8) {
      return res.render("User/auth/register", {
        layout: "layouts/user",
        message: { type: "error", text: "Password must be at least 8 characters" },
        formData: { fullName, email },
      });
    }

    if (password !== confirmPassword) {
      return res.render("User/auth/register", {
        layout: "layouts/user",
        message: { type: "error", text: "Passwords do not match" },
        formData: { fullName, email },
      });
    }

    const result = await authService.initiateSignup(fullName, email, password);

    req.session.pendingUser = result.pendingUser;
    req.session.otpEmail = email;

    console.log("OTP (DEV):", result.otp);
    res.redirect("/user/verify-otp");

  } catch (err) {
    console.error("Signup error:", err);
    res.render("User/auth/register", {
      layout: "layouts/user",
      message: { type: "error", text: err.message || "Something went wrong. Try again." },
      formData: { fullName, email },
    });
  }
};

/**
 * @route   POST /user/verify-otp
 * @desc    Verifies the OTP code for signup or email changes
 * @access  Public / Session-based
 */
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const isOld = !!req.session.changeEmailFlow;
        const isNew = !!req.session.newEmailOtpSent;

        let mode = 'NEW_SIGNUP';
        let email = req.session.pendingUser?.email;

        if (isNew) {
            mode = 'NEW_EMAIL_UPDATE';
            email = req.session.tempNewEmail;
        } else if (isOld) {
            mode = 'VERIFY_OLD_EMAIL';
            email = req.session.currentEmailToVerify;
        }

        if (!email) {
            return res.status(400).json({ success: false, message: "Session expired" });
        }

        const result = await authService.verifyOtpCode({
            otp,
            email,
            mode,
            userId: req.session.userId,
            pendingUserData: req.session.pendingUser
        });

        if (mode === 'NEW_EMAIL_UPDATE') {
            req.session.emailVerifiedForChange = req.session.newEmailOtpSent = req.session.tempNewEmail = null;
        } else if (mode === 'VERIFY_OLD_EMAIL') {
            req.session.emailVerifiedForChange = true;
            req.session.changeEmailFlow = null;
        } else {
            req.session.pendingUser = null;
        }

        return res.json({ success: true, redirectUrl: result.redirectUrl });

    } catch (err) {
        console.error("Verification Error:", err);
        return res.status(400).json({ success: false, message: err.message || "Error during verification." });
    }
};

/**
 * @route   POST /user/resend-otp
 * @desc    Resends the OTP code with a 1-minute cooldown enforcement
 * @access  Public / Session-based
 */
exports.resendOtp = async (req, res) => {
    try {
        const email = req.session.otpEmail;

        if (!email) {
            return res.status(400).json({ 
                message: "Session expired. Please signup again." 
            });
        }

        const otp = await authService.processResendOtp(email);
        console.log("RESEND OTP (DEV):", otp);

        return res.json({ message: "OTP resent successfully" });

    } catch (err) {
        console.error("Resend OTP error:", err);
        const status = err.status || 500;
        const message = err.message || "Failed to resend OTP";
        return res.status(status).json({ message });
    }
};

/**
 * @route   GET /user/login
 * @desc    Renders the login page with optional success messages
 * @access  Public
 */
exports.loginPage = (req, res) => {
  const signupSuccess = req.query.signupSuccess === 'true';
  const resetSuccess = req.query.resetSuccess === 'true';

    let successMessage = null;
    if (signupSuccess) {
        successMessage = "Account created successfully! Please log in.";
    } else if (resetSuccess) {
        successMessage = "Password reset successful!, Log in Now";
    }

  res.render("User/auth/login", {
    layout: "layouts/user",
    error: null,
    successMessage: successMessage,
  });
};

/**
 * @route   POST /user/login
 * @desc    Authenticates user and starts a session
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await authService.authenticateUser(email, password);

        req.session.userId = user._id;
        req.session.userName = user.fullName;
        req.session.userEmail = user.email;

        req.session.save((err) => {
            if (err) {
                console.error("Session Save Error:", err);
                return res.redirect("/user/login");
            }
            res.redirect("/user/home");
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.render("User/auth/login", {
            layout: "layouts/user",
            error: err.message || "Something went wrong. Try again.",
        });
    }
};

/**
 * @route   POST /user/logout
 * @desc    Destroys user session and clears cookies
 * @access  Private
 */
exports.logout = (req, res) => {
  req.session.userId = null;
  req.session.userName = null;

  req.session.destroy((err) => {
    if (err) {
      console.log("Logout Error:", err);
      return res.redirect("/user/home");
    }
    res.clearCookie("connect.sid", { path: '/' });
    res.redirect("/user/login");
  });
};

/* =============================================================================
   PASSWORD RECOVERY SECTION
============================================================================= */

/**
 * @route   GET /user/forgot-password
 * @desc    Renders the forgot password email request page
 * @access  Public
 */
exports.forgotPasswordPage = (req, res) => {
  res.render("User/auth/forgot-password", {
    layout: "layouts/user",
    message: null,
  });
};

/**
 * @route   POST /user/forgot-password
 * @desc    Generates reset token and sends email
 * @access  Public
 */
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        await passwordService.initiatePasswordReset(email);

        res.render("User/auth/forgot-password", {
            layout: "layouts/user",
            message: "If an account exists, a reset link has been sent.",
        });

    } catch (err) {
        console.error("Forgot password error:", err);
        res.render("User/auth/forgot-password", {
            layout: "layouts/user",
            message: "Something went wrong. Please try again.",
        });
    }
};

/**
 * @route   GET /user/reset-password/:token
 * @desc    Renders password reset form if token is valid
 * @access  Public
 */
exports.resetPasswordPage = async (req, res) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    return res.send("Invalid or expired reset link");
  }

  res.render("User/auth/reset-password", {
    layout: "layouts/user",
    token: req.params.token,
  });
};

/**
 * @route   POST /user/reset-password/:token
 * @desc    Updates the password in the database
 * @access  Public
 */
exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        if (password !== confirmPassword) {
            return res.render("User/auth/reset-password", {
                token,
                error: "Passwords do not match"
            });
        }

        await passwordService.resetPassword(token, password);
        res.redirect("/user/login?resetSuccess=true");

    } catch (err) {
        console.error("Reset Password Error:", err);
        res.status(400).send(err.message || "Internal Server Error");
    }
};

/* =============================================================================
   USER PROFILE SECTION (Details & Settings)
============================================================================= */

/**
 * @route   GET /user/profile
 * @desc    Fetch and display user profile, addresses, and success flags
 * @access  Private
 */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/user/login');

    const user = await User.findById(userId);
    const addresses = await Address.find({ userId: userId });

    const emailChanged = req.query.emailChanged === 'true';
    const passwordChanged = req.query.passwordChanged === 'true';

    let successMessage = null;
    if (emailChanged) {
      successMessage = "Your email has been updated successfully!";
    } else if (passwordChanged) {
      successMessage = "Your password has been changed successfully!";
    }

    res.render('User/user-profile', {
      user,
      addresses,
      title: 'My Profile | HOOF',
      layout: 'layouts/user',
      successMessage: successMessage 
    });
  } catch (err) {
    console.error("Profile Error:", err);
    res.redirect('/user/home');
  }
};

/**
 * @route   POST /user/profile/update
 * @desc    Update text-based profile details (AJAX)
 * @access  Private
 */
exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, dateOfBirth } = req.body;

    const updatedUser = await userService.updateProfileData(req.session.userId, {
        fullName,
        phoneNumber,
        dateOfBirth
    });

    req.session.userName = updatedUser.fullName;

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * @route   POST /user/profile/update-image
 * @desc    Upload, crop, and save a new profile image
 * @access  Private
 */
exports.updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const userId = req.session.userId;
        const publicRoot = path.join(__dirname, '../public');

        const newImagePath = await userService.updateUserProfileImage(
            userId, 
            req.file.filename, 
            publicRoot
        );

        if (req.session.user) {
            req.session.user.profileImage = newImagePath;
        }

        req.session.save((err) => {
            if (err) throw err;
            res.json({ 
                success: true, 
                message: "Profile picture updated!", 
                imagePath: newImagePath 
            });
        });

    } catch (error) {
        console.error("Profile Image Upload Error:", error);
        res.status(500).json({ 
            success: false, 
            message: error.message || "Server error during upload" 
        });
    }
};

/**
 * @route   DELETE /user/profile/delete-image
 * @desc    Removes profile picture from server and database
 * @access  Private
 */
exports.deleteProfileImage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const publicRoot = path.join(__dirname, '../public');

        await userService.removeUserProfileImage(userId, publicRoot);

        if (req.session.user) {
            req.session.user.profileImage = "";
        }

        return res.json({ success: true, message: "Profile image deleted" });

    } catch (error) {
        console.error("Delete Image Error:", error);
        const statusCode = error.message === "No image found to delete" ? 400 : 500;
        return res.status(statusCode).json({ 
            success: false, 
            message: error.message || "Server error" 
        });
    }
};

/* =============================================================================
   EMAIL & PASSWORD CHANGE FLOW
============================================================================= */

/**
 * @route   GET /user/profile/change-email-start
 * @desc    Sends verification OTP to current email to authorize change
 * @access  Private
 */
exports.getChangeEmailOtp = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({ email: user.email });
    await Otp.create({ email: user.email, otp: hashedOtp, expiresAt: Date.now() + 300000 });
    await sendOtpEmail(user.email, otp);

    console.log("OLD EMAIL OTP (DEBUG):", otp);

    req.session.changeEmailFlow = true;
    req.session.currentEmailToVerify = user.email;

    res.render("User/auth/verify-otp", { layout: "layouts/user", email: user.email, message: null });
  } catch (err) { res.redirect('/user/profile'); }
};

/**
 * @route   POST /user/profile/change-email-new-otp
 * @desc    Sends verification OTP to the NEW email address
 * @access  Private
 */
exports.sendNewEmailOtp = async (req, res) => {
  try {
    if (!req.session.emailVerifiedForChange) return res.redirect('/user/profile');
    const { newEmail } = req.body;

    const exists = await User.findOne({ email: newEmail });
    if (exists) return res.render('User/change-email', { layout: 'layouts/user', message: { type: 'error', text: 'Email already registered.' } });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({ email: newEmail });
    await Otp.create({ email: newEmail, otp: hashedOtp, expiresAt: Date.now() + 300000 });
    await sendOtpEmail(newEmail, otp);

    console.log("NEW EMAIL OTP (DEBUG):", otp);

    req.session.tempNewEmail = newEmail;
    req.session.newEmailOtpSent = true;

    res.render("User/auth/verify-otp", { layout: "layouts/user", email: newEmail, message: null });
  } catch (err) { res.redirect('/user/profile'); }
};

/**
 * @route   GET /user/profile/change-password-request
 * @desc    Initiates password change via reset link sent to email
 * @access  Private
 */
exports.changePasswordRequest = async (req, res) => {
  try {
    const user = await User.findById(req.session.userId);

    if (!user || user.authProvider !== "local") {
      return res.redirect('/user/profile');
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; 
    await user.save();

    await sendResetPasswordEmail(user.email, resetToken);

    res.redirect('/user/profile?message=reset_link_sent');

  } catch (err) {
    console.error("Change password request error:", err);
    res.redirect('/user/profile');
  }
};