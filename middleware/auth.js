const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_ganti_ini';

function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies.token
    ? req.cookies.token
    : (req.headers.authorization || '').replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Belum login. Silakan masuk terlebih dahulu.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesi tidak valid atau sudah kedaluwarsa. Silakan masuk kembali.' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
