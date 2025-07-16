const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Employee-initiated password change
router.post('/change-password', userController.changePassword);




// Employee-initiated password change
router.post('/change-password', userController.changePassword);

// Forgot password endpoints
router.post('/request-password-reset', userController.requestPasswordReset);
router.post('/reset-password', userController.resetPassword);


// Get exam results for a user
router.get('/:userId/results', userController.getUserResults);

module.exports = router;