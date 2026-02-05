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

/* =========================
   SIGNUP PAGE
========================= */
exports.signupPage = (req, res) => {
  res.render("User/auth/register", {
    layout: "layouts/user",
    message: null,
    formData: {},
  });
};

/* =========================
   SIGNUP WITH OTP
========================= */
exports.signup = async (req, res) => {
  const { fullName, email, password, confirmPassword } = req.body;

  try {
    // 1. Basic Validation (Presentation logic stays in controller)
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

    // 2. Call the Service Layer for the "Heavy Lifting"
    const result = await authService.initiateSignup(fullName, email, password);

    // 3. Handle Session & Navigation
    req.session.pendingUser = result.pendingUser;
    req.session.otpEmail = email;

    console.log("OTP (DEV):", result.otp);
    res.redirect("/user/verify-otp");

  } catch (err) {
    // 4. Catch errors thrown by the service (like "User already exists")
    console.error("Signup error:", err);
    res.render("User/auth/register", {
      layout: "layouts/user",
      message: { type: "error", text: err.message || "Something went wrong. Try again." },
      formData: { fullName, email },
    });
  }
};

/* =========================
   VERIFY OTP
========================= */
exports.verifyOtp = async (req, res) => {
    try {
        const { otp } = req.body;
        const isOld = !!req.session.changeEmailFlow;
        const isNew = !!req.session.newEmailOtpSent;

        // 1. Determine Mode and Target Email
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

        // 2. Delegate to Service
        const result = await authService.verifyOtpCode({
            otp,
            email,
            mode,
            userId: req.session.userId,
            pendingUserData: req.session.pendingUser
        });

        // 3. Post-verification session cleanup (Controller responsibility)
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
        // We catch the "Error" thrown by service and send its message
        return res.status(400).json({ success: false, message: err.message || "Error during verification." });
    }
};

/* =========================
   RESEND OTP
========================= */
exports.resendOtp = async (req, res) => {
    try {
        const email = req.session.otpEmail;

        if (!email) {
            return res.status(400).json({ 
                message: "Session expired. Please signup again." 
            });
        }

        // Delegate the work to the service
        const otp = await authService.processResendOtp(email);

        console.log("RESEND OTP (DEV):", otp);

        return res.json({ message: "OTP resent successfully" });

    } catch (err) {
        console.error("Resend OTP error:", err);
        
        // Handle the 429 Rate Limit error specifically
        const status = err.status || 500;
        const message = err.message || "Failed to resend OTP";
        
        return res.status(status).json({ message });
    }
};

/* =========================
   LOGIN PAGE
========================= */
exports.loginPage = (req, res) => {
  // Check if user just arrived from a successful OTP verification
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
    // Pass the success message if the flag is present
    successMessage: successMessage,
  });
};

/* =========================
   LOGIN
========================= */

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Call Service for Authentication
        const user = await authService.authenticateUser(email, password);

        // 2. Controller handles the Session (This is a web-specific task)
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
        // 3. Catch errors from Service (Invalid credentials or Banned status)
        console.error("Login Error:", err);
        res.render("User/auth/login", {
            layout: "layouts/user",
            error: err.message || "Something went wrong. Try again.",
        });
    }
};

/* =========================
   FORGOT PASSWORD
========================= */
exports.forgotPasswordPage = (req, res) => {
  res.render("User/auth/forgot-password", {
    layout: "layouts/user",
    message: null,
  });
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        // Call the service to handle tokens, hashing, and emailing
        await passwordService.initiatePasswordReset(email);

        // Controller only manages the response to the user
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

/* =========================
   RESET PASSWORD
========================= */
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

exports.resetPassword = async (req, res) => {
    try {
        const { password, confirmPassword } = req.body;
        const { token } = req.params;

        // 1. Basic UI Validation (Controller's job)
        if (password !== confirmPassword) {
            return res.render("User/auth/reset-password", {
                token,
                error: "Passwords do not match"
            });
        }

        // 2. Call Service to handle the logic
        await passwordService.resetPassword(token, password);

        // 3. Redirect to Login with a success flag
        res.redirect("/user/login?resetSuccess=true");

    } catch (err) {
        console.error("Reset Password Error:", err);
        // Handle specific error from service (like expired token)
        res.status(400).send(err.message || "Internal Server Error");
    }
};

/* =========================
   LOGOUT
========================= */
exports.logout = (req, res) => {
  // 1. Clear variables from session object
  req.session.userId = null;
  req.session.userName = null;

  // 2. Destroy the session in MongoDB
  req.session.destroy((err) => {
    if (err) {
      console.log("Logout Error:", err);
      return res.redirect("/user/home");
    }
    // 3. Clear the cookie from the browser
    res.clearCookie("connect.sid", { path: '/' });

    // 4. Redirect to login
    res.redirect("/user/login");
  });
};

/* =========================
   GET USER PROFILE 
========================= */
exports.getProfile = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) return res.redirect('/user/login');

    const user = await User.findById(userId);
    const addresses = await Address.find({ userId: userId });

    // Check flags in the URL
    const emailChanged = req.query.emailChanged === 'true';
    const passwordChanged = req.query.passwordChanged === 'true';

    // Determine which message to show
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
      successMessage: successMessage // Passes the specific message to EJS
    });
  } catch (err) {
    console.error("Profile Error:", err);
    res.redirect('/user/home');
  }
};


// Update profile function

exports.updateProfile = async (req, res) => {
  try {
    const { fullName, phoneNumber, dateOfBirth } = req.body;

    // Use the Service Layer
    const updatedUser = await userService.updateProfileData(req.session.userId, {
        fullName,
        phoneNumber,
        dateOfBirth
    });

    // Update Session
    req.session.userName = updatedUser.fullName;

    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Part 1: Sends OTP to the OLD email
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

// Part 2: Sends OTP to the NEW email
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

/* =========================
   CHANGE PASSWORD REQUEST
========================= */
exports.changePasswordRequest = async (req, res) => {
  try {
    // 1. Find the logged-in user
    const user = await User.findById(req.session.userId);

    if (!user || user.authProvider !== "local") {
      return res.redirect('/user/profile');
    }

    // 2. Generate Reset Token (Same logic as forgotPassword)
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // 3. Save to User Document
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 mins
    await user.save();

    // 4. Send the Email
    await sendResetPasswordEmail(user.email, resetToken);

    // 5. Redirect back to profile with a success message
    res.redirect('/user/profile?message=reset_link_sent');

  } catch (err) {
    console.error("Change password request error:", err);
    res.redirect('/user/profile');
  }
};

//Profile Picture Updating Logic 
exports.updateProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }

        const userId = req.session.userId;
        // We define the root of our public folder here
        const publicRoot = path.join(__dirname, '../public');

        // 1. Call Service
        const newImagePath = await userService.updateUserProfileImage(
            userId, 
            req.file.filename, 
            publicRoot
        );

        // 2. Sync Session
        if (req.session.user) {
            req.session.user.profileImage = newImagePath;
        }

        // 3. Save Session & Respond
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

exports.deleteProfileImage = async (req, res) => {
    try {
        const userId = req.session.userId;
        const publicRoot = path.join(__dirname, '../public');

        // 1. Delegate to Service
        await userService.removeUserProfileImage(userId, publicRoot);

        // 2. Sync Session
        if (req.session.user) {
            req.session.user.profileImage = "";
        }

        // 3. Response
        return res.json({ success: true, message: "Profile image deleted" });

    } catch (error) {
        console.error("Delete Image Error:", error);
        
        // Handle the "No image found" error as a 400, others as 500
        const statusCode = error.message === "No image found to delete" ? 400 : 500;
        return res.status(statusCode).json({ 
            success: false, 
            message: error.message || "Server error" 
        });
    }
};