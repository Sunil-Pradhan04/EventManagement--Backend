import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const PORTFOLIO_LINK = "https://sunil-pradhan04.github.io/My-Portfolio/";
const SENDER_NAME = "Sunil AI & Tech";
const SENDER_EMAIL = process.env.EMAIL_USER;

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ---------------- SHARED TEMPLATE PARTS ---------------- */
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};

const getFooter = () => `
  <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
  <p style="font-size: 13px; color: #777; text-align: center; margin-bottom: 6px;">
    You’re receiving this email because you’re connected with <b>${SENDER_NAME}</b>.
  </p>
  <p style="font-size: 13px; color: #777; text-align: center; margin-bottom: 6px;">
    Check out my portfolio: <a href="${PORTFOLIO_LINK}" style="color: #007bff; text-decoration: none;"><b>My Portfolio</b></a>
  </p>
  <p style="font-size: 12px; color: #999; text-align: center;">
    © ${new Date().getFullYear()} ${SENDER_NAME}. All rights reserved.
  </p>
`;

/* ---------------- EMAIL FUNCTIONS ---------------- */

// ✅ Send Email Verification Code
export const sendVerificationMail = async (to, code) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; background:#fafafa;">
        <h2 style="color:#4CAF50; text-align:center;">🔐 Email Verification</h2>
        <p style="font-size:16px; color:#333;">
          Hello, <br><br>
          Please use the following verification code to complete your registration:
        </p>
        <div style="margin:20px auto; padding:15px; max-width:200px; background:#4CAF50; color:white; font-size:24px; font-weight:bold; text-align:center; border-radius:6px;">
          ${code}
        </div>
        <p style="font-size:14px; color:#555; text-align:center;">
          This code will expire in <b>10 minutes</b>. If you didn’t request this, please ignore this email.
        </p>
        ${getFooter()}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME} – Verification" <${SENDER_EMAIL}>`,
      to,
      subject: "Your Verification Code",
      html,
    });

    console.log("Verification mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message);
    return { success: false, error: err.message };
  }
};

export const sendPasswordChangeMail = async (to, code) => {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; background:#fafafa;">
        <h2 style="color:#FF9800; text-align:center;">🔑 Password Reset Request</h2>
        <p style="font-size:16px; color:#333;">
          Hello, <br><br>
          We received a request to reset your account password. Please use the code below to continue:
        </p>
        <div style="margin:20px auto; padding:15px; max-width:200px; background:#FF9800; color:white; font-size:24px; font-weight:bold; text-align:center; border-radius:6px;">
          ${code}
        </div>
        <p style="font-size:14px; color:#555; text-align:center;">
          This code will expire in <b>10 minutes</b>. If you didn’t request a password reset, you can safely ignore this email.
        </p>
        ${getFooter()}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME} – Security" <${SENDER_EMAIL}>`,
      to,
      subject: "Password Reset Code",
      html,
    });

    console.log("Password reset mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message);
    return { success: false, error: err.message };
  }
};

export const sendEventAnnouncementMail = async (to, userName, eventName, aiContent) => {
  try {
    const greeting = getGreeting();

    const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; padding: 24px; max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; border: 1px solid #eaeaea;">
    <h2 style="color: #3F51B5; text-align: center; margin-bottom: 8px;">
      🎉 ${eventName}
    </h2>
    <p style="font-size: 16px; color: #333; margin-top: 20px;">
      ${greeting}, <b>${userName}</b> 👋
    </p>
    <div style="font-size: 15px; color: #444; line-height: 1.7; margin-top: 15px;">
      ${aiContent}
    </div>
    ${getFooter()}
  </div>
`;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME} – Events" <${SENDER_EMAIL}>`,
      to,
      subject: `${eventName} | Official Announcement`,
      html,
    });

    console.log("Announcement mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message);
    return { success: false, error: err.message };
  }
};

export const sendNewEventMail = async (to, eventName, eventLink) => {
  try {
    const greeting = getGreeting();

    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; background:#fafafa;">
        <h2 style="color:#007bff; text-align:center;">🚀 New Event Alert!</h2>
        <p style="font-size:16px; color:#333;">
          ${greeting}, <br><br>
          We are thrilled to announce a new event: <b>${eventName}</b>! 🌟
        </p>
        <p style="font-size:15px; color:#555;">
          Don't miss out on this opportunity. Check out the details and register now!
        </p>
        <div style="margin:25px auto; text-align:center;">
          <a href="${eventLink}" style="background:#007bff; color:white; text-decoration:none; padding:12px 24px; font-size:16px; font-weight:bold; border-radius:6px; display:inline-block;">
            View Event & Register
          </a>
        </div>
        ${getFooter()}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME} – Events" <${SENDER_EMAIL}>`,
      to,
      subject: `New Event: ${eventName}`,
      html,
    });

    console.log("New event mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message);
    return { success: false, error: err.message };
  }
};

// ✅ Send Registration Success Mail (Thank You)
export const sendEventRegistrationSuccessMail = async (to, userName, eventName) => {
  try {
    const greeting = getGreeting();

    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; background:#fafafa;">
        <h2 style="color:#28a745; text-align:center;">✅ Registration Confirmed!</h2>
        <p style="font-size:16px; color:#333;">
          ${greeting}, <b>${userName}</b>! <br><br>
          Thank you for registering for <b>${eventName}</b>. We are excited to have you join us!
        </p>
        <p style="font-size:15px; color:#555;">
          Stay tuned for further updates. If you have any questions, feel free to reach out.
        </p>
        ${getFooter()}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME} – Events" <${SENDER_EMAIL}>`,
      to,
      subject: `Registration Confirmed: ${eventName}`,
      html,
    });

    console.log("Registration success mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message);
    return { success: false, error: err.message };
  }
};

// ✅ Send Welcome Mail (After Verification)
export const sendWelcomeMail = async (to, userName) => {
  try {
    const greeting = getGreeting();

    const html = `
      <div style="font-family: Arial, sans-serif; padding:20px; max-width:600px; margin:auto; border:1px solid #eee; border-radius:8px; background:#fafafa;">
        <h2 style="color:#673AB7; text-align:center;">🚀 Welcome Aboard!</h2>
        <p style="font-size:16px; color:#333;">
          ${greeting}, <b>${userName}</b>! <br><br>
          Congratulations! Your account has been successfully verified. We are thrilled to welcome you to the <b>${SENDER_NAME}</b> community.
        </p>
        <p style="font-size:15px; color:#555;">
          Explore events, connect with others, and stay updated with the latest in tech.
        </p>
        <div style="margin:25px auto; text-align:center;">
          <a href="${PORTFOLIO_LINK}" style="background:#673AB7; color:white; text-decoration:none; padding:12px 24px; font-size:16px; font-weight:bold; border-radius:6px; display:inline-block;">
            Visit My Portfolio
          </a>
        </div>
        ${getFooter()}
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"${SENDER_NAME} – Welcome" <${SENDER_EMAIL}>`,
      to,
      subject: `Welcome to ${SENDER_NAME}! 🚀`,
      html,
    });

    console.log("Welcome mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message);
    return { success: false, error: err.message };
  }
};