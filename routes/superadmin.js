// routes/superadmin.js
const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadminController');

router.post('/forgot-password', superadminController.forgotPassword);
router.post('/verify-otp', superadminController.verifyOtp);
router.post('/reset-password', superadminController.resetPassword);

module.exports = router;


