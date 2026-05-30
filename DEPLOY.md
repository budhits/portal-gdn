# Panduan Deploy Portal GDN

Aplikasi ini di-deploy sebagai **satu layanan**: server Express menyajikan
frontend (hasil build) **dan** API `/api` dari origin yang sama, ditambah satu
database **PostgreSQL**. Tidak perlu host frontend terpisah & tidak ada masalah CORS.

```
Pengunjung ─▶ [ Web Service: Express ]
                 ├─ /            → frontend (folder dist/)
                 └─ /api/...     → backend API
                         │
                         ▼
                 [ PostgreSQL managed ]
```

---

## Opsi A — Render (paling mudah, ada blueprint)

Repo sudah berisi `render.yaml`, jadi Render bisa membuat semuanya otomatis.

1. Push repo ke GitHub (branch yang ingin di-deploy).
2. Buka <https://dashboard.render.com> → **New** → **Blueprint**.
3. Pilih repo `portal-gdn`. Render membaca `render.yaml` dan menyiapkan:
   - **Web service** `portal-gdn` (Node)
   - **Database** `portal-gdn-db` (PostgreSQL)
   - Env vars otomatis: `DATABASE_URL`, `JWT_SECRET` (digenerate), `DATABASE_SSL=true`, `NODE_ENV=production`.
4. Klik **Apply** dan tunggu build selesai (~2–4 menit).
5. **Sekali saja — isi database:** buka tab **Shell** pada web service, jalankan:
   ```
   npm --prefix server run db:reset
   ```
   Ini membuat tabel + mengisi data awal (15 user, dst).
   > ⚠️ `db:reset` MENGHAPUS lalu mengisi ulang. Jalankan hanya saat awal /
   > saat memang ingin mereset data.
6. Buka URL yang diberikan Render (mis. `https://portal-gdn.onrender.com`).
   Login: `budhi@email.com` / `budhi123`.

---

## Opsi B — Railway

1. <https://railway.app> → **New Project** → **Deploy from GitHub repo**.
2. Tambahkan plugin **PostgreSQL** (Railway menyediakan `DATABASE_URL`).
3. Pada service, set **Variables**:
   - `NODE_ENV=production`
   - `DATABASE_SSL=true`
   - `JWT_SECRET=` (isi string acak panjang)
   - `DATABASE_URL=` (referensikan dari plugin Postgres)
4. Set **Build Command**: `npm install && npm run build && npm install --prefix server`
   dan **Start Command**: `node server/src/index.js`.
5. Setelah deploy, jalankan sekali (via Railway shell): `npm --prefix server run db:reset`.

---

## Variabel lingkungan (ringkasan)

| Variabel | Wajib | Keterangan |
|----------|:-----:|------------|
| `DATABASE_URL` | ✅ | String koneksi PostgreSQL |
| `JWT_SECRET` | ✅ | String acak panjang untuk menandatangani token |
| `DATABASE_SSL` | ✅ (managed) | `true` di hosting managed; `false` di lokal |
| `NODE_ENV` | ✅ | `production` saat deploy |
| `PORT` | — | Biasanya diisi otomatis oleh hosting |
| `JWT_EXPIRES_IN` | — | Default `7d` |

## Catatan keamanan untuk produksi

- **Ganti password demo.** Data awal memakai pola `<id>123`. Setelah deploy,
  login sebagai Owner lalu ubah password di **Admin → User Manager**.
- `JWT_SECRET` harus rahasia & acak (Render meng-generate otomatis).
- Pertimbangkan paket berbayar bila butuh uptime tanpa "sleep" (free tier
  Render/Railway bisa tidur saat idle).

## Menjalankan lokal (mode produksi) untuk uji coba

```
npm run build:all                     # install + build frontend + install server
cd server && cp .env.example .env     # set DATABASE_URL lokal, DATABASE_SSL=false, NODE_ENV=production
npm run db:reset                      # buat tabel + data awal
cd .. && npm start                    # buka http://localhost:4000
```
