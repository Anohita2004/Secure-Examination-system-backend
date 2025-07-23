const express = require('express');
const router = express.Router();
const controller = require('../controllers/announcementController');

router.get('/', controller.getAllAnnouncements);
router.post('/', controller.createAnnouncement);
router.get('/unread/:employeeId', controller.getUnreadCount);
router.post('/mark-read', controller.markAsRead);


module.exports = router;
