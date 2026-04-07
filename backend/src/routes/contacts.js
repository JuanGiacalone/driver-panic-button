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

// GET /api/contacts - Fetch all contacts for logged-in user
router.get('/', authenticateToken, (req, res) => {
  try {
    const contacts = getAll('SELECT * FROM Contacts WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.json(contacts);
  } catch (err) {
    console.error('[contacts GET] Error:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// POST /api/contacts - Add a new contact
router.post('/', authenticateToken, (req, res) => {
  try {
    const { name, phone, alert_method } = req.body;
    
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required.' });
    }
    
    const method = alert_method === 'whatsapp' ? 'whatsapp' : 'sms';
    
    const db = getDb();
    db.run(
      'INSERT INTO Contacts (user_id, name, phone, alert_method) VALUES (?, ?, ?, ?)',
      [req.user.id, name, phone, method]
    );
    saveDatabase();
    
    const inserted = getOne('SELECT * FROM Contacts WHERE user_id = ? ORDER BY id DESC LIMIT 1', [req.user.id]);
    res.status(201).json(inserted);
  } catch (err) {
    console.error('[contacts POST] Error:', err);
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// PUT /api/contacts/:id - Update an existing contact
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const contactId = req.params.id;
    const { name, phone, alert_method } = req.body;
    
    // Ensure the contact belongs to the user
    const contact = getOne('SELECT * FROM Contacts WHERE id = ? AND user_id = ?', [contactId, req.user.id]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const method = alert_method === 'whatsapp' ? 'whatsapp' : 'sms';
    
    const db = getDb();
    db.run(
      'UPDATE Contacts SET name = ?, phone = ?, alert_method = ? WHERE id = ? AND user_id = ?',
      [name || contact.name, phone || contact.phone, method, contactId, req.user.id]
    );
    saveDatabase();
    
    const updated = getOne('SELECT * FROM Contacts WHERE id = ?', [contactId]);
    res.json(updated);
  } catch (err) {
    console.error('[contacts PUT] Error:', err);
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// DELETE /api/contacts/:id - Delete a contact
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const contactId = req.params.id;
    
    const contact = getOne('SELECT * FROM Contacts WHERE id = ? AND user_id = ?', [contactId, req.user.id]);
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    
    const db = getDb();
    db.run('DELETE FROM Contacts WHERE id = ? AND user_id = ?', [contactId, req.user.id]);
    saveDatabase();
    
    res.json({ message: 'Contact deleted successfully' });
  } catch (err) {
    console.error('[contacts DELETE] Error:', err);
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});

module.exports = router;
