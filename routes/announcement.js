const express = require('express');
const router = express.Router();
const controller = require('../controllers/announcementController');

router.get('/', controller.getAllAnnouncements);

module.exports = router;
