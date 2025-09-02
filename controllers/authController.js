/*const db = require('../models/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  const sql = 'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, hashedPassword, role], (err) => {
    if (err) return res.status(500).send(err);
    res.send('User registered!');
  });
};

/*exports.login = (req, res) => {
  const { email, password } = req.body;

  db.query('SELECT * FROM Users WHERE email = ?', [email], (err, results) => {
    if (err) return res.status(500).send(err);
    if (results.length === 0) return res.status(401).send('User not found');

    const user = results[0];
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return res.status(401).send('Invalid credentials');

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    res.json({ token, userId: user.id, role: user.role });
  });
};*/

//the above */ is false
/*exports.login = async (req, res) => {
  try {
    console.log("🔥 LOGIN ROUTE HIT:", req.body);

    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const [results] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);

    if (results.length === 0) return res.status(401).send('User not found');

    const user = results[0];
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return res.status(401).send('Invalid credentials');

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    //  Insert login record
    await db.query(
      'INSERT INTO LoginHistory (user_id, ip_address, user_agent) VALUES (?, ?, ?)',
      [user.id, ip, userAgent]
    );
    //CHANGES
    //res.json({ token, userId: user.id, role: user.role });
    res.cookie('token', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // true in prod, false in dev
  sameSite: 'Strict', // or 'Lax' if you need cross-site
  maxAge: 60 * 60 * 1000 // 1 hour
});
res.json({ success: true }); // Don't send token to frontend!
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).send('Internal server error');
  }
};
// /api/auth/me
exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const [results] = await db.query('SELECT id, name, email, role FROM Users WHERE id = ?', [userId]);

    if (results.length === 0) return res.status(404).send('User not found');

    res.json(results[0]); // Send secure user info
  } catch (err) {
    console.error('❌ Error fetching user info:', err);
    res.status(500).send('Internal server error');
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
};
*/
const db = require('../models/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// ✅ Register
exports.register = (req, res) => {
  const { name, email, password, role } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 8);

  const sql = 'INSERT INTO Users (name, email, password_hash, role) VALUES (?, ?, ?, ?)';
  db.query(sql, [name, email, hashedPassword, role], (err) => {
    if (err) return res.status(500).send(err);
    res.send('User registered!');
  });
};

// ✅ Login with permissions
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const [results] = await db.query('SELECT * FROM Users WHERE email = ?', [email]);
    if (results.length === 0) return res.status(401).send('User not found');
    
    const user = results[0];
    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) return res.status(401).send('Invalid credentials');

    // 🔑 Fetch permissions
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
      `, [user.id]);
      permissions = permResults.map(p => p.name);
    }

    // ✅ Create session
    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await db.query(
      'INSERT INTO sessions (id, user_id, role, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, user.id, user.role, expiresAt]
    );

    // Set cookie
    res.cookie('session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
      maxAge: 60 * 60 * 1000
    });

    // ✅ Return user with permissions
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions
      }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).send('Internal server error');
  }
};

// ✅ Get current user (with permissions)
exports.getCurrentUser = async (req, res) => {
  try {
    // req.user is set by requireAuth middleware
    const user = req.user;

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
      `, [user.id]);
      permissions = permResults.map(p => p.name);
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions
    });
  } catch (err) {
    console.error("❌ getCurrentUser error:", err);
    res.status(500).send('Internal server error');
  }
};

// ✅ Logout
exports.logout = async (req, res) => {
  const sessionId = req.cookies.session_id;
  if (sessionId) {
    await db.query('DELETE FROM sessions WHERE id = ?', [sessionId]);
    res.clearCookie('session_id');
  }
  res.json({ success: true });
};
