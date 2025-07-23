const db = require('../models/db');

exports.getAllAnnouncements = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM Announcements ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
// ✅ Add this function if it's not there already
exports.createAnnouncement = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: "Title and message are required" });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO Announcements (title, message, created_at) VALUES (?, ?, NOW())',
      [title, message]
    );

    res.status(201).json({ message: "Announcement created", id: result.insertId });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
