import { Admin, config, User, PasswordReset } from "../model/userSchema1.js";
import { Event } from "../model/HubSchema.js";
import { sendPasswordChangeMail, sendVerificationMail } from "../middleware/emailSetup.js";
import bcrypt from "bcryptjs";
import session from "express-session";

export const createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000);
    const hashCode = await bcrypt.hash(code.toString(), 10);

    let exists = await Admin.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Email already exists. Try to login" });
    }

    exists = await User.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Email already exists. Try to login" });
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      verificationCode: hashCode,
      isVerified: false,
    });

    await newUser.save();
    await sendVerificationMail(email, code.toString());

    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ------------------- CREATE ADMIN -------------------
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password, adminPassword } = req.body;

    const adminPassDoc = await config.findOne({ key: "adminPassword" });
    if (!adminPassDoc) {
      return res.status(500).json({ message: "Admin password not set in DB" });
    }

    const isMatch = await bcrypt.compare(adminPassword, adminPassDoc.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect Admin Password" });
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      return res
        .status(400)
        .json({ message: "Email already exists. Try to login" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = Math.floor(100000 + Math.random() * 900000);
    const hashCode = await bcrypt.hash(code.toString(), 10);

    const newAdmin = new Admin({
      name,
      email,
      password: hashedPassword,
      verificationCode: hashCode,
      isVerified: false,
    });

    await newAdmin.save();
    await sendVerificationMail(email, code.toString());

    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ------------------- LOGIN (USER OR ADMIN) -------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    let account = await User.findOne({ email });
    let role = "user";

    if (!account) {
      account = await Admin.findOne({ email });
      role = "admin";
    }

    if (!account) {
      return res.status(404).json({ message: "Invalid email" });
    }

    if (!account.isVerified) {
      return res
        .status(401)
        .json({ message: "Please verify your email first" });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    req.session.userId = account.email;
    req.session.role = role;

    res.status(200).json({
      message: "Login successful",
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ------------------- VERIFY (USER OR ADMIN) -------------------
export const veryfayUser = async (req, res) => {
  try {
    const { code, email } = req.body;

    let account = await User.findOne({ email });
    let role = "user";

    if (!account) {
      account = await Admin.findOne({ email });
      role = "admin";
    }

    if (!account) {
      return res.status(404).json({ message: "Time limit exceeded" });
    }

    const isMatch = await bcrypt.compare(code, account.verificationCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid verification code" });
    }

    account.isVerified = true;
    account.verificationCode = undefined;
    account.expireAt = undefined;
    await account.save();

    req.session.userId = account.email;
    req.session.role = role;

    res.status(200).json({
      message: `${role} verified and logged in successfully`,
      user: { id: account._id, email: account.email, name: account.name, role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ------------------- RESEND VERIFICATION CODE -------------------

export const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    let account = await Admin.findOne({ email });
    let role = "admin";

    if (!account) {
      account = await User.findOne({ email });
      role = "user";
    }

    if (!account) {
      return res.status(404).json({ message: "Time limit exceeded" });
    }

    if (account.isVerified) {
      return res.status(400).json({ message: "Account already verified" });
    }

    // Generate new verification code
    const code = Math.floor(100000 + Math.random() * 900000);
    const hashCode = await bcrypt.hash(code.toString(), 10);

    // Update account with new code & expiry
    account.verificationCode = hashCode;
    account.expireAt = new Date(Date.now() + 10 * 60 * 1000);
    await account.save();

    // Send using your custom mail function
    await sendVerificationMail(email, code.toString());

    res.status(200).json({
      message: `Verification code resent successfully to ${role}`,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ------------------- GET USERS -------------------

export const getUsers = async (req, res) => {
  try {
    let account;

    if (req.session.role === "admin") {
      account = await Admin.findOne({ email: req.session.userId }).select(
        "-password -__v"
      );
    } else {
      account = await User.findOne({ email: req.session.userId }).select(
        "-password -__v"
      );
    }

    if (!account) {
      return res.status(404).json({ message: "User not found" });
    }

    // Populate RegistrEvents with full event details
    let populatedEvents = [];
    if (account.RegistrEvents && account.RegistrEvents.length > 0) {
      populatedEvents = await Event.find({
        Ename: { $in: account.RegistrEvents },
      });
    }

    res.status(200).json({
      ...account.toObject(),
      RegistrEvents: populatedEvents,
      role: req.session.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};


// ------------------- PASSWORD CHANGE REQUEST -------------------
export const requestPasswordChange = async (req, res) => {
  try {
    const { email } = req.body;

    let account = await Admin.findOne({ email });
    let role = "admin";

    if (!account) {
      account = await User.findOne({ email });
      role = "user";
    }

    if (!account) {
      return res.status(404).json({ message: "Email not found" });
    }

    const exist = await PasswordReset.findOne({ email });
    if (exist) {
      await PasswordReset.deleteOne({ email });
    }
    const code = Math.floor(100000 + Math.random() * 900000);
    const hashedCode = await bcrypt.hash(code.toString(), 10);

    const ChangePassword = new PasswordReset({
      email,
      resetCode: hashedCode,
      role,
    });
    await ChangePassword.save();
    const mailResult = await sendPasswordChangeMail(email, code.toString());
    if (!mailResult.success) {
      return res.status(500).json({ message: "Failed to send email", error: mailResult.error });

    }

    res.status(200).json({
      message: `Password reset code sent to ${role}'s email. It will expire in 10 minutes.`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};
// ------------------- PASSWORD RESET SESSION CREATE -------------------

export const createPasswordResetSession = async (req, res) => {
  try {
    const { email, code } = req.body;
    const resetRequest = await PasswordReset.findOne({ email });
    if (!resetRequest) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    const isMatch = await bcrypt.compare(code, resetRequest.resetCode);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid or expired reset code" });
    }
    req.session.userId = email;
    req.session.role = resetRequest.role;

    req.session.passwordReset = {
      resetEmail: email,
      expires: Date.now() + 2 * 60 * 1000,
    };
    res.status(200).json({ message: "Reset session created. You can now change your password." });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
    console.log(err);
  }
};

// ------------------- PASSWORD CHANGE (USER OR ADMIN) -------------------  
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const email = req.session.passwordReset?.resetEmail;
    console.log(email);
    if (!email) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    let account = await Admin.findOne({ email });

    if (!account) {
      account = await User.findOne({ email });
    }
    if (!account) {
      return res.status(404).json({ message: "Account not found" });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    account.password = hashedPassword;
    account.expireAt = undefined;
    await account.save();
    delete req.session.passwordReset;
    await PasswordReset.deleteOne({ email });
    res.status(200).json({ message: `Password changed successfully complited` });
  } catch (err) {
    res.status(500).json({ message: "Server Error", error: err.message });
  }
};

// ------------------- LOGOUT -------------------
export const logoutUser = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: "Could not log out, please try again" });
    }
    res.clearCookie("connect.sid");
    return res.status(200).json({ message: "Logout successful" });
  });
};