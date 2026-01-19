const User = require("../model/userModels");
const bcrypt = require("bcrypt");


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

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      fullName,
      email,
      password: hashedPassword,
      authProvider: 'local',
      isEmailVerified: true // for now
    });

    // ✅ after signup → go to login
    res.redirect('/user/login');

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).send("Server error");
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
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(400).send("User not found");
    }

    if (user.authProvider !== 'local') {
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
    res.redirect('/home');

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};

