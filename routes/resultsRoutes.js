const express = require("express");
const router = express.Router();
const resultsController = require("../controllers/resultsController");

// GET all results for a user
router.get("/users/:userId/results", resultsController.getUserResults);

module.exports = router;
