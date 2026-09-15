const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const DB_FILE = process.env.DB_FILE || 'loveconnect.db';
const db = new Database(path.join(__dirname, '..', DB_FILE));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------- Tabel users ----------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  avatar_emoji TEXT DEFAULT '💖',
  partner_id INTEGER,
  anniversary_date TEXT,
  share_location INTEGER DEFAULT 0,
  mood TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (partner_id) REFERENCES users(id)
)
`);

// ---------- Tabel kode undangan pasangan ----------
db.exec(`
CREATE TABLE IF NOT EXISTS invites (
  code TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`);

// ---------- Tabel lokasi terakhir ----------
db.exec(`
CREATE TABLE IF NOT EXISTS locations (
  user_id INTEGER PRIMARY KEY,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`);

// ---------- Tabel foto ----------
db.exec(`
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  filename TEXT NOT NULL,
  caption TEXT DEFAULT '',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
)
`);

// ---------- Tabel pesan / catatan cinta ----------
db.exec(`
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL,
  type TEXT DEFAULT 'note',
  content TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id)
)
`);

module.exports = db;
