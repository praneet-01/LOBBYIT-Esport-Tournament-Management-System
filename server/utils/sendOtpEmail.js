const nodemailer = require('nodemailer');

const sendOtpEmail = async ({ email, otp, purpose = 'register' }) => {
  console.log(`\n==============================================`);
  console.log(`🔑 [LOBBYIT OTP DISPATCH]`);
  console.log(`📧 Target Email: ${email}`);
  console.log(`⚡ Purpose: ${purpose.toUpperCase()}`);
  console.log(`🔐 Verification Code: ${otp}`);
  console.log(`⏰ Valid for: 10 minutes`);
  console.log(`==============================================\n`);

  // Check if SMTP credentials exist in environment
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = process.env.SMTP_PORT || 587;

  if (!smtpUser || !smtpPass) {
    // Development mode fallback: console logged above
    return { success: true, mode: 'console', otp };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort == 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const htmlContent = `
      <div style="background-color: #08090D; color: #F1F5F9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background-color: #10141E; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px 24px;">
          <h1 style="color: #FFFFFF; font-size: 26px; font-weight: 900; margin-bottom: 8px; letter-spacing: 2px;">
            LOBBY<span style="color: #E6002B;">IT</span>
          </h1>
          <p style="color: #00D8FF; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0;">
            Verification Code
          </p>
          <div style="margin: 28px 0; padding: 20px; background-color: #07080D; border: 1px solid rgba(230,0,43,0.3); border-radius: 12px;">
            <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #E6002B; font-family: monospace;">
              ${otp}
            </span>
          </div>
          <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 16px 0;">
            Enter this 6-digit code to verify your identity on LOBBYIT. This code is active for <strong>10 minutes</strong>.
          </p>
          <p style="color: #64748B; font-size: 11px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
            If you did not request this verification, you can safely ignore this email.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"LOBBYIT Esports" <${smtpUser}>`,
      to: email,
      subject: `Your LOBBYIT Verification Code: ${otp}`,
      html: htmlContent
    });

    return { success: true, mode: 'smtp', otp };
  } catch (err) {
    console.error('⚠️ [SMTP SEND ERROR]:', err.message);
    // Even if SMTP network fails, return the OTP so the user is never blocked in testing
    return { success: true, mode: 'console_fallback', otp };
  }
};

module.exports = sendOtpEmail;
