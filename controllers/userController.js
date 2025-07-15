const db = require('../models/db');
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
};