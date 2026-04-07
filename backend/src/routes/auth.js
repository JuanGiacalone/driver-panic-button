const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getDb, saveDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_dev_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const ADMIN_SECRET = process.env.ADMIN_SECRET || '';
const SALT_ROUNDS = 10;

/**
 * Helper: run a SELECT query and return the first row as an object,
 * or undefined if no rows match.
 */
function getOne(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    stmt.free();
    const row = {};
    cols.forEach((c, i) => (row[c] = vals[i]));
    return row;
  }
  stmt.free();
  return undefined;
}

// ──────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check existing user
    const existing = getOne('SELECT id FROM Users WHERE username = ?', [username]);
    if (existing) {
      return res.status(409).json({ error: 'Username already taken.' });
    }

    // Hash password and insert
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const db = getDb();
    db.run('INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)', [
      username,
      password_hash,
      'user',
    ]);
    saveDatabase();

    // Get the inserted user
    const inserted = getOne('SELECT id FROM Users WHERE username = ?', [username]);
    const userId = inserted ? inserted.id : null;

    return res.status(201).json({
      message: 'User registered successfully.',
      user: { id: userId, username, role: 'user' },
    });
  } catch (err) {
    console.error('[auth/register] Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password, admin_secret } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required.' });
    }

    const user = getOne('SELECT * FROM Users WHERE username = ?', [username]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Determine role: promote to admin if secret matches
    let role = user.role;
    if (admin_secret && ADMIN_SECRET && admin_secret === ADMIN_SECRET) {
      role = 'admin';
      if (user.role !== 'admin') {
        const db = getDb();
        db.run('UPDATE Users SET role = ? WHERE id = ?', ['admin', user.id]);
        saveDatabase();
      }
    }

    // Sign JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return res.json({
      message: 'Login successful.',
      token,
      user: { id: user.id, username: user.username, role },
    });
  } catch (err) {
    console.error('[auth/login] Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ──────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ──────────────────────────────────────────────
router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = getOne(
      'SELECT id, username, role, created_at FROM Users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ user });
  } catch (err) {
    console.error('[auth/me] Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;
