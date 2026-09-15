const express = require('express');
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function genCode() {
  // Kode 6 karakter mudah dibaca & diketik pasangan
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

// ---------- Buat kode undangan (langkah 1: persetujuan pihak A) ----------
router.post('/invite', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (user.partner_id) {
    return res.status(400).json({ error: 'Kamu sudah terhubung dengan pasangan.' });
  }

  // Hapus kode lama milik user ini agar tidak menumpuk
  db.prepare('DELETE FROM invites WHERE user_id = ?').run(req.userId);

  let code;
  do {
    code = genCode();
  } while (db.prepare('SELECT code FROM invites WHERE code = ?').get(code));

  db.prepare('INSERT INTO invites (code, user_id) VALUES (?, ?)').run(code, req.userId);
  res.json({ code });
});

// ---------- Terima kode undangan (langkah 2: persetujuan pihak B) ----------
router.post('/accept', requireAuth, (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: 'Kode undangan wajib diisi.' });

  const invite = db.prepare('SELECT * FROM invites WHERE code = ?').get(code.toUpperCase().trim());
  if (!invite) return res.status(404).json({ error: 'Kode tidak ditemukan atau sudah kedaluwarsa.' });
  if (invite.user_id === req.userId) {
    return res.status(400).json({ error: 'Kamu tidak bisa memasangkan dengan dirimu sendiri.' });
  }

  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const partner = db.prepare('SELECT * FROM users WHERE id = ?').get(invite.user_id);

  if (!partner) return res.status(404).json({ error: 'Pengguna pembuat kode tidak ditemukan.' });
  if (me.partner_id || partner.partner_id) {
    return res.status(400).json({ error: 'Salah satu akun sudah terhubung dengan pasangan lain.' });
  }

  // Persetujuan dua arah terjadi di sini: A membuat kode, B memasukkannya secara sadar
  db.prepare('UPDATE users SET partner_id = ? WHERE id = ?').run(partner.id, me.id);
  db.prepare('UPDATE users SET partner_id = ? WHERE id = ?').run(me.id, partner.id);
  db.prepare('DELETE FROM invites WHERE code = ?').run(code.toUpperCase().trim());

  res.json({ ok: true, partnerName: partner.name });
});

// ---------- Putuskan hubungan pasangan ----------
router.post('/unpair', requireAuth, (req, res) => {
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!me.partner_id) return res.status(400).json({ error: 'Kamu belum terhubung dengan siapa pun.' });

  db.prepare('UPDATE users SET partner_id = NULL WHERE id = ?').run(me.id);
  db.prepare('UPDATE users SET partner_id = NULL WHERE id = ?').run(me.partner_id);

  res.json({ ok: true });
});

module.exports = router;
