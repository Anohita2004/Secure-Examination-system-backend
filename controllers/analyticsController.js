const db = require('../models/db');

// Exam summary: attempts, avg score, pass/fail count per exam
exports.examSummary = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        e.id, 
        e.title,
        COUNT(r.id) AS attempts,
        IFNULL(AVG(r.total_score), 0) AS avg_score,
        SUM(r.passed = 1) AS pass_count,
        SUM(r.passed = 0) AS fail_count
      FROM exams e
      LEFT JOIN results r ON e.id = r.exam_id
      GROUP BY e.id
      ORDER BY e.title
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Most missed questions: questions with the most wrong answers
exports.mostMissedQuestions = async (req, res) => {
  try {
    // This assumes you have a way to know the correct answer for each question.
    // If you have a 'correct_option' column in 'questions', use it.
    const [rows] = await db.query(`
      SELECT 
        q.id, 
        q.question_text, 
        COUNT(a.id) AS wrong_count
      FROM questions q
      JOIN answers a ON q.id = a.question_id
      JOIN (
        SELECT id, correct_option FROM questions
      ) cq ON cq.id = q.id
      WHERE a.answer_option != cq.correct_option
      GROUP BY q.id
      ORDER BY wrong_count DESC
      LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};