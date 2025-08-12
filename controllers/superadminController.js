const db = require("../models/db");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: "Email is required." });
  }

  try {
    // ✅ 1. Check if the email exists in DB
    const [rows] = await db.query("SELECT id, email FROM users WHERE email = ?", [email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: "No user found with this email." });
    }

    const user = rows[0];

    // ✅ 2. Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetURL = `http://localhost:4000/api/superadmin/reset-password/${resetToken}`;

    // ✅ 3. Save token in DB (expires in 1 hour)
    const expires = new Date(Date.now() + 3600000);
    await db.query(
      "UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?",
      [resetToken, expires, user.id]
    );

    // ✅ 4. Configure Nodemailer
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // Gmail ID
        pass: process.env.EMAIL_PASS  // Gmail App Password
      }
    });

    // ✅ 5. Send the email
    await transporter.sendMail({
      from: `"Secure Exam System" <${process.env.EMAIL_USER}>`,
      to: user.email, // Make sure this is valid!
      subject: "Password Reset Request",
      html: `
        <p>Hello,</p>
        <p>You requested to reset your password. Click below to set a new one:</p>
        <a href="${resetURL}">${resetURL}</a>
        <p>This link will expire in 1 hour.</p>
      `
    });

    return res.json({ success: true, message: "Password reset link sent to your email." });

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
};
