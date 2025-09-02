const db = require('../models/db');

exports.hasPermission = async (userId, permissionName) => {
  try {
    // First, check if user is super_admin
    const [userResults] = await db.query(`
      SELECT role FROM users WHERE id = ?
    `, [userId]);
    
    if (userResults.length > 0 && userResults[0].role === 'super_admin') {
      return true; // Super admin has all permissions
    }
    
    // For non-super admins, check specific permission
    const [results] = await db.query(`
      SELECT p.id 
      FROM permissions p 
      JOIN user_permissions up ON p.id = up.permission_id 
      WHERE up.user_id = ? AND p.name = ?
    `, [userId, permissionName]);
    
    return results.length > 0;
  } catch (err) {
    console.error('Permission check error:', err);
    return false;
  }
};

exports.requirePermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.role === 'super_admin') {
        return next(); // super admin always allowed
      }
      const has = await exports.hasPermission(req.user.id, permissionName);
      if (!has) return res.status(403).send(`Access denied. Permission required: ${permissionName}`);
      next();
    } catch (err) {
      console.error('Permission middleware error:', err);
      res.status(500).send('Internal server error');
    }
  };
};