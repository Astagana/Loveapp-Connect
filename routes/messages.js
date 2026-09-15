const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- Kirim pesan / catatan cinta / "kangen" / "cinta" ----------
router.post('/', requireAuth, (req, res) => {
  const { content, type } = req.body;
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

  if (!me.partner_id) return res.status(400).json({ error: 'Kamu belum terhubung dengan pasangan.' });

  const allowedTypes = ['note', 'miss_you', 'love_you', 'good_morning', 'good_night'];
  const finalType = allowedTypes.includes(type) ? type : 'note';

  const defaults = {
    miss_you: 'Aku kangen kamu... 🥺💗',
    love_you: 'Aku cinta kamu! 💖',
    good_morning: 'Selamat pagi, sayang! ☀️💕',
    good_night: 'Selamat tidur, mimpi indah 🌙💤'
  };

  const finalContent = (content && content.trim()) || defaults[finalType] || '';
  if (!finalContent) return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });

  const info = db.prepare(
    'INSERT INTO messages (sender_id, type, content) VALUES (?, ?, ?)'
  ).run(req.userId, finalType, finalContent.slice(0, 500));

  const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(info.lastInsertRowid);
  res.json({ message });
});

// ---------- Ambil riwayat pesan berdua ----------
router.get('/', requireAuth, (req, res) => {
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const ids = me.partner_id ? [me.id, me.partner_id] : [me.id];
  const placeholders = ids.map(() => '?').join(',');

  const messages = db.prepare(
    `SELECT messages.*, users.name AS sender_name, users.avatar_emoji AS sender_avatar
     FROM messages JOIN users ON users.id = messages.sender_id
     WHERE messages.sender_id IN (${placeholders})
     ORDER BY messages.created_at DESC LIMIT 100`
  ).all(...ids);

  res.json({ messages });
});

// ---------- Tandai pesan sudah dibaca ----------
router.put('/:id/read', requireAuth, (req, res) => {
  db.prepare('UPDATE messages SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
