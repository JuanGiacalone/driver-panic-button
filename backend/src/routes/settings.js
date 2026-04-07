const express = require('express');
const { getDb, saveDatabase } = require('../database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

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

// GET /api/settings/message
router.get('/message', authenticateToken, (req, res) => {
  try {
    const message = getOne('SELECT * FROM Messages WHERE user_id = ? LIMIT 1', [req.user.id]);
    if (message) {
      res.json({ custom_message: message.custom_message });
    } else {
      res.json({ custom_message: null }); // fallback to default on frontend
    }
  } catch (err) {
    console.error('[settings GET] Error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// POST or PUT /api/settings/message
router.post('/message', authenticateToken, (req, res) => {
  try {
    const { custom_message } = req.body;
    if (!custom_message) {
      return res.status(400).json({ error: 'custom_message is required' });
    }
    
    const db = getDb();
    const existing = getOne('SELECT id FROM Messages WHERE user_id = ?', [req.user.id]);
    
    if (existing) {
      db.run('UPDATE Messages SET custom_message = ? WHERE user_id = ?', [custom_message, req.user.id]);
    } else {
      db.run('INSERT INTO Messages (user_id, custom_message) VALUES (?, ?)', [req.user.id, custom_message]);
    }
    saveDatabase();
    
    res.json({ message: 'Settings saved successfully', custom_message });
  } catch (err) {
    console.error('[settings POST] Error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// Alias for PUT to /api/settings/message
router.put('/message', (req, res, next) => {
  // Pass to the POST handler to reuse logic
  req.url = '/message';
  next();
});

module.exports = router;
