# 💖 LoveConnect

Aplikasi web untuk pasangan: lacak lokasi dengan persetujuan kedua belah pihak, kirim foto (jepret langsung atau dari galeri), catatan cinta, penghitung hari bersama, dan lainnya — dengan tema romantis dan animasi.

## ✨ Fitur

- **Akun pengguna**: daftar & masuk dengan email + kata sandi (kata sandi di-hash dengan bcrypt, sesi memakai JWT di cookie httpOnly).
- **Pemasangan pasangan dengan persetujuan dua arah**: satu pihak membuat kode undangan, pihak lain memasukkan kode tersebut untuk terhubung. Tidak ada pelacakan tanpa langkah eksplisit dari kedua akun.
- **Lacak lokasi dengan izin ganda**: lokasi pasangan hanya terlihat jika **kedua** pengguna menyalakan sakelar "Bagikan lokasiku". Peta interaktif (Leaflet + OpenStreetMap, gratis, tanpa API key) menampilkan kedua pin dan jarak antara kalian.
- **Berbagi foto**: unggah foto langsung dari kamera perangkat atau pilih dari galeri, lengkap dengan caption.
- **Catatan cinta**: kirim pesan bebas atau tombol cepat "Kangen", "Cinta", "Selamat Pagi", "Selamat Malam".
- **Penghitung hari bersama**, status mood, avatar emoji yang bisa dipilih.
- **Tema romantis beranimasi**: hati-hati mengambang di latar belakang, gradasi pink-ungu, transisi halus di setiap halaman.
- **Data tersimpan permanen** di database SQLite lokal (file `.db`), tetap ada setiap kali server dinyalakan ulang (selama disk tempat file `.db` disimpan bersifat persisten — lihat catatan deployment di bawah).

## 🛠️ Instalasi Lokal

Pastikan [Node.js](https://nodejs.org) versi 18 ke atas sudah terpasang.

```bash
# 1. Masuk ke folder proyek
cd couple-app

# 2. Install semua dependency
npm install

# 3. Siapkan file environment
cp .env.example .env
# Buka .env dan ganti JWT_SECRET dengan string acak yang panjang & rahasia

# 4. Jalankan server
npm start
```

Buka `http://localhost:3000` di browser. Buat dua akun berbeda (misalnya di dua browser/perangkat berbeda) untuk mencoba fitur pemasangan pasangan.

## 📦 Struktur Proyek

```
couple-app/
├── server.js              # Entry point Express
├── package.json
├── .env.example
├── db/
│   └── database.js        # Skema & koneksi SQLite (better-sqlite3)
├── middleware/
│   └── auth.js             # Verifikasi JWT
├── routes/
│   ├── auth.js              # Daftar, masuk, keluar, profil
│   ├── pair.js               # Kode undangan & pemasangan pasangan
│   ├── location.js           # Izin & update lokasi, status peta
│   ├── photos.js             # Unggah & galeri foto
│   └── messages.js           # Catatan cinta
└── public/
    ├── index.html             # SPA shell + semua template halaman
    ├── css/style.css           # Tema romantis + animasi
    ├── js/
    │   ├── hearts.js            # Animasi hati mengambang
    │   ├── core.js               # State, helper API, toast
    │   ├── auth.js                # Halaman masuk/daftar
    │   ├── dashboard.js           # Halaman beranda + pemasangan
    │   ├── map.js                  # Halaman peta (Leaflet)
    │   ├── gallery.js               # Halaman galeri foto
    │   ├── notes.js                  # Halaman catatan cinta
    │   ├── profile.js                # Halaman profil
    │   └── app.js                     # Router utama
    └── uploads/                       # Foto yang diunggah pengguna
```

## 🚀 Deploy ke Internet

Aplikasi ini adalah aplikasi Node.js standar (Express) dan bisa dideploy ke banyak platform. Beberapa opsi populer yang punya paket gratis/murah:

### Opsi A — Render.com
1. Push folder ini ke repository GitHub.
2. Di Render, buat **Web Service** baru dari repo tersebut.
3. Build command: `npm install`. Start command: `npm start`.
4. Tambahkan environment variable `JWT_SECRET` (string acak panjang) di dashboard Render.
5. **Penting**: agar database SQLite tidak hilang saat redeploy, tambahkan **Persistent Disk** di Render dan arahkan `DB_FILE`/folder `public/uploads` ke disk tersebut (atau lihat Opsi C di bawah).

### Opsi B — Railway.app / Fly.io
Sama seperti Render: keduanya mendukung Node.js dan **volume/disk persisten** yang perlu diaktifkan agar file `.db` dan folder `public/uploads` tidak terhapus setiap deploy ulang.

### Opsi C — Untuk produksi jangka panjang (disarankan)
Disk pada banyak platform *hosting* gratis bersifat **sementara** (ephemeral) — datanya bisa hilang saat container di-restart. Untuk keandalan penuh saat sudah banyak digunakan:
- Ganti database ke **PostgreSQL** terkelola (mis. Supabase, Neon, atau Railway Postgres) — cukup ganti driver di `db/database.js`.
- Simpan foto di layanan **object storage** seperti Cloudflare R2, AWS S3, atau Supabase Storage, bukan folder lokal `public/uploads`.

Untuk skala kecil/berdua saja, memakai platform dengan disk persisten (Render Persistent Disk / Fly.io Volume) sudah cukup dan lebih sederhana.

## 🔒 Tentang Privasi & Persetujuan

- Lokasi tidak pernah dibagikan sepihak. Fitur peta baru aktif menampilkan pin pasangan ketika **kedua** akun sama-sama menyalakan sakelar berbagi lokasi.
- Pemasangan akun (pairing) memerlukan aksi eksplisit dari dua pihak: satu membuat kode, satu lagi memasukkannya.
- Kedua pihak bisa memutuskan hubungan (`unpair`) atau mematikan berbagi lokasi kapan saja dari halaman Profil/Peta.

## 🧩 Kustomisasi Lanjutan

- Warna tema ada di variabel CSS bagian atas `public/css/style.css` (`:root { --pink-500: ...; }`).
- Tambahkan jenis pesan cepat baru di `routes/messages.js` (objek `defaults`) dan tombolnya di template `#tpl-notes` / `#tpl-dashboard` pada `index.html`.
- Untuk mengganti peta dari OpenStreetMap ke penyedia lain, ubah URL tile di `public/js/map.js`.

Selamat mencoba, semoga LoveConnect mempererat hubungan kalian berdua! 💞
