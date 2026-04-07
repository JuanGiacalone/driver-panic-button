const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DB_PATH = process.env.DB_PATH || './data/panic_button.db';

let _db = null;

/**
 * Initialise (or re-open) the SQLite database via sql.js.
 * Returns the Database instance synchronously after first call.
 */
async function initDatabase() {
  if (_db) return _db;

  const SQL = await initSqlJs();

  // Ensure data directory exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing database file or create a new one
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    _db = new SQL.Database(fileBuffer);
  } else {
    _db = new SQL.Database();
  }

  // Enable foreign keys
  _db.run('PRAGMA foreign_keys = ON');

  // Create tables
  _db.run(`
    CREATE TABLE IF NOT EXISTS Users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS Contacts (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,
      name          TEXT    NOT NULL,
      phone         TEXT    NOT NULL,
      alert_method  TEXT    NOT NULL DEFAULT 'sms' CHECK(alert_method IN ('sms','whatsapp')),
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS Messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id         INTEGER NOT NULL,
      custom_message  TEXT    NOT NULL,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS PanicEvents (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,
      status     TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','resolved')),
      started_at TEXT    NOT NULL DEFAULT (datetime('now')),
      ended_at   TEXT,
      FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    )
  `);

  _db.run(`
    CREATE TABLE IF NOT EXISTS LocationUpdates (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id  INTEGER NOT NULL,
      latitude  REAL    NOT NULL,
      longitude REAL    NOT NULL,
      timestamp TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES PanicEvents(id) ON DELETE CASCADE
    )
  `);

  // Persist to disk
  saveDatabase();

  console.log('[database] SQLite schema initialised ✓');
  return _db;
}

/**
 * Get the database instance (must call initDatabase first).
 */
function getDb() {
  if (!_db) throw new Error('Database not initialised. Call initDatabase() first.');
  return _db;
}

/**
 * Persist the in-memory database to the file on disk.
 * Call this after every write operation.
 */
function saveDatabase() {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

module.exports = { initDatabase, getDb, saveDatabase };
