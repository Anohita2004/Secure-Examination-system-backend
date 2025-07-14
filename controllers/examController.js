/*const db = require('../models/db');
const { sendExamEmail } = require('../utils/mailer');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Create a new exam
exports.createExam = async (req, res) => {
  // Check if user has permission to create exams
  const hasCreatePermission = await hasPermission(req.user.id, 'create_exam');
  if (!hasCreatePermission) {
    return res.status(403).send('Access denied. Permission required: create_exam');
  }
  const { title, description, due_date, created_by } = req.body;
  if (!title || !description || !due_date || !created_by) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Exams (title, description, due_date, created_by) VALUES (?, ?, ?, ?)',
      [title, description, due_date, created_by]
    );
    res.send({ message: 'Exam created successfully', examId: result.insertId });
  } catch (err) {
    console.error('❌ Error creating exam:', err);
    res.status(500).json({ error: err.message });
  }
};

// Add a new question to an exam
exports.addQuestion = async (req, res) => {
  const { exam_id, question_text, option_a, option_b, option_c, option_d, correct_option } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [exam_id, question_text, option_a, option_b, option_c, option_d, correct_option]
    );
    res.send({ message: 'Question added successfully', questionId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign an exam to a user and send email
exports.assignExam = async (req, res) => {
  const { exam_id, user_id, email } = req.body;
  try {
    await db.query('INSERT INTO Exam_Assignments (exam_id, user_id) VALUES (?, ?)', [exam_id, user_id]);
    await sendExamEmail(email, `Exam ID: ${exam_id}`, 'Check your due date on the portal');
    res.send({ message: 'Exam assigned and email sent ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Assigned but email failed ❌', error: err.message });
  }
};

// Get exams assigned to a user
exports.getAssignedExams = async (req, res) => {
  const { userId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT Exams.*, Exam_Assignments.attempted 
       FROM Exams 
       JOIN Exam_Assignments ON Exams.id = Exam_Assignments.exam_id 
       WHERE Exam_Assignments.user_id = ?`,
      [userId]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get questions for a specific exam
exports.getExamQuestions = async (req, res) => {
  console.log("📥 getExamQuestions CALLED for examId:", req.params.examId);
  const { examId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d 
       FROM Questions 
       WHERE exam_id = ?`,
      [examId]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Submit answers for an exam
exports.submitExamAnswers = async (req, res) => {
  const { examId } = req.params;
  const { user_id, answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers must be an array' });
  }

  try {
    const [check] = await db.query(
      'SELECT attempted FROM exam_assignments WHERE user_id = ? AND exam_id = ?',
      [user_id, examId]
    );

    if (check.length === 0) return res.status(404).json({ error: 'Exam not assigned' });
    if (check[0].attempted === 1) return res.status(400).json({ error: 'Exam already attempted' });

    const values = answers.map(({ question_id, answer }) => [user_id, question_id, answer]);
    await db.query('INSERT INTO Answers (user_id, question_id, answer_option) VALUES ?', [values]);

    const [results] = await db.query(
      `SELECT q.correct_option, a.answer_option 
       FROM Questions q 
       JOIN Answers a ON q.id = a.question_id 
       WHERE q.exam_id = ? AND a.user_id = ?`,
      [examId, user_id]
    );

    let score = 0;
    results.forEach(r => {
      if (r.answer_option === r.correct_option) score++;
    });

    const total = results.length;
    const passed = score >= Math.ceil(total * 0.5);

    await db.query(
      `INSERT INTO Results (user_id, exam_id, total_score, passed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE total_score = VALUES(total_score), passed = VALUES(passed), evaluated_at = CURRENT_TIMESTAMP`,
      [user_id, examId, score, passed]
    );

    await db.query(
      'UPDATE Exam_Assignments SET attempted = 1 WHERE user_id = ? AND exam_id = ?',
      [user_id, examId]
    );

    res.json({ message: 'Answers submitted and result stored', score, total, passed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all results for a specific exam
exports.getAllExamResults = async (req, res) => {
  const { examId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT a.user_id, u.name, COUNT(q.id) as total, 
              SUM(a.answer_option = q.correct_option) as score
       FROM Answers a
       JOIN Questions q ON a.question_id = q.id
       JOIN Users u ON a.user_id = u.id
       WHERE q.exam_id = ?
       GROUP BY a.user_id`,
      [examId]
    );
    res.json(results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get detailed result of a user for a specific exam
exports.getUserExamResult = async (req, res) => {
  const { examId, userId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT q.id as question_id, q.question_text, q.correct_option, a.answer_option
       FROM Questions q
       LEFT JOIN Answers a ON q.id = a.question_id AND a.user_id = ?
       WHERE q.exam_id = ?`,
      [userId, examId]
    );

    let score = 0;
    results.forEach(r => {
      if (r.answer_option && r.answer_option === r.correct_option) score++;
    });

    res.json({ answers: results, score, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
*/
const db = require('../models/db');
const { sendExamEmail } = require('../utils/mailer');
const { hasPermission } = require('../middleware/permissionMiddleware');

// Create a new exam
exports.createExam = async (req, res) => {
  // Check if user has permission to create exams
  const hasCreatePermission = await hasPermission(req.user.id, 'create_exam');
  if (!hasCreatePermission) {
    return res.status(403).send('Access denied. Permission required: create_exam');
  }
  const { title, description, due_date, created_by } = req.body;
  if (!title || !description || !due_date || !created_by) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  try {
    const [result] = await db.query(
      'INSERT INTO Exams (title, description, due_date, created_by) VALUES (?, ?, ?, ?)',
      [title, description, due_date, created_by]
    );
    res.send({ message: 'Exam created successfully', examId: result.insertId });
  } catch (err) {
    console.error('Error creating exam:', err);
    res.status(500).json({ error: err.message });
  }
};

// Add a new question to an exam
exports.addQuestion = async (req, res) => {
  const { exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, is_msq } = req.body;
  try {
    const [result] = await db.query(
      'INSERT INTO Questions (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, is_msq) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [exam_id, question_text, option_a, option_b, option_c, option_d, correct_option, is_msq || false]
    );
    res.send({ message: 'Question added successfully', questionId: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Assign an exam to a user and send email
exports.assignExam = async (req, res) => {
  const { exam_id, user_id, email } = req.body;
  console.log('Assigning exam:', { exam_id, user_id, email }); // <-- Add this
  try {
    const [existing] = await db.query(
      'SELECT * FROM exam_assignments WHERE exam_id = ? AND user_id = ?',
      [exam_id, user_id]
    );
    if (existing.length > 0) {
      return res.status(400).json({ error: "Exam already assigned to this user." });
    }
    await db.query(
      'INSERT INTO exam_assignments (exam_id, user_id) VALUES (?, ?)',
      [exam_id, user_id]
    );
    await sendExamEmail(email, `Exam ID: ${exam_id}`, 'Check your due date on the portal');
    res.send({ message: 'Exam assigned and email sent ✅' });
  } catch (err) {
    console.error('Error inserting assignment:', err); // <-- Add this
    res.status(500).json({ error: err.message });
  }
};

// Get exams assigned to a user
exports.getAssignedExams = async (req, res) => {
  const { userId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT Exams.*, exam_assignments.attempted 
       FROM Exams 
       JOIN exam_assignments ON Exams.id = exam_assignments.exam_id 
       WHERE Exam_Assignments.user_id = ?`,
      [userId]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get questions for a specific exam
exports.getExamQuestions = async (req, res) => {
  const { examId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option, is_msq 
       FROM Questions 
       WHERE exam_id = ?`,
      [examId]
    );
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Submit answers for an exam (Updated for MSQ support)
exports.submitExamAnswers = async (req, res) => {
  const { examId } = req.params;
  const { user_id, answers } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Answers must be an array' });
  }

  try {
    const [check] = await db.query(
      'SELECT attempted FROM exam_assignments WHERE user_id = ? AND exam_id = ?',
      [user_id, examId]
    );

    if (check.length === 0) return res.status(404).json({ error: 'Exam not assigned' });
    if (check[0].attempted === 1) return res.status(400).json({ error: 'Exam already attempted' });

    // Get questions to check if they are MSQ or MCQ
    const [questions] = await db.query(
      'SELECT id, correct_option, is_msq FROM Questions WHERE exam_id = ?',
      [examId]
    );

    let score = 0;
    const total = questions.length;

    // Process each answer
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      const question = questions.find(q => q.id === answer.question_id);
      
      if (!question) continue;

      if (question.is_msq) {
        // For MSQ: compare arrays (order doesn't matter)
        const submittedAnswers = Array.isArray(answer.answer) ? answer.answer : [answer.answer];
        const correctAnswers = question.correct_option.split(',').map(a => a.trim());
        
        // Check if arrays have same elements (order doesn't matter)
        const isCorrect = submittedAnswers.length === correctAnswers.length &&
          submittedAnswers.every(a => correctAnswers.includes(a)) &&
          correctAnswers.every(a => submittedAnswers.includes(a));
        
        if (isCorrect) score++;
      } else {
        // For MCQ: simple string comparison
        if (answer.answer === question.correct_option) {
          score++;
        }
      }
    }

    const passed = score >= Math.ceil(total * 0.5);

    // Store results
    await db.query(
      `INSERT INTO Results (user_id, exam_id, total_score, passed)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE total_score = VALUES(total_score), passed = VALUES(passed), evaluated_at = CURRENT_TIMESTAMP`,
      [user_id, examId, score, passed]
    );

    // Mark exam as attempted
    await db.query(
      'UPDATE exam_assignments SET attempted = 1 WHERE user_id = ? AND exam_id = ?',
      [user_id, examId]
    );

    res.json({ message: 'Answers submitted and result stored', score, total, passed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all results for a specific exam
exports.getAllExamResults = async (req, res) => {
  const { examId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT a.user_id, u.name, COUNT(q.id) as total, 
              SUM(a.answer_option = q.correct_option) as score
       FROM Answers a
       JOIN Questions q ON a.question_id = q.id
       JOIN Users u ON a.user_id = u.id
       WHERE q.exam_id = ?
       GROUP BY a.user_id`,
      [examId]
    );
    res.json(results || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get detailed result of a user for a specific exam
exports.getUserExamResult = async (req, res) => {
  const { examId, userId } = req.params;
  try {
    const [results] = await db.query(
      `SELECT q.id as question_id, q.question_text, q.correct_option, a.answer_option
       FROM Questions q
       LEFT JOIN Answers a ON q.id = a.question_id AND a.user_id = ?
       WHERE q.exam_id = ?`,
      [userId, examId]
    );

    let score = 0;
    results.forEach(r => {
      if (r.answer_option && r.answer_option === r.correct_option) score++;
    });

    res.json({ answers: results, score, total: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};