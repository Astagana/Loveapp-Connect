require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const serverless = require("serverless-http");

const authRoutes = require('./routes/auth');
const pairRoutes = require('./routes/pair');
const locationRoutes = require('./routes/location');
const photoRoutes = require('./routes/photos');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 3000;

// Diperlukan agar cookie "secure" & IP terdeteksi benar di belakang reverse proxy (Render/Railway/Fly.io/dll)
app.set('trust proxy', 1);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/pair', pairRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/photos', photoRoutes);
app.use('/api/messages', messageRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Semua rute lain -> kirim SPA (routing sisi klien)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Penanganan error terpusat
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server.' });
});

app.listen(PORT, () => {
  console.log(`💖 LoveConnect berjalan di http://localhost:${PORT}`);
});

module.exports.handler = serverless(app)
