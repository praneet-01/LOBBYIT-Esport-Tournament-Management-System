const nodemailer = require('nodemailer');

const sendOtpEmail = async ({ email, otp, purpose = 'register' }) => {
  const resendKey = (
    process.env.RESEND_email_API_KEY ||
    process.env.RESEND_EMAIL_API_KEY ||
    process.env.RESEND_API_KEY ||
    process.env.RESEND_KEY ||
    Object.entries(process.env).find(([k]) => k.toLowerCase().includes('resend'))?.[1]
  )?.trim().replace(/^["']|["']$/g, '');

  const smtpUser = (
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    process.env.EMAIL_USERNAME ||
    process.env.GMAIL_USER ||
    process.env.MAIL_USER ||
    process.env.EMAIL
  )?.trim().replace(/^["']|["']$/g, '');

  const smtpPass = (
    process.env.EMAIL_PASS ||
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASSWORD ||
    process.env.GMAIL_PASS ||
    process.env.GMAIL_PASSWORD ||
    process.env.MAIL_PASS ||
    process.env.MAIL_PASSWORD
  )?.trim().replace(/^["']|["']$/g, '');

  const smtpHost = process.env.SMTP_HOST?.trim().replace(/^["']|["']$/g, '');
  const smtpPort = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 465;

  const htmlContent = `
    <div style="background-color: #08090D; color: #F1F5F9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; text-align: center;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #10141E; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px 24px;">
        <h1 style="color: #FFFFFF; font-size: 26px; font-weight: 900; margin-bottom: 8px; letter-spacing: 2px;">
          LOBBY<span style="color: #E6002B;">IT</span>
        </h1>
        <p style="color: #00D8FF; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-top: 0;">
          ${purpose === 'login' ? 'Login Verification Code' : 'Email Verification Code'}
        </p>
        <div style="margin: 28px 0; padding: 20px; background-color: #07080D; border: 1px solid rgba(230,0,43,0.3); border-radius: 12px;">
          <span style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #E6002B; font-family: monospace;">
            ${otp}
          </span>
        </div>
        <p style="color: #94A3B8; font-size: 13px; line-height: 1.6; margin: 16px 0;">
          Enter this 6-digit verification code to verify your identity on LOBBYIT. This code is active for <strong>10 minutes</strong>.
        </p>
        <p style="color: #64748B; font-size: 11px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); padding-top: 16px;">
          If you did not request this verification, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  // 1. PRIMARY FOR CLOUD (Render/Vercel): Resend HTTPS REST API (Port 443 - Never blocked by Render firewall)
  if (resendKey) {
    try {
      const fromAddress = process.env.RESEND_FROM || 'LOBBYIT Esports <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [email],
          subject: `[LOBBYIT] Your Verification Code is ${otp}`,
          html: htmlContent
        })
      });

      const data = await res.json();
      if (res.ok && data?.id) {
        console.log(`✅ [RESEND HTTPS SENT]: Verification code ${otp} delivered to ${email} (ID: ${data.id})`);
        return { success: true, mode: 'resend', messageId: data.id };
      } else {
        console.error('❌ [RESEND API ERROR]:', data);
        const errMsg = data?.message || 'Resend email delivery failed';
        return { success: false, mode: 'error', message: errMsg };
      }
    } catch (resendErr) {
      console.error('❌ [RESEND NETWORK ERROR]:', resendErr.message);
      return { success: false, mode: 'error', message: resendErr.message };
    }
  }

  // 2. FALLBACK: Direct SMTP (Works on local machine or servers with open SMTP ports)
  if (!smtpUser || !smtpPass) {
    console.error('❌ [EMAIL ERROR]: No RESEND_API_KEY or EMAIL_USER/EMAIL_PASS configured. Cannot send email.');
    return {
      success: false,
      mode: 'unconfigured',
      message: 'Email service is not configured yet. Please add RESEND_API_KEY in Render.'
    };
  }

  try {
    const isCustomPort = Boolean(process.env.SMTP_PORT);
    const targetPort = isCustomPort ? Number(process.env.SMTP_PORT) : 465;
    const isSecure = targetPort === 465;

    const transportOptions = {
      host: smtpHost || 'smtp.gmail.com',
      port: targetPort,
      secure: isSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass
      },
      connectionTimeout: 8000,
      greetingTimeout: 6000,
      socketTimeout: 10000,
      tls: {
        rejectUnauthorized: false
      }
    };

    const transporter = nodemailer.createTransport(transportOptions);

    const info = await transporter.sendMail({
      from: `"LOBBYIT Esports" <${smtpUser}>`,
      to: email,
      subject: `[LOBBYIT] Your Verification Code is ${otp}`,
      html: htmlContent
    });

    console.log(`✅ [SMTP SENT]: Verification code ${otp} successfully delivered to ${email} (MessageId: ${info.messageId})`);
    return { success: true, mode: 'sent', messageId: info.messageId };
  } catch (err) {
    console.error('❌ [SMTP SEND ERROR]:', err.message);
    return { success: false, mode: 'error', message: err.message };
  }
};

module.exports = sendOtpEmail;
