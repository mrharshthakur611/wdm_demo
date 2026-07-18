const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const sendEmail = require("../utils/sendEmail");
const crypto = require("crypto");

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function validatePassword(password) {
  return typeof password === "string" && password.length >= 8;
}

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
    addresses: user.addresses,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function generateVerificationOtp(user) {
  // Generate a random 6-digit number string
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.verificationOtp = otp;
  user.verificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();
  return otp;
}

async function sendVerificationEmail(user, otp) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h1 style="color: #333; text-align: center;">Verify Your Email</h1>
      <p style="font-size: 16px; color: #555;">Hi ${user.name},</p>
      <p style="font-size: 16px; color: #555;">Thank you for registering! Your 6-digit email verification code is:</p>
      <div style="background-color: #f59e0b; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 24px 0; letter-spacing: 4px;">
        ${otp}
      </div>
      <p style="font-size: 14px; color: #777; text-align: center;">This code will expire in 10 minutes.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "Your Email Verification Code",
    html,
  });
}

function sendAuthResponse(res, statusCode, message, user) {
  res.status(statusCode).json({
    message,
    token: generateToken(user._id.toString()),
    user: sanitizeUser(user),
  });
}

async function registerUser(req, res) {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPhone = phone ? phone.trim() : "";

    if (trimmedName.length < 2) {
      res.status(400).json({ message: "Name must be at least 2 characters long" });
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ message: "Please provide a valid email address" });
      return;
    }

    if (!validatePassword(password)) {
      res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
      return;
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      phone: trimmedPhone,
      password,
    });

    // Generate verification OTP and fire email in the background
    // (don't await — respond to client immediately)
    generateVerificationOtp(user).then((otp) => {
      sendVerificationEmail(user, otp).catch((emailError) => {
        console.error("Failed to send verification email:", emailError);
      });
    }).catch((otpError) => {
      console.error("Failed to generate verification OTP:", otpError);
    });

    sendAuthResponse(res, 201, "User registered successfully. Please check your email to verify your account.", user);
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    if (error.name === "ValidationError") {
      const firstMessage = Object.values(error.errors || {})[0]?.message;
      res.status(400).json({ message: firstMessage || "Invalid input" });
      return;
    }

    if (error.name === "MongoServerError" && error.codeName === "Unauthorized") {
      res.status(500).json({ message: "Database authorization failed" });
      return;
    }

    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to register user",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      email: normalizedEmail,
      verificationOtp: otp,
      verificationOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.verificationOtp = undefined;
    user.verificationOtpExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully", token: generateToken(user._id.toString()), user: sanitizeUser(user) });
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to verify email",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

async function resendVerificationEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    const otp = await generateVerificationOtp(user);
    await sendVerificationEmail(user, otp);

    res.json({ message: "Verification code resent successfully" });
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to resend verification code",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      res.status(400).json({ message: "Please provide a valid email address" });
      return;
    }

    const user = await User.findOne({ email: normalizedEmail }).select("+password");

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    if (!user.isVerified) {
      res.status(403).json({ message: "Please verify your email to log in", unverified: true });
      return;
    }

    sendAuthResponse(res, 200, "Login successful", user);
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to login user",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

function getCurrentUser(req, res) {
  res.json({ user: sanitizeUser(req.user) });
}

async function updateCurrentUser(req, res) {
  try {
    const { name, email, phone, currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (typeof name === "string") {
      const trimmedName = name.trim();
      if (trimmedName.length < 2) {
        res.status(400).json({ message: "Name must be at least 2 characters long" });
        return;
      }
      user.name = trimmedName;
    }

    if (typeof email === "string") {
      const normalizedEmail = email.trim().toLowerCase();
      if (!isValidEmail(normalizedEmail)) {
        res.status(400).json({ message: "Please provide a valid email address" });
        return;
      }

      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          res.status(409).json({ message: "Email is already in use" });
          return;
        }
        user.email = normalizedEmail;
      }
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    const wantsPasswordChange = Boolean(currentPassword || newPassword);
    if (wantsPasswordChange) {
      if (!currentPassword || !newPassword) {
        res.status(400).json({ message: "Current password and new password are required" });
        return;
      }

      if (!validatePassword(newPassword)) {
        res.status(400).json({ message: "Password must be at least 8 characters long" });
        return;
      }

      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Current password is incorrect" });
        return;
      }

      user.password = newPassword;
    }

    await user.save();
    res.json({ message: "Account updated successfully", user: sanitizeUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      res.status(409).json({ message: "Email is already in use" });
      return;
    }

    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to update account",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

async function updateCurrentUserAddresses(req, res) {
  try {
    const { billing, shipping } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (billing === null) {
      user.addresses = user.addresses || {};
      user.addresses.billing = undefined;
    } else if (billing && typeof billing === "object") {
      user.addresses = user.addresses || {};
      user.addresses.billing = billing;
    }

    if (shipping === null) {
      user.addresses = user.addresses || {};
      user.addresses.shipping = undefined;
    } else if (shipping && typeof shipping === "object") {
      user.addresses = user.addresses || {};
      user.addresses.shipping = shipping;
    }

    await user.save();
    res.json({ message: "Addresses updated successfully", user: sanitizeUser(user) });
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to update addresses",
      ...(includeDetails ? { details: error.message } : {}),
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateCurrentUser,
  updateCurrentUserAddresses,
  verifyOtp,
  resendVerificationEmail,
};
