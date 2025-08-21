
/*const db = require('../models/db');

exports.requireAuth = async (req, res, next) => {
  const sessionId = req.cookies.session_id;
  if (!sessionId) return res.status(401).send('Unauthorized: No session');

  const [results] = await db.query(`
    SELECT sessions.*, Users.name, Users.email, Users.role
    FROM sessions
    JOIN Users ON sessions.user_id = Users.id
    WHERE sessions.id = ? AND sessions.expires_at > NOW()
  `, [sessionId]);

  if (results.length === 0) return res.status(401).send('Session expired or invalid');

  req.user = {
    id: results[0].user_id,
    name: results[0].name,
    email: results[0].email,
    role: results[0].role
  };

  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).send("Admins only");
  next();
};
// Add this function to your existing authMiddleware.js
exports.requireSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).send('Access denied. Super admin required.');
  }
  next();
};*/
// authMiddleware.js
const db = require('../models/db');

// ✅ Check if user is authenticated (session validation)
exports.requireAuth = async (req, res, next) => {
  try {
    const sessionId = req.cookies.session_id;
    if (!sessionId) return res.status(401).send('Unauthorized: No session');

    const [results] = await db.query(`
      SELECT s.*, u.name, u.email, u.role
      FROM sessions s
      JOIN Users u ON s.user_id = u.id
      WHERE s.id = ? AND s.expires_at > NOW()
    `, [sessionId]);

    if (results.length === 0) return res.status(401).send('Session expired or invalid');

    const user = results[0];

    // ✅ Fetch permissions
    let permissions = [];
    if (user.role === 'super_admin') {
      const [allPerms] = await db.query('SELECT name FROM permissions');
      permissions = allPerms.map(p => p.name);
    } else {
      const [permResults] = await db.query(`
        SELECT p.name
        FROM permissions p
        JOIN user_permissions up ON p.id = up.permission_id
        WHERE up.user_id = ?
      `, [user.user_id]);
      permissions = permResults.map(p => p.name);
    }

    // Attach user + permissions
    req.user = {
      id: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions
    };

    next();
  } catch (err) {
    console.error("❌ Auth middleware error:", err);
    res.status(500).send("Internal server error");
  }
};

// ✅ Role-based check
exports.requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).send(`Access denied. Requires role: ${role}`);
    }
    next();
  };
};

// ✅ Permission-based check
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).send('Unauthorized');
    if (req.user.role === 'super_admin') return next(); // allow super admin
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).send(`Access denied. Requires permission: ${permission}`);
    }
    next();
  };
};
