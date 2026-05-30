# Portal GDN — Sistem Planning & Monitoring Bisnis

Aplikasi web monitoring KPI, margin, dan project lintas unit bisnis
(Gerbang Digital Nusantara). **Frontend + Backend + Database** yang berfungsi penuh.

- **Frontend:** React + Vite (`src/`)
- **Backend:** Node.js + Express (`server/`)
- **Database:** PostgreSQL (`server/db/schema.sql`)
- **Auth:** login email + password (JWT)

Peran: **Owner, Finance, HR, Leader, PIC** — dengan hak akses berbeda.
Fitur inti: dashboard skor & margin per unit (dihitung otomatis dari KPI),
alur KPI (ajukan → approve → closing), kelola user & sub-unit, dan
project dengan milestone & expense.

## Menjalankan di lokal

Prasyarat: **Node.js 18+** dan **PostgreSQL**.

```bash
# 1. Backend
cd server
npm install
cp .env.example .env          # set DATABASE_URL ke PostgreSQL Anda
npm run db:reset              # buat tabel + isi data contoh
npm run dev                  # API di http://localhost:4000

# 2. Frontend (terminal lain, dari root repo)
npm install
npm run dev                  # buka http://localhost:5173
```

Login contoh (password = `<id>123`):

| Peran | Email | Password |
|-------|-------|----------|
| Owner | budhi@email.com | budhi123 |
| Leader | satya@email.com | satya123 |
| PIC | rafli@email.com | rafli123 |

> Saat dev, frontend (5173) otomatis mem-proxy `/api` ke backend (4000).

## Deploy online

Lihat **[DEPLOY.md](./DEPLOY.md)** — panduan lengkap (Render/Railway). Saat
produksi, server Express menyajikan frontend hasil build sekaligus API dalam
satu layanan.

## Struktur

```
portal-gdn/
├── src/              # Frontend React (App.jsx + api/)
├── server/           # Backend Express
│   ├── db/           # schema.sql, seed, migrasi
│   └── src/          # app, routes, lib (scoring engine), middleware
├── render.yaml       # Blueprint deploy Render
└── DEPLOY.md         # Panduan deploy
```

## Pengujian

```bash
cd server && npm test      # test regresi scoring engine
```
