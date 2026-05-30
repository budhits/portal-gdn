# Arsip Portal GDN — 2026-05-30

Snapshot **script + database** sebelum data trial dikosongkan.

## Isi
- `portal-gdn-demo-full.sql` — dump LENGKAP database (skema + semua data demo:
  user, unit, sub-unit, project, KPI, margin, template, audit). Bisa dipulihkan
  penuh kapan saja.
- `scripts/` — salinan skrip database saat arsip dibuat:
  - `schema.sql` — definisi tabel
  - `seed-data.js` / `seed.js` — data & pengisi awal
  - `run-schema.js` — penerap skema

## Cara MEMULIHKAN seluruh data demo (jika perlu)
Pada database PostgreSQL kosong:
```bash
psql "<DATABASE_URL>" < portal-gdn-demo-full.sql
```
Atau pakai skrip aplikasi: `npm --prefix server run db:reset` (skema + seed ulang).

## Catatan
- Setelah arsip ini dibuat, data **Project, KPI, dan Margin** dikosongkan dari
  database produksi agar bisa dipakai trial. Data **User, Unit, Sub-unit, Template,
  dan Audit Log tetap ada**.
- Margin adalah turunan dari KPI submission, sehingga mengosongkan KPI otomatis
  mengosongkan margin.
