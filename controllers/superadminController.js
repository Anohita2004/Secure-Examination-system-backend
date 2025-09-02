// controllers/superadminController.js
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../models/db');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
// Twilio setup

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);


// Step 1: Request password reset
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (rows.length === 0) 
      return res.status(404).json({ success: false, message: "User not found" });

    const user = rows[0];
    if (!user.phone_number) 
      return res.status(400).json({ success: false, message: "Phone number not set for this account" });

    const resetToken = crypto.randomBytes(32).toString("hex");
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await db.query(
      "UPDATE users SET reset_token=?, reset_token_expires=?, otp_code=?, otp_expires=? WHERE id=?",
      [resetToken, expires, otp, expires, user.id]
    );

    // Send reset link via email
    const resetLink = `http://localhost:8080/#/reset-password/${resetToken}`;
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: "Password Reset Request",
        html: `<p>Click the link to reset password:</p><a href="${resetLink}">${resetLink}</a>`
      });
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
      return res.status(500).json({ success: false, message: "Failed to send reset email" });
    }

    // Send OTP via SMS
    try {
      await twilioClient.messages.create({
        body: `Your OTP is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phone_number // Make sure this is in E.164 format e.g. +919876543210
      });
    } catch (smsErr) {
      console.error("SMS send error:", smsErr);
      return res.status(500).json({ success: false, message: "Failed to send OTP SMS" });
    }

    res.json({ success: true, message: "Reset link sent to email & OTP sent to mobile" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Step 2: Verify OTP
exports.verifyOtp = async (req, res) => {
  const { token, otp } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token=? AND reset_token_expires > NOW()",
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ message: "Invalid or expired token" });

    const user = rows[0];
    if (user.otp_code !== otp || new Date(user.otp_expires) < new Date()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    res.json({ message: "OTP verified. You can now reset your password." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Step 3: Reset password
exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE reset_token=? AND reset_token_expires > NOW()",
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ message: "Invalid or expired token" });

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      "UPDATE users SET password=?, reset_token=NULL, reset_token_expires=NULL, otp_code=NULL, otp_expires=NULL WHERE id=?",
      [hashedPassword, rows[0].id]
    );

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
