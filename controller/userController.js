const User = require("../model/userModels");
const bcrypt = require("bcrypt");
const Otp = require("../model/otpModel");
const { generateOtp } = require("../utils/generateOtp");
const { sendOtpEmail } = require("../utils/sendEmail");

exports.signupPage = (req, res) => {
  res.render("User/auth/register", {
    title: "Register - ShoeStore",
    layout: "layouts/user",
  });
};

exports.signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).send("All fields are required");
    }

    if (password.length < 8) {
      return res.status(400).send("Password must be at least 8 characters");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }

    // 1️⃣ Generate OTP
    const otp = generateOtp();

    // 2️⃣ Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // 3️⃣ Save OTP in DB (expires in 5 minutes)
    await Otp.create({
      email,
      otp: hashedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      lastSentAt: new Date()
    });

    await sendOtpEmail(email, otp);

    // 4️⃣ Store signup data temporarily in session
    req.session.pendingUser = {
      fullName,
      email,
      password, // hashed later, not now
    };

    // TEMP: log OTP (for testing only)
    console.log("OTP (for testing):", otp);

    // 5️⃣ Redirect to OTP page
    req.session.otpEmail = email;
    res.redirect("/user/verify-otp");
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Server error");
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;

    // 1️⃣ Check session data
    if (!req.session.pendingUser) {
      return res.status(400).send("Session expired. Please signup again.");
    }

    const { fullName, email, password } = req.session.pendingUser;

    // 2️⃣ Find OTP record
    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return res.status(400).send("OTP not found or expired");
    }

    // 3️⃣ Check expiry
    if (otpRecord.expiresAt < Date.now()) {
      await Otp.deleteOne({ email });
      return res.status(400).send("OTP expired");
    }

    // 4️⃣ Compare OTP
    const isOtpValid = await bcrypt.compare(otp, otpRecord.otp);

    if (!isOtpValid) {
      return res.status(400).send("Invalid OTP");
    }

    // 5️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 6️⃣ Create user
    await User.create({
      fullName,
      email,
      password: hashedPassword,
      authProvider: "local",
      isEmailVerified: true,
    });

    // 7️⃣ Cleanup
    await Otp.deleteOne({ email });
    delete req.session.pendingUser;

    // 8️⃣ Redirect to login
    res.redirect("/user/login");
  } catch (err) {
    console.error("OTP verification error:", err);
    res.status(500).send("Server error");
  }
};

exports.resendOtp = async (req, res) => {
  try {
    const email = req.session.otpEmail;
    if (!email) {
      return res.status(400).json({ message: "Session expired" });
    }

    const existingOtp = await Otp.findOne({ email });

// ⏱ cooldown only if lastSentAt exists
if (existingOtp?.lastSentAt) {
  const diff = Date.now() - existingOtp.lastSentAt.getTime();
  if (diff < 60 * 1000) {
    return res.status(429).json({
      message: "Please wait before requesting another OTP"
    });
  }
}


    // Delete old OTP
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

    res.json({ message: "New OTP sent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    res.status(500).json({ message: "Failed to resend OTP" });
  }
};

exports.loginPage = (req, res) => {
  res.render("User/auth/login", {
    title: "Login - ShoeStore",
    layout: "layouts/user",
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).send("Email and password required");
    }

    // password is select:false, so explicitly select it
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).send("User not found");
    }

    if (user.authProvider !== "local") {
      return res.status(400).send("Please login using Google");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send("Invalid password");
    }

    //  LOGIN SUCCESS → CREATE SESSION
    req.session.userId = user._id;
    req.session.userName = user.fullName;
    req.session.userEmail = user.email;

    //  REDIRECT TO HOME
    res.redirect("/home");
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};
