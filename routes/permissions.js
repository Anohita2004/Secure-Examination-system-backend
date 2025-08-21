const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');

const { requireAuth } = require('../middleware/authMiddleware');
// IMPORTANT: use permissionMiddleware here
const { requirePermission } = require('../middleware/permissionMiddleware');

router.use(requireAuth);
router.use(requirePermission('manage_permissions'));

router.get('/', permissionController.getAllPermissions);
router.get('/users', permissionController.getAllUsersWithPermissions);
router.get('/users/:userId', permissionController.getUserPermissions);
router.post('/assign', permissionController.assignPermission);
router.delete('/remove', permissionController.removePermission);

module.exports = router;