const express = require('express');
const { getDb } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin role required.' });
  }
  next();
};

function getAll(sql, params = []) {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    const cols = stmt.getColumnNames();
    const vals = stmt.get();
    const row = {};
    cols.forEach((c, i) => (row[c] = vals[i]));
    rows.push(row);
  }
  stmt.free();
  return rows;
}

// GET /api/admin/events - Get all panic events with user info and location trail
router.get('/events', authenticateToken, requireAdmin, (req, res) => {
  try {
    const statusFilter = req.query.status;
    let query = `
      SELECT e.id, e.status, e.started_at, e.ended_at, u.username 
      FROM PanicEvents e 
      JOIN Users u ON e.user_id = u.id
    `;
    const params = [];

    if (statusFilter) {
      query += ` WHERE e.status = ?`;
      params.push(statusFilter);
    }
    query += ` ORDER BY e.started_at DESC`;

    const events = getAll(query, params);

    // Fetch related locations for each event
    for (const event of events) {
      event.locations = getAll(
        `SELECT latitude, longitude, timestamp FROM LocationUpdates WHERE event_id = ? ORDER BY timestamp ASC`,
        [event.id]
      );
    }

    res.json(events);
  } catch (err) {
    console.error('[admin events] Error:', err);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/admin/users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
  try {
    const users = getAll('SELECT id, username, role, created_at FROM Users ORDER BY created_at DESC');
    res.json(users);
  } catch (err) {
    console.error('[admin users] Error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
