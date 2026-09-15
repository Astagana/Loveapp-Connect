const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 30 * 24 * 3600 * 1000
};

const router = express.Router();

function publicUser(u) {
  if (!u) return null;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    avatar_emoji: u.avatar_emoji,
    partner_id: u.partner_id,
    anniversary_date: u.anniversary_date,
    share_location: !!u.share_location,
    mood: u.mood,
    created_at: u.created_at
  };
}

// ---------- REGISTER ----------
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama, email, dan kata sandi wajib diisi.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Kata sandi minimal 6 karakter.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (existing) {
    return res.status(409).json({ error: 'Email ini sudah terdaftar. Silakan masuk.' });
  }

  const hash = bcrypt.hashSync(password, 10);
  const info = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  ).run(name.trim(), email.toLowerCase().trim(), hash);

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });

  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ user: publicUser(user), token });
});

// ---------- LOGIN ----------
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Email atau kata sandi salah.' });
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.cookie('token', token, COOKIE_OPTIONS);
  res.json({ user: publicUser(user), token });
});

// ---------- LOGOUT ----------
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

// ---------- PROFIL SAYA ----------
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

  let partner = null;
  if (user.partner_id) {
    partner = db.prepare('SELECT * FROM users WHERE id = ?').get(user.partner_id);
  }

  res.json({ user: publicUser(user), partner: publicUser(partner) });
});

// ---------- UPDATE PROFIL (avatar, mood, anniversary) ----------
router.put('/me', requireAuth, (req, res) => {
  const { avatar_emoji, mood, anniversary_date } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'Pengguna tidak ditemukan.' });

  db.prepare(
    'UPDATE users SET avatar_emoji = ?, mood = ?, anniversary_date = ? WHERE id = ?'
  ).run(
    avatar_emoji ?? user.avatar_emoji,
    mood ?? user.mood,
    anniversary_date ?? user.anniversary_date,
    req.userId
  );

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  res.json({ user: publicUser(updated) });
});

module.exports = router;
