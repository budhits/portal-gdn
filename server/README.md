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

## Endpoint (sejauh ini)

| Method | Path | Keterangan |
|--------|------|------------|
| GET | `/api/health` | Cek server hidup |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Butuh header `Authorization: Bearer <token>` |
