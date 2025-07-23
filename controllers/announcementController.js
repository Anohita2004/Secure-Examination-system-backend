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
// Get unread count
exports.getUnreadCount = async (req, res) => {
  const employeeId = req.params.employeeId;

  try {
    const [rows] = await db.query(`
      SELECT COUNT(*) AS unreadCount
      FROM Announcements a
      WHERE NOT EXISTS (
        SELECT 1 FROM Announcement_Reads ar
        WHERE ar.announcement_id = a.id AND ar.employee_id = ?
      )
    `, [employeeId]);

    res.json({ unreadCount: rows[0].unreadCount });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Mark an announcement as read
exports.markAsRead = async (req, res) => {
  const { employeeId, announcementId } = req.body;

  try {
    await db.query(`
      INSERT IGNORE INTO Announcement_Reads (announcement_id, employee_id)
      VALUES (?, ?)
    `, [announcementId, employeeId]);

    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("Error marking announcement as read:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
