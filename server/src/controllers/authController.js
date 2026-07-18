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

async function generateVerificationToken(user) {
  const token = crypto.randomBytes(32).toString("hex");
  user.verificationToken = crypto.createHash("sha256").update(token).digest("hex");
  user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();
  return token;
}

async function sendVerificationEmail(user, token) {
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>Verify Your Email</h1>
      <p>Hi ${user.name},</p>
      <p>Thank you for registering! Please click the button below to verify your email address:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 8px; margin: 16px 0;">Verify Email</a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "Verify Your Email Address",
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

    // Generate verification token and fire email in the background
    // (don't await — respond to client immediately)
    generateVerificationToken(user).then((token) => {
      sendVerificationEmail(user, token).catch((emailError) => {
        console.error("Failed to send verification email:", emailError);
      });
    }).catch((tokenError) => {
      console.error("Failed to generate verification token:", tokenError);
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

async function verifyEmail(req, res) {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ message: "Verification token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    res.json({ message: "Email verified successfully" });
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

    const token = await generateVerificationToken(user);
    await sendVerificationEmail(user, token);

    res.json({ message: "Verification email resent successfully" });
  } catch (error) {
    const includeDetails = process.env.NODE_ENV !== "production";
    res.status(500).json({
      message: "Failed to resend verification email",
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
  verifyEmail,
  resendVerificationEmail,
};
