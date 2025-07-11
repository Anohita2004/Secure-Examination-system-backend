const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { verifyToken, requireSuperAdmin } = require('../middleware/authMiddleware');

// All routes require super admin access
router.use(verifyToken, requireSuperAdmin);

// Get all permissions
router.get('/', permissionController.getAllPermissions);

// Get all users with their permissions
router.get('/users', permissionController.getAllUsersWithPermissions);

// Get specific user permissions
router.get('/users/:userId', permissionController.getUserPermissions);

// Assign permission to user
router.post('/assign', permissionController.assignPermission);

// Remove permission from user
router.delete('/remove', permissionController.removePermission);

module.exports = router;