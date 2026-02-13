/**
 * @file utils/sendEmail.js
 * @description Utility module for sending emails using Nodemailer and Gmail SMTP.
 */

const nodemailer = require("nodemailer");

// ==========================================
// CREATE TRANSPORTER (GMAIL SMTP)
// ==========================================

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify mail transporter connection on startup
transporter.verify((error) => {
  if (error) {
    console.error("❌ Mail transporter error:", error);
  } else {
    console.log("✅ Mail transporter is ready");
  }
});

// ==========================================
// SEND OTP EMAIL
// ==========================================

/**
 * Sends a verification OTP email to a user.
 * @param {string} email - Destination email address.
 * @param {string} otp - The 6-digit OTP code to include in the email.
 * @returns {Promise<void>}
 */
const sendOtpEmail = async (email, otp) => {
  try {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify Your Email - HOOF</title>
</head>
<body style="margin: 0; padding: 0; background-color: #869897; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#869897;">
    <tr>
      <td style="padding:40px 20px;">
        <table width="600" align="center" style="background:#ffffff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
          
          <tr>
            <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#869897,#8ea39e);border-radius:16px 16px 0 0;">
              <h1 style="margin:0;font-size:42px;letter-spacing:0.15em;color:#b50505;">HOOF</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;text-align:center;">
              <h2 style="color:#0f1514;">Verify Your Email</h2>
              <p style="color:#555;font-size:16px;">
                Thank you for signing up with HOOF!  
                Use the code below to verify your email address.
              </p>

              <div style="margin:30px 0;display:inline-block;
                          background:linear-gradient(135deg,#ff914d,#e26820);
                          padding:25px 50px;border-radius:12px;">
                <p style="margin:0;font-size:40px;letter-spacing:0.3em;color:#fff;font-weight:700;">
                  ${otp}
                </p>
              </div>

              <p style="font-size:14px;color:#666;">
                <strong>This code will expire in 5 minutes.</strong><br>
                Do not share this code with anyone.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;text-align:center;background:#6f8581;border-radius:0 0 16px 16px;">
              <p style="margin:0;font-size:12px;color:#f5f8f7;">
                © ${new Date().getFullYear()} HOOF Sneaker House
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"HOOF" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Verify your HOOF account",
      html,
    });

    console.log("✅ OTP email sent to:", email);
  } catch (error) {
    console.error("❌ Send OTP email error:", error);
    throw error;
  }
};

// ==========================================
// SEND RESET PASSWORD EMAIL
// ==========================================

/**
 * Sends a password reset link to a user.
 * @param {string} email - Destination email address.
 * @param {string} resetToken - The unique password reset token.
 * @returns {Promise<void>}
 */
const sendResetPasswordEmail = async (email, resetToken) => {
  try {
    const resetUrl = `${process.env.BASE_URL}/user/reset-password/${resetToken}`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Reset Your Password - HOOF</title>
</head>
<body style="margin:0;padding:0;background-color:#869897;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#869897;padding:40px 20px;">
    <tr>
      <td>
        <table width="600" align="center" style="background:#fff;border-radius:16px;box-shadow:0 10px 40px rgba(0,0,0,0.2);">
          
          <tr>
            <td style="padding:40px;text-align:center;background:linear-gradient(135deg,#869897,#8ea39e);">
              <h1 style="margin:0;font-size:42px;letter-spacing:0.15em;color:#b50505;">HOOF</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:40px;text-align:center;">
              <h2 style="color:#0f1514;">Reset Your Password</h2>
              <p style="color:#555;font-size:16px;">
                You requested to reset your HOOF account password.<br>
                Click the button below to continue.
              </p>

              <a href="${resetUrl}"
                 style="display:inline-block;margin:30px 0;padding:16px 36px;
                        background:linear-gradient(135deg,#ff914d,#e26820);
                        color:#fff;text-decoration:none;border-radius:30px;
                        font-weight:600;">
                Reset Password
              </a>

              <p style="font-size:14px;color:#666;">
                This link will expire in <strong>15 minutes</strong>.<br>
                If you didn’t request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:30px;text-align:center;background:#6f8581;">
              <p style="margin:0;font-weight:600;letter-spacing:0.15em;color:#b50505;">HOOF</p>
              <p style="margin:10px 0 0;font-size:12px;color:#f5f8f7;">
                © ${new Date().getFullYear()} HOOF Sneaker House
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    await transporter.sendMail({
      from: `"HOOF" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Reset your HOOF password",
      html,
    });

    console.log("✅ Reset password email sent to:", email);
  } catch (error) {
    console.error("❌ Reset password email error:", error);
    throw error;
  }
};

// ==========================================
// EXPORTS
// ==========================================

module.exports = {
  sendOtpEmail,
  sendResetPasswordEmail,
};
