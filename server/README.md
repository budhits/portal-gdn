# Portal GDN — Backend API

Backend Express + PostgreSQL untuk Portal GDN.

## Setup

```bash
cd server
npm install
cp .env.example .env      # lalu sesuaikan DATABASE_URL & JWT_SECRET
npm run db:reset          # terapkan skema + isi data demo
npm run dev               # jalankan server (http://localhost:4000)
```

## Script

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan server dengan auto-reload |
| `npm start` | Jalankan server |
| `npm run db:schema` | Terapkan `db/schema.sql` |
| `npm run db:seed` | Isi data demo dari `db/seed-data.js` |
| `npm run db:reset` | Skema + seed sekaligus |

## Login demo

Password mengikuti pola `<id>123`.

| Peran | Email | Password |
|-------|-------|----------|
| Owner | budhi@email.com | budhi123 |
| Finance | lovia@email.com | lovia123 |
| HR | didi@email.com | didi123 |
| Leader | satya@email.com | satya123 |
| PIC | rafli@email.com | rafli123 |

## Endpoint

Semua rute (kecuali `/api/health` & `/api/auth/login`) butuh header
`Authorization: Bearer <token>`.

| Method | Path | Akses | Keterangan |
|--------|------|-------|------------|
| GET | `/api/health` | publik | Cek server hidup |
| POST | `/api/auth/login` | publik | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | login | Profil user saat ini |
| GET | `/api/users` | login | Daftar user (filter `?role=&unitId=`) |
| POST | `/api/users` | owner | Tambah user |
| PATCH | `/api/users/:id` | owner | Ubah data/role/password |
| DELETE | `/api/users/:id` | owner | Hapus user |
| GET | `/api/units` · `/api/units/:id` | login | Unit (+ sub-unit pada detail) |
| GET | `/api/sub-units` | login | Sub-unit (filter `?unitId=`) |
| POST/PATCH/DELETE | `/api/sub-units/:id` | owner/leader | Kelola sub-unit |
| GET | `/api/projects` | login | Project (filter `?unitId=`) |
| POST/PATCH/DELETE | `/api/projects/:id` | owner/leader | Kelola project |
| GET | `/api/templates` · `/api/templates/:id` | login | Template KPI + field |
| GET | `/api/submissions` · `/api/submissions/:id` | login | KPI submission + skor/margin turunan |
| GET | `/api/audit` | login | Audit log (filter `?unitId=&limit=`) |
| GET | `/api/dashboard/periods` | login | Daftar periode |
| GET | `/api/dashboard?period=2026-05` | login | Ringkasan skor & margin per unit |

## Scoring Engine

Skor & margin sub-unit **diturunkan** dari `kpi_submissions` (bukan disimpan
terpisah) oleh `src/lib/scoring.js` — port langsung dari engine di `src/App.jsx`.
Test regresi: `npm test`.
