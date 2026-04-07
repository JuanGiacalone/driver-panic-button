require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { initDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const contactsRoutes = require('./routes/contacts');
const settingsRoutes = require('./routes/settings');
const panicRoutes = require('./routes/panic');
const adminRoutes = require('./routes/admin');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// ──────────────────────────────────────────────
// Middleware
// ──────────────────────────────────────────────
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/panic', panicRoutes);
app.use('/api/admin', adminRoutes);

// Servir archivos estáticos del dashboard de admin
app.use('/', express.static(path.join(__dirname, '../public')));

// ──────────────────────────────────────────────
// Start (async because sql.js init is async)
// ──────────────────────────────────────────────
async function start() {
  await initDatabase();

  app.listen(PORT, () => {
    console.log(`[server] Driver Panic Backend listening on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});

module.exports = app;
