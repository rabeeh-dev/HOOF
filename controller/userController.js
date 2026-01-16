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

    const user = new User({
      fullName,
      email,
      password: hashedPassword,
      authProvider: "local",
    });

    await user.save();

    res.redirect("/user/login");
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
