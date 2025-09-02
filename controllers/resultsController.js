const db = require("../models/db"); // adjust path to your db connection

exports.getUserResults = async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM results WHERE user_id = ? ORDER BY evaluated_at DESC",
      [userId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Error fetching results:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
