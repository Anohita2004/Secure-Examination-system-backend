const express = require("express");
const router = express.Router();
const superadminController = require("../controllers/superadminController");

// Forgot Password
router.post("/forgot-password", superadminController.forgotPassword);

module.exports = router;


