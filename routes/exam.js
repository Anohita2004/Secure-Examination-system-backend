const express = require('express');
const router = express.Router();
const examController = require('../controllers/examController');
const { requireAuth } = require('../middleware/authMiddleware');

router.post('/create', requireAuth, examController.createExam);
router.post('/add-question', requireAuth, examController.addQuestion);
router.post('/assign', requireAuth, examController.assignExam);
router.get('/exams', examController.getAllExams);
router.get('/assigned/:userId', requireAuth, examController.getAssignedExams);
router.get('/:examId/questions', requireAuth, examController.getExamQuestions);
router.post('/:examId/submit', requireAuth, examController.submitExamAnswers);
router.get('/:examId/result/:userId', requireAuth, examController.getUserExamResult);
router.get('/:examId/results', requireAuth, examController.getAllExamResults);
router.get('/calendar/:date', examController.loadExamCalendar);


module.exports = router;