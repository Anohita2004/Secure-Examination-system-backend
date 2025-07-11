const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { requireAuth } = require('../middleware/authMiddleware'); // <-- DESTRUCTURE

router.get('/stats', dashboardController.getDashboardStats);
router.get('/table', requireAuth, dashboardController.getDashboardTable);

module.exports = router;