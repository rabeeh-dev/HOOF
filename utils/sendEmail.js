const nodemailer = require("nodemailer");

/**
 * Create transporter ONCE
 * (best practice)
 */
const transporter = nodemailer.createTransport({
  host: process.env.MAILTRAP_HOST,
  port: process.env.MAILTRAP_PORT,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

/**
 * Send OTP Email
 */
exports.sendOtpEmail = async (toEmail, otp) => {
  const html = `
  <div style="margin:0;padding:0;background:#869897;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table width="520" cellpadding="0" cellspacing="0" style="
            background:rgba(255,255,255,0.95);
            border-radius:24px;
            box-shadow:0 30px 60px rgba(0,0,0,0.25);
            font-family:Poppins, Arial, sans-serif;
            overflow:hidden;
          ">
            <tr>
              <td align="center" style="
                padding:28px;
                background:linear-gradient(135deg,#869897,#8ea39e);
                color:#f5f8f7;
              ">
                <div style="
                  font-size:34px;
                  font-weight:700;
                  letter-spacing:0.18em;
                  color:rgb(181,5,5);
                ">
                  HOOF
                </div>
              </td>
            </tr>

            <tr>
              <td style="padding:32px;color:#0f1514;">
                <h2 style="margin:0 0 12px;">Verify your email</h2>
                <p style="margin:0 0 22px;">
                  Use the OTP below to complete your sign-in.
                </p>

                <div style="text-align:center;margin:34px 0;">
                  <span style="
                    display:inline-block;
                    padding:16px 34px;
                    font-size:30px;
                    font-weight:600;
                    letter-spacing:6px;
                    background:#f5f8f7;
                    border-radius:16px;
                    color:#0f1514;
                    border:2px solid #ff914d;
                  ">
                    ${otp}
                  </span>
                </div>

                <p style="font-size:13px;color:#555;">
                  OTP valid for 5 minutes. Do not share it.
                </p>
              </td>
            </tr>

            <tr>
              <td align="center" style="
                padding:20px;
                background:#6f8581;
                color:#f5f8f7;
                font-size:12px;
              ">
                © ${new Date().getFullYear()} HOOF
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
  `;

  await transporter.sendMail({
    from: '"HOOF" <no-reply@hoof.com>',
    to: toEmail,
    subject: "Verify your email – HOOF",
    html,
  });
};
