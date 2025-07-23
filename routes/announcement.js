const express = require('express');
const router = express.Router();
const controller = require('../controllers/announcementController');

router.get('/', controller.getAllAnnouncements);
router.post('/', controller.createAnnouncement);

module.exports = router;
