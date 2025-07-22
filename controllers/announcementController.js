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
