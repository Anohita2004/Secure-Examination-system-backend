/*const db = require('../models/db');
const bcrypt = require('bcrypt');

exports.changePassword = async (req, res) => {
  const { user_id, old_password, new_password } = req.body;
  if (!user_id || !old_password || !new_password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    // 1. Get user by id
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];

    // Defensive check
    if (!user.password_hash) {
      return res.status(400).json({ error: "User does not have a password set." });
    }

    // 2. Compare old password
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    // 3. Hash new password
    const hashed = await bcrypt.hash(new_password, 10);

    // 4. Update password
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, user_id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: "Internal server error" });
  }
};*/
const crypto = require('crypto');
const db = require('../models/db');
const bcrypt = require('bcrypt');
const { sendResetEmail } = require('../utils/mailer'); // Uncomment and implement if you have a mailer

exports.changePassword = async (req, res) => {
  const { user_id, old_password, new_password } = req.body;
  if (!user_id || !old_password || !new_password) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    // 1. Get user by id
    const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [user_id]);
    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user = users[0];

    // Defensive check
    if (!user.password_hash) {
      return res.status(400).json({ error: "User does not have a password set." });
    }

    // 2. Compare old password
    const match = await bcrypt.compare(old_password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Old password is incorrect" });
    }

    // 3. Hash new password
    const hashed = await bcrypt.hash(new_password, 10);

    // 4. Update password
    await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, user_id]);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.requestPasswordReset = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  const [users] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
  if (users.length === 0) return res.status(404).json({ error: "User not found" });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600 * 1000); // 1 hour from now

  await db.query('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email]);

  // Send email with link (implement sendResetEmail in your mailer)
  const resetLink = `http://localhost:8080/reset-password?token=${token}`;
  await sendResetEmail(email, resetLink);

  res.json({ message: "Password reset link sent to your email." });
};

exports.resetPassword = async (req, res) => {
  const { token, new_password } = req.body;
  if (!token || !new_password) return res.status(400).json({ error: "Missing fields" });

  const [users] = await db.query(
    'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW()',
    [token]
  );
  if (users.length === 0) return res.status(400).json({ error: "Invalid or expired token" });

  const hashed = await bcrypt.hash(new_password, 10);
  await db.query(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
    [hashed, users[0].id]
  );

  res.json({ message: "Password has been reset successfully." });
};
// Get exam results for a user
/*exports.getUserResults = async (req, res) => {
  const userId = req.params.userId;
  try {
    // Adjust the query to match your DB schema and table names
    const [results] = await db.query(
      `SELECT 
         r.id,
         r.exam_id,
         e.title AS examTitle,
         r.total_score,
         r.passed,
         r.evaluated_at
       FROM results r
       JOIN exams e ON r.exam_id = e.id
       WHERE r.user_id = ?
       ORDER BY r.evaluated_at DESC`,
      [userId]
    );
    res.json(results);
  } catch (err) {
    console.error('Error fetching user results:', err);
    res.status(500).json({ error: "Internal server error" });
  }
};*/
exports.getUserResults = async (req, res) => {
  const userId = req.params.id;
  try {
    const [rows] = await db.query(
      `SELECT e.id AS exam_id, e.title, r.score, r.total, r.submitted_at
       FROM exam_results r
       JOIN exams e ON e.id = r.exam_id
       WHERE r.user_id = ?
       ORDER BY r.submitted_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};