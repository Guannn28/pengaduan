# Deploy Uji Coba

Setelan yang paling disarankan untuk project ini:

- `client/` deploy ke Vercel
- `backend/` deploy ke Railway

Dengan pola ini frontend dan backend benar-benar terpisah, jadi lebih gampang dites dan diubah env-nya.

## 1. Backend ke Railway

Saat membuat service baru di Railway:

- pilih repository ini
- set `Root Directory` ke `backend`
- Railway akan membaca [backend/railway.json](/D:/Matkul/skirpsi/Gua_Kaduin_Lu%20-%20Copy/backend/railway.json:1)

Environment variables yang wajib di Railway:

- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `CLIENT_ORIGIN`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PORT` tidak perlu diisi manual, Railway akan inject sendiri

Contoh `CLIENT_ORIGIN`:

```env
http://localhost:5173,https://nama-project.vercel.app,https://nama-project-*.vercel.app
```

Catatan:

- wildcard `*` sekarang didukung untuk CORS, jadi preview deployment Vercel lebih gampang dites
- `UPLOADS_DIR` opsional
- default backend menyimpan upload ke folder lokal `uploads/`
- untuk uji coba itu cukup, tapi di Railway file upload bersifat ephemeral kalau belum pakai volume/object storage

Healthcheck backend:

- `/api/health`

Setelah deploy berhasil, simpan URL backend Railway, misalnya:

```txt
https://nama-backend-production.up.railway.app
```

## 2. Frontend ke Vercel

Saat import project ke Vercel:

- pilih repository ini
- set `Root Directory` ke `client`
- Vercel akan membaca [client/vercel.json](/D:/Matkul/skirpsi/Gua_Kaduin_Lu%20-%20Copy/client/vercel.json:1)

Environment variable yang wajib di Vercel:

```env
VITE_API_URL=https://nama-backend-production.up.railway.app
```

Referensi template env frontend ada di [client/.env.example](/D:/Matkul/skirpsi/Gua_Kaduin_Lu%20-%20Copy/client/.env.example:1).

Setelah env disimpan:

- redeploy frontend
- buka hasil deploy Vercel
- login admin memakai `ADMIN_EMAIL` dan `ADMIN_PASSWORD` yang sama seperti di Railway

## 3. Template Env

Template yang sudah saya siapkan:

- root: [.env.example](/D:/Matkul/skirpsi/Gua_Kaduin_Lu%20-%20Copy/.env.example:1)
- backend: [backend/.env.example](/D:/Matkul/skirpsi/Gua_Kaduin_Lu%20-%20Copy/backend/.env.example:1)
- frontend: [client/.env.example](/D:/Matkul/skirpsi/Gua_Kaduin_Lu%20-%20Copy/client/.env.example:1)

## 4. Alur Paling Cepat

1. Deploy `backend/` ke Railway.
2. Copy domain Railway yang jadi.
3. Set `VITE_API_URL` di Vercel pakai domain Railway itu.
4. Deploy `client/` ke Vercel.
5. Tambahkan domain Vercel ke `CLIENT_ORIGIN` di Railway kalau belum sesuai.

## 5. Catatan Penting

- Kalau frontend Vercel sukses kebuka tapi request API gagal, hampir pasti masalahnya ada di `CLIENT_ORIGIN` atau `VITE_API_URL`
- Kalau upload bukti hilang setelah restart/redeploy Railway, itu normal untuk filesystem sementara
- Untuk tahap uji coba, setup sekarang sudah cukup aman dan paling ringan dijalankan
