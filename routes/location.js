const express = require('express');
const db = require('../db/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ---------- Nyalakan/matikan izin berbagi lokasi ----------
router.post('/consent', requireAuth, (req, res) => {
  const { enabled } = req.body;
  db.prepare('UPDATE users SET share_location = ? WHERE id = ?').run(enabled ? 1 : 0, req.userId);
  res.json({ ok: true, share_location: !!enabled });
});

// ---------- Kirim update lokasi saat ini ----------
router.post('/update', requireAuth, (req, res) => {
  const { lat, lng } = req.body;
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

  if (!me.share_location) {
    return res.status(403).json({ error: 'Aktifkan izin berbagi lokasi terlebih dahulu.' });
  }
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Koordinat lokasi tidak valid.' });
  }

  const existing = db.prepare('SELECT user_id FROM locations WHERE user_id = ?').get(req.userId);
  if (existing) {
    db.prepare('UPDATE locations SET lat = ?, lng = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
      .run(lat, lng, req.userId);
  } else {
    db.prepare('INSERT INTO locations (user_id, lat, lng) VALUES (?, ?, ?)').run(req.userId, lat, lng);
  }

  res.json({ ok: true });
});

// ---------- Ambil lokasi saya & pasangan (hanya jika KEDUANYA setuju) ----------
router.get('/status', requireAuth, (req, res) => {
  const me = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);
  if (!me.partner_id) {
    return res.json({ paired: false });
  }

  const partner = db.prepare('SELECT * FROM users WHERE id = ?').get(me.partner_id);
  const mutualConsent = !!me.share_location && !!partner.share_location;

  const myLoc = db.prepare('SELECT lat, lng, updated_at FROM locations WHERE user_id = ?').get(me.id);

  let response = {
    paired: true,
    myShareEnabled: !!me.share_location,
    partnerShareEnabled: !!partner.share_location,
    mutualConsent,
    myLocation: myLoc || null,
    partnerLocation: null,
    distanceKm: null
  };

  if (mutualConsent) {
    const partnerLoc = db.prepare('SELECT lat, lng, updated_at FROM locations WHERE user_id = ?').get(partner.id);
    response.partnerLocation = partnerLoc || null;

    if (myLoc && partnerLoc) {
      response.distanceKm = haversineKm(myLoc.lat, myLoc.lng, partnerLoc.lat, partnerLoc.lng);
    }
  }

  res.json(response);
});

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

module.exports = router;
