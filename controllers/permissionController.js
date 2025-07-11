const db = require('../models/db');

// Get all permissions
exports.getAllPermissions = async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM permissions ORDER BY name');
    res.json(results);
  } catch (err) {
    console.error('❌ Error fetching permissions:', err);
    res.status(500).send('Internal server error');
  }
};

// Get user permissions
exports.getUserPermissions = async (req, res) => {
  try {
    const userId = req.params.userId;
    const [results] = await db.query(`
      SELECT p.id, p.name 
      FROM permissions p 
      JOIN user_permissions up ON p.id = up.permission_id 
      WHERE up.user_id = ?
    `, [userId]);
    res.json(results);
  } catch (err) {
    console.error('❌ Error fetching user permissions:', err);
    res.status(500).send('Internal server error');
  }
};

// Assign permission to user
exports.assignPermission = async (req, res) => {
  try {
    const { userId, permissionId } = req.body;
    
    // Check if user exists
    const [userCheck] = await db.query('SELECT id FROM Users WHERE id = ?', [userId]);
    if (userCheck.length === 0) {
      return res.status(404).send('User not found');
    }
    
    // Check if permission exists
    const [permCheck] = await db.query('SELECT id FROM permissions WHERE id = ?', [permissionId]);
    if (permCheck.length === 0) {
      return res.status(404).send('Permission not found');
    }
    
    // Check if already assigned
    const [existing] = await db.query(
      'SELECT * FROM user_permissions WHERE user_id = ? AND permission_id = ?',
      [userId, permissionId]
    );
    
    if (existing.length > 0) {
      return res.status(400).send('Permission already assigned to user');
    }
    
    // Assign permission
    await db.query(
      'INSERT INTO user_permissions (user_id, permission_id) VALUES (?, ?)',
      [userId, permissionId]
    );
    
    res.json({ message: 'Permission assigned successfully' });
  } catch (err) {
    console.error('❌ Error assigning permission:', err);
    res.status(500).send('Internal server error');
  }
};

// Remove permission from user
exports.removePermission = async (req, res) => {
  try {
    const { userId, permissionId } = req.body;
    
    await db.query(
      'DELETE FROM user_permissions WHERE user_id = ? AND permission_id = ?',
      [userId, permissionId]
    );
    
    res.json({ message: 'Permission removed successfully' });
  } catch (err) {
    console.error('❌ Error removing permission:', err);
    res.status(500).send('Internal server error');
  }
};

// Get all users with their permissions
exports.getAllUsersWithPermissions = async (req, res) => {
  try {
    const [results] = await db.query(`
      SELECT 
        u.id, u.name, u.email, u.role,
        GROUP_CONCAT(p.name) as permissions
      FROM users u
      LEFT JOIN user_permissions up ON u.id = up.user_id
      LEFT JOIN permissions p ON up.permission_id = p.id
      GROUP BY u.id
      ORDER BY u.name
    `);
    
    // Parse permissions string to array
    const users = results.map(user => ({
      ...user,
      permissions: user.permissions ? user.permissions.split(',') : []
    }));
    
    res.json(users);
  } catch (err) {
    console.error('❌ Error fetching users with permissions:', err);
    res.status(500).send('Internal server error');
  }
};