import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

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
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sunil’s IT Desk – Verification" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Your Verification Code",
      html,
    });

    console.log("Verification mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message, err.response || "");
    return { success: false, error: err.message };
  }
};

// ✅ Send Password Change Code
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
        <p style="font-size:13px; color:#777; text-align:center; margin-top:20px;">
          For your security, never share this code with anyone.
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sunil’s IT Desk – Security" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Password Reset Code",
      html,
    });

    console.log("Password reset mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message, err.response || "");
    return { success: false, error: err.message };
  }
};

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
};


export const sendEventAnnouncementMail = async (to, userName, eventName, aiContent) => {
  try {
    const greeting = getGreeting();

    const html = `
  <div style="
    font-family: Arial, Helvetica, sans-serif;
    padding: 24px;
    max-width: 600px;
    margin: auto;
    background: #ffffff;
    border-radius: 10px;
    border: 1px solid #eaeaea;
  ">

    <!-- Header -->
    <h2 style="
      color: #3F51B5;
      text-align: center;
      margin-bottom: 8px;
    ">
      🎉 ${eventName}
    </h2>

    <!-- Greeting -->
    <p style="
      font-size: 16px;
      color: #333;
      margin-top: 20px;
    ">
      ${greeting}, <b>${userName}</b> 👋
    </p>

    <!-- Main Content -->
    <div style="
      font-size: 15px;
      color: #444;
      line-height: 1.7;
      margin-top: 15px;
    ">
      ${aiContent}
    </div>

    <!-- Divider -->
    <hr style="
      margin: 30px 0;
      border: none;
      border-top: 1px solid #ddd;
    " />

    <!-- Footer -->
    <p style="
      font-size: 13px;
      color: #777;
      text-align: center;
      margin-bottom: 6px;
    ">
      You’re receiving this email because you’re connected with
      <b>Sunil’s IT Desk</b>.
    </p>

    <p style="
      font-size: 12px;
      color: #999;
      text-align: center;
    ">
      © ${new Date().getFullYear()} Sunil’s IT Desk. All rights reserved.
    </p>
  </div>
`;


    const info = await transporter.sendMail({
      from: `"Sunil’s IT Desk – Events" <${process.env.EMAIL_USER}>`,
      to,
      subject: `${eventName} | Official Announcement`,
      html,
    });

    console.log("Event announcement mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message, err.response || "");
    return { success: false, error: err.message };
  }
};

// sendEventAnnouncementMail('sunilpradhan042006@gmail.com', 'New Workshop on Web Development', '<p>We are excited to announce a new workshop on modern web development techniques. Join us to enhance your skills!</p>');

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
        <p style="font-size:14px; color:#555; text-align:center;">
          Or copy this link: <br>
          <a href="${eventLink}" style="color:#007bff;">${eventLink}</a>
        </p>
        <p style="font-size:14px; color:#777; text-align:center; margin-top:30px;">
          See you there! <br>
          <b>Sunil’s IT Desk</b>
        </p>
      </div>
    `;

    const info = await transporter.sendMail({
      from: `"Sunil’s IT Desk – Events" <${process.env.EMAIL_USER}>`,
      to,
      subject: `New Event: ${eventName}`,
      html,
    });

    console.log("New event mail sent:", info.messageId);
    return { success: true };
  } catch (err) {
    console.error("Mail error:", err.message, err.response || "");
    return { success: false, error: err.message };
  }
};