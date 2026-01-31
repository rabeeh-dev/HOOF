const User = require("../model/userModels");
const bcrypt = require("bcrypt");
const Otp = require("../model/otpModel");
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail, sendResetPasswordEmail } = require("../utils/sendEmail");
const crypto = require("crypto");
const Address = require("../model/addressModel");

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
  try {
    const { fullName, email, password, confirmPassword } = req.body;

    // Basic validation
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
        message: {
          type: "error",
          text: "Password must be at least 8 characters",
        },
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

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.render("User/auth/register", {
        layout: "layouts/user",
        message: { type: "error", text: "User already exists" },
        formData: { fullName, email },
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.deleteMany({ email });

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: new Date(),
    });

    await sendOtpEmail(email, otp);

    // Store in session
    req.session.pendingUser = {
      fullName,
      email,
      password: hashedPassword,
    };
    req.session.otpEmail = email;

    console.log("OTP (DEV):", otp);
    res.redirect("/user/verify-otp");
  } catch (err) {
    console.error("Signup error:", err);
    res.render("User/auth/register", {
      layout: "layouts/user",
      message: { type: "error", text: "Something went wrong. Try again." },
      formData: req.body,
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

    let email = isNew ? req.session.tempNewEmail : isOld ? req.session.currentEmailToVerify : req.session.pendingUser?.email;

    if (!email) {
      return res.status(400).json({ success: false, message: "Session expired" });
    }

    const otpRecord = await Otp.findOne({ email }).sort({ createdAt: -1 });
    
    if (!otpRecord || otpRecord.expiresAt < Date.now() || !(await bcrypt.compare(otp, otpRecord.otp))) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    await Otp.deleteMany({ email });
    let redirectUrl = "";

    if (isNew) {
      await User.findByIdAndUpdate(req.session.userId, { email: req.session.tempNewEmail });
      req.session.emailVerifiedForChange = req.session.newEmailOtpSent = req.session.tempNewEmail = null;
      redirectUrl = "/user/profile?emailChanged=true";
    } 
    else if (isOld) {
      req.session.emailVerifiedForChange = true;
      req.session.changeEmailFlow = null;
      redirectUrl = "/user/profile/change-email-form";
    } 
    else {
      const pendingUser = req.session.pendingUser;
      await User.create({ ...pendingUser, authProvider: "local", isEmailVerified: true });
      req.session.pendingUser = null;
      redirectUrl = "/user/login?signupSuccess=true";
    }

    // ✅ ALWAYS send JSON for AJAX requests
    return res.json({ success: true, redirectUrl });

  } catch (err) {
    console.error("Verification Error:", err);
    return res.status(500).json({ success: false, message: "Error during verification." });
  }
};

/* =========================
   RESEND OTP
========================= */
exports.resendOtp = async (req, res) => {
  try {
    const email = req.session.otpEmail;

    if (!email) {
      return res
        .status(400)
        .json({ message: "Session expired. Please signup again." });
    }

    const existingOtp = await Otp.findOne({ email });

    if (existingOtp?.lastSentAt) {
      const diff = Date.now() - existingOtp.lastSentAt.getTime();
      if (diff < 60 * 1000) {
        return res.status(429).json({
          message: "Please wait 1 minute before requesting another OTP",
        });
      }
    }

    await Otp.deleteMany({ email });

    const otp = generateOtp();
    const hashedOtp = await bcrypt.hash(otp, 10);

    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      lastSentAt: new Date(),
    });

    await sendOtpEmail(email, otp);

    console.log("RESEND OTP (DEV):", otp);

    res.json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

/* =========================
   LOGIN PAGE
========================= */
exports.loginPage = (req, res) => {
  // Check if user just arrived from a successful OTP verification
  const signupSuccess = req.query.signupSuccess === 'true';

  res.render("User/auth/login", {
    layout: "layouts/user",
    error: null,
    // Pass the success message if the flag is present
    successMessage: signupSuccess ? "Account created successfully! Please log in." : null,
  });
};

/* =========================
   LOGIN
========================= */
// controller/userController.js

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");

    // 1. Basic User/Provider Check
    if (!user || user.authProvider !== "local") {
      return res.render("User/auth/login", {
        layout: "layouts/user",
        error: "Invalid email or password",
      });
    }

    // 2. THE BAN CHECK
    if (user.isBlocked) {
      return res.render("User/auth/login", {
        layout: "layouts/user",
        error: "Your account has been suspended. Please contact support.",
      });
    }

    // 3. Password Check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("User/auth/login", {
        layout: "layouts/user",
        error: "Invalid email or password",
      });
    }

    // 4. Assigning session variables
    req.session.userId = user._id;
    req.session.userName = user.fullName;
    req.session.userEmail = user.email;

    req.session.save((err) => {
      if (err) return res.redirect("/user/login");
      res.redirect("/user/home");
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.render("User/auth/login", {
      layout: "layouts/user",
      error: "Something went wrong. Try again.",
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
    const user = await User.findOne({ email });

    if (user && user.authProvider === "local") {
      const resetToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
      await user.save();

      await sendResetPasswordEmail(email, resetToken);
    }

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

    if (password !== confirmPassword) {
      return res.send("Passwords do not match");
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.send("Invalid or expired token");

    // Update password
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save({ validateBeforeSave: false });

    // ✅ MODIFIED: Redirect to profile with a success flag
    res.redirect("/user/profile?passwordChanged=true");

  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).send("Internal Server Error");
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

// Handle AJAX Profile Update
exports.updateProfile = async (req, res) => {
  try {
    // console.log("Update Data received:", req.body);

    const { fullName, phoneNumber, dateOfBirth } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      req.session.userId,
      {
        fullName: fullName,
        phone: phoneNumber,
        dob: dateOfBirth
      },
      { new: true }
    );

    req.session.userName = updatedUser.fullName;
    res.json({ success: true, message: "Profile updated successfully!" });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
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

