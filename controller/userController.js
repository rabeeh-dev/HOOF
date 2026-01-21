const User = require("../model/userModels");
const bcrypt = require("bcrypt");
const Otp = require("../model/otpModel");
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail, sendResetPasswordEmail } = require("../utils/sendEmail");
const crypto = require("crypto");

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
    const pendingUser = req.session.pendingUser;

    if (!pendingUser) {
      return res.redirect("/user/signup");
    }

    const otpRecord = await Otp.findOne({ email: pendingUser.email }).sort({
      createdAt: -1,
    });

    if (!otpRecord || otpRecord.expiresAt < Date.now()) {
      return res.render("User/auth/verify-otp", {
        layout: "layouts/user",
        message: { type: "error", text: "OTP expired" },
      });
    }

    const isValid = await bcrypt.compare(otp, otpRecord.otp);
    if (!isValid) {
      return res.render("User/auth/verify-otp", {
        layout: "layouts/user",
        message: { type: "error", text: "Invalid OTP" },
      });
    }

    await User.create({
      fullName: pendingUser.fullName,
      email: pendingUser.email,
      password: pendingUser.password,
      authProvider: "local",
      isEmailVerified: true,
    });

    await Otp.deleteMany({ email: pendingUser.email });
    req.session.pendingUser = null;
    req.session.otpEmail = null;

    res.redirect("/user/login");
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.render("User/auth/verify-otp", {
      layout: "layouts/user",
      message: { type: "error", text: "Verification failed" },
    });
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
  res.render("User/auth/login", {
    layout: "layouts/user",
    error: null,
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

    if (!user || user.authProvider !== "local") {
      return res.render("User/auth/login", {
        layout: "layouts/user",
        error: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.render("User/auth/login", {
        layout: "layouts/user",
        error: "Invalid email or password",
      });
    }

    // Assigning session variables
    req.session.userId = user._id;
    req.session.userName = user.fullName; // Maps to fullName in your Model
    req.session.userEmail = user.email;

    // Save to MongoStore then redirect
    req.session.save((err) => {
      if (err) return res.redirect("/user/login");
      res.redirect("/user/home");
    });

  } catch (err) {
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

  user.password = await bcrypt.hash(password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save({ validateBeforeSave: false });

  res.redirect("/user/login");
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
// 1. Show the Profile Page
// Render Profile Page
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId);
        res.render('User/user-profile', {
            user,
            title: 'My Profile | HOOF',
            layout: 'layouts/user' 
        });
    } catch (err) {
        res.redirect('/user/home');
    }
};

// Handle AJAX Profile Update
exports.updateProfile = async (req, res) => {
    try {
        // Log req.body to see exactly what the frontend is sending
        console.log("Update Data received:", req.body);

        const { fullName, phoneNumber, dateOfBirth } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.session.userId,
            { 
                fullName: fullName,
                phone: phoneNumber,
                dob: dateOfBirth // Make sure this variable name matches the 'name' attribute in EJS
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


