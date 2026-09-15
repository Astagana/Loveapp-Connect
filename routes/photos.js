const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${Date.now()}_${unique}${ext}`);
  }
});

function fileFilter(req, file, cb) {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Format file harus berupa gambar (jpg, png, webp, gif).'));
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
});

// ---------- Unggah foto (dari kamera langsung atau galeri) ----------
router.post('/', requireAuth, (req, res) => {
  upload.single('photo')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Tidak ada file foto yang dikirim.' });

    const caption = (req.body.caption || '').slice(0, 300);
    const info = db.prepare(
      'INSERT INTO photos (user_id, filename, caption) VALUES (?, ?, ?)'
    ).run(req.userId, req.file.filename, caption);

    const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(info.lastInsertRowid);
    res.json({ photo });
  });
});

// ---------- Ambil galeri foto berdua ----------
router.get('/', requireAuth, (req, res) => {
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  const ids = me.partner_id ? [me.id, me.partner_id] : [me.id];

  const placeholders = ids.map(() => '?').join(',');
  const photos = db.prepare(
    `SELECT photos.*, users.name AS uploader_name, users.avatar_emoji AS uploader_avatar
     FROM photos JOIN users ON users.id = photos.user_id
     WHERE photos.user_id IN (${placeholders})
     ORDER BY photos.created_at DESC`
  ).all(...ids);

  res.json({ photos });
});

// ---------- Hapus foto (hanya pemilik) ----------
router.delete('/:id', requireAuth, (req, res) => {
  const photo = db.prepare('SELECT * FROM photos WHERE id = ?').get(req.params.id);
  if (!photo) return res.status(404).json({ error: 'Foto tidak ditemukan.' });
  if (photo.user_id !== req.userId) return res.status(403).json({ error: 'Kamu hanya bisa menghapus fotomu sendiri.' });

  const filePath = path.join(UPLOAD_DIR, photo.filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  db.prepare('DELETE FROM photos WHERE id = ?').run(req.params.id);

  res.json({ ok: true });
});

module.exports = router;
