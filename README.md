# Aplikasi Pengaduan Siswa

Project ini adalah web app buat nampung keluhan dan masukan dari siswa ke pihak sekolah. Dibuat pakai MERN stack (MongoDB, Express, React, Node.js). 

Tujuannya simpel: biar siswa gampang kalau mau lapor sesuatu, dan admin (pihak sekolah) bisa lebih rapi nge-track laporan mana aja yang udah diurus atau masih nunggu.

## Fitur

**Siswa:**
- Request bikin akun ke admin.
- Bikin laporan/pengaduan (bisa sekalian upload foto bukti).
- Pantau status laporan (Masih Nunggu, Diproses, atau Selesai).
- Tanya-tanya ke Chatbot asisten buat bantuan awal.

**Admin:**
- Dashboard buat lihat rekap jumlah pengaduan dan statusnya.
- Approve atau tolak request pembuatan akun dari siswa.
- Baca detail keluhan, lihat file lampiran, dan update status penanganan.

## Tech Stack

- **Frontend:** React.js (Vite), Axios.
- **Backend:** Node.js, Express.js.
- **Database:** MongoDB + Mongoose.
- **Auth:** JWT (JSON Web Token).
- **Storage:** Local file system buat nyimpen file upload.

## Struktur Folder

```text
pengaduan/
├── backend/                 # API dan logika server
│   ├── config/              # Setup database & env
│   ├── controllers/         # Logika utama (Auth, Pengaduan, dll)
│   ├── models/              # Skema database Mongoose
│   ├── routes/              # Endpoint API
│   └── utils/               # Fungsi tambahan & middleware upload
│
└── client/                  # Frontend (React)
    ├── public/              # Static assets
    └── src/
        ├── components/      # UI components (Admin, Student, dll)
        ├── context/         # Global state (Toast, dll)
        └── pages/           # Halaman utama (AdminPage, StudentPage)
```

## Cara Jalankan di Local

Pastikan udah install **Node.js** dan **MongoDB**.

**1. Clone Repo**
```bash
git clone <url-repo>
cd pengaduan
```

**2. Setup Backend**
Buka terminal, masuk ke folder `backend`:
```bash
cd backend
npm install
```
Bikin file `.env` di folder `backend`, isinya sesuaikan sama local kamu:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/db_pengaduan
JWT_SECRET=bebas_isi_apa_aja
```
Jalankan server:
```bash
npm run dev
```

**3. Setup Frontend**
Buka terminal baru, masuk ke folder `client`:
```bash
cd client
npm install
```
Jalankan frontend:
```bash
npm run dev
```
Buka link yang muncul di terminal (biasanya `http://localhost:5173`).
