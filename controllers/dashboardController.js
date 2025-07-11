// controllers/dashboardController.js
const db = require('../models/db');

exports.getDashboardStats = async (req, res) => {
  try {
    console.log("Dashboard stats route hit");
    const [[{ examCount }]] = await db.query('SELECT COUNT(*) as examCount FROM exams');
    const [[{ questionCount }]] = await db.query('SELECT COUNT(*) as questionCount FROM questions');
    const [[{ assignedCount }]] = await db.query('SELECT COUNT(*) as assignedCount FROM exam_assignments');
    const [[{ pendingCount }]] = await db.query('SELECT COUNT(*) as pendingCount FROM exam_assignments WHERE attempted = 0');

   console.log("examResult:", examCount);
    console.log("questionResult:", questionCount);
    console.log("assignedResult:", assignedCount);
    console.log("pendingResult:", pendingCount);
   
   
    res.json({
      examCount,
      questionCount,
      assignedCount,
      pendingCount
    });
  } catch (err) {
    console.error("Dashboard stats error:", err); 
    res.status(500).json({ error: err.message });
    
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};
// At the top, require your db connection if needed


exports.getDashboardTable = async (req, res) => {
  try {
    // Example SQL, adjust table/column names as needed
    const query = `
      SELECT 
        u.name, u.email, u.role,
        e.title,
        CASE WHEN ea.attempted = 1 THEN 'Yes' ELSE 'No' END as attempted
      FROM users u
      LEFT JOIN exam_assignments ea ON u.id = ea.user_id
      LEFT JOIN exams e ON ea.exam_id = e.id
      ORDER BY u.name, e.title
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
