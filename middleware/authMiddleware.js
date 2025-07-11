/*const jwt = require("jsonwebtoken");

exports.verifyToken = (req, res, next) => {
  //CHANGES
  //const token = req.headers["authorization"];
  const token = req.cookies.token;
  if (!token) return res.status(401).send("No token provided");

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).send("Failed to authenticate token");
    req.user = decoded; // { id, role }
    next();
  });
};

exports.isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).send("Admins only");
  next();
};
const db = require('../models/db');

exports.requireAuth = async (req, res, next) => {
  const sessionId = req.cookies.session_id;
  if (!sessionId) return res.status(401).send('Unauthorized: No session');

  const [results] = await db.query(`
    SELECT sessions.*, Users.name, Users.email 
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
};*/
const db = require('../models/db');

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
};