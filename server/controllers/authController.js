const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const pool   = require('../config/db');
const env    = require('../config/env');

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role_name || user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );
}

/* POST /api/v1/auth/register */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hash = await bcrypt.hash(password, 10);
    // Default role = student (role_id 1)
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password_hash, role_id) VALUES (?, ?, ?, 1)',
      [name, email, hash]
    );

    const token = signToken({ id: result.insertId, email, role_name: 'student' });

    res.status(201).json({
      success: true,
      message: 'Account created',
      data: { token, user: { id: result.insertId, name, email, role: 'student' } },
    });
  } catch (err) {
    next(err);
  }
}

/* POST /api/v1/auth/login */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.password_hash, u.avatar_url, r.name AS role_name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email]
    );
    if (!rows.length) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user);

    res.json({
      success: true,
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role_name, avatar_url: user.avatar_url },
      },
    });
  } catch (err) {
    next(err);
  }
}

/* GET /api/v1/auth/me */
async function me(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.email, u.avatar_url, r.name AS role
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, me };
