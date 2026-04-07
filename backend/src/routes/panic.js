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

// POST /api/panic/trigger
router.post('/trigger', authenticateToken, (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    const db = getDb();

    // End any currently active events for the user to keep state clean
    db.run(
      "UPDATE PanicEvents SET status = 'resolved', ended_at = datetime('now') WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );

    // Create new event
    db.run(
      "INSERT INTO PanicEvents (user_id, status) VALUES (?, 'active')",
      [req.user.id]
    );
    
    // Get the newly inserted event id
    const eventRow = getOne("SELECT id FROM PanicEvents WHERE user_id = ? ORDER BY id DESC LIMIT 1", [req.user.id]);
    const eventId = eventRow.id;

    // Log the initial location
    db.run(
      "INSERT INTO LocationUpdates (event_id, latitude, longitude) VALUES (?, ?, ?)",
      [eventId, latitude, longitude]
    );
    saveDatabase();

    // Fetch user details for integration
    const userRow = getOne("SELECT username FROM Users WHERE id = ?", [req.user.id]);
    const messageRow = getOne("SELECT custom_message FROM Messages WHERE user_id = ? ORDER BY id DESC LIMIT 1", [req.user.id]);
    
    const username = userRow ? userRow.username : 'Unknown Driver';
    const customMessage = messageRow ? messageRow.custom_message : '¡Necesito ayuda! Por favor, revisa mi ubicación.';
    const trackingUrl = `${req.protocol}://${req.get('host')}/map.html?event=${eventId}`;

    res.status(201).json({
      message: 'Panic event triggered successfully',
      event_id: eventId,
      tracking_url: trackingUrl,
      username: username,
      custom_message: customMessage
    });
  } catch (err) {
    console.error('[panic trigger] Error:', err);
    res.status(500).json({ error: 'Failed to trigger panic event' });
  }
});

// POST /api/panic/update
router.post('/update', authenticateToken, (req, res) => {
  try {
    const { event_id, latitude, longitude } = req.body;
    
    if (!event_id || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'event_id, latitude, and longitude are required' });
    }

    // Verify the event belongs to the user and is active
    const event = getOne("SELECT id, status FROM PanicEvents WHERE id = ? AND user_id = ?", [event_id, req.user.id]);
    
    if (!event) {
      return res.status(404).json({ error: 'Panic event not found' });
    }
    
    if (event.status !== 'active') {
      return res.status(400).json({ error: 'Panic event is no longer active' });
    }

    const db = getDb();
    db.run(
      "INSERT INTO LocationUpdates (event_id, latitude, longitude) VALUES (?, ?, ?)",
      [event_id, latitude, longitude]
    );
    saveDatabase();

    res.json({ message: 'Location updated successfully' });
  } catch (err) {
    console.error('[panic update] Error:', err);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// POST /api/panic/resolve
router.post('/resolve', authenticateToken, (req, res) => {
  try {
    const db = getDb();
    
    // In scenarios where we have event_id
    const { event_id } = req.body;

    if (event_id) {
       db.run(
         "UPDATE PanicEvents SET status = 'resolved', ended_at = datetime('now') WHERE id = ? AND user_id = ?",
         [event_id, req.user.id]
       );
    } else {
       // If no event_id supplied, resolve all active for this user
       db.run(
        "UPDATE PanicEvents SET status = 'resolved', ended_at = datetime('now') WHERE user_id = ? AND status = 'active'",
        [req.user.id]
      );
    }

    saveDatabase();

    res.json({ message: 'Panic event resolved successfully' });
  } catch (err) {
    console.error('[panic resolve] Error:', err);
    res.status(500).json({ error: 'Failed to resolve panic event' });
  }
});

// GET /api/panic/track/:eventId
router.get('/track/:eventId', (req, res) => {
  try {
    const { eventId } = req.params;
    
    if (!eventId) {
      return res.status(400).json({ error: 'eventId is required' });
    }

    const event = getOne("SELECT id, user_id, status, started_at FROM PanicEvents WHERE id = ?", [eventId]);
    
    if (!event) {
      return res.status(404).json({ error: 'Panic event not found' });
    }

    const eventTime = new Date(event.started_at + 'Z');
    const now = new Date();
    const diffHours = (now - eventTime) / (1000 * 60 * 60);

    if (diffHours > 2) {
      return res.json({ status: 'expired' });
    }
    
    if (event.status !== 'active') {
      return res.json({ status: 'resolved' });
    }

    // Fetch user details
    const userRow = getOne("SELECT username FROM Users WHERE id = ?", [event.user_id]);
    const messageRow = getOne("SELECT custom_message FROM Messages WHERE user_id = ? ORDER BY id DESC LIMIT 1", [event.user_id]);
    
    const username = userRow ? userRow.username : 'Unknown Driver';
    const customMessage = messageRow ? messageRow.custom_message : '¡Necesito ayuda! Por favor, revisa mi ubicación.';

    // Fetch latest location
    const locationRow = getOne("SELECT latitude, longitude, timestamp FROM LocationUpdates WHERE event_id = ? ORDER BY id DESC LIMIT 1", [event.id]);

    res.json({
      status: 'active',
      username: username,
      custom_message: customMessage,
      location: locationRow ? {
        latitude: locationRow.latitude,
        longitude: locationRow.longitude,
        timestamp: locationRow.timestamp
      } : null
    });

  } catch (err) {
    console.error('[panic track] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve tracking information' });
  }
});

module.exports = router;
