const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.get('/exam-summary', analyticsController.examSummary);
router.get('/most-missed-questions', analyticsController.mostMissedQuestions);

module.exports = router;