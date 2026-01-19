// routes/testMail.js
const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");

router.get("/test-mail", async (req, res) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 587,
      auth: {
        user: process.env.MAILTRAP_USER,
        pass: process.env.MAILTRAP_PASS,
      },
    });

    await transporter.sendMail({
      from: '"HOOF Test" <test@hoof.local>',
      to: "user@test.com",
      subject: "Mailtrap Test",
      text: "If you see this, Mailtrap works!",
    });

    res.send("Test email sent");
  } catch (err) {
    console.error(err);
    res.status(500).send("Mail failed");
  }
});

module.exports = router;
