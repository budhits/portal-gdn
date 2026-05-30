# Arsitektur Portal GDN

Dokumen ini menjelaskan struktur kode, alur data, dan konvensi proyek agar tim
IT cepat memahami sistem. Ditujukan untuk developer yang baru bergabung.

---

## 1. Gambaran Umum

Portal GDN adalah aplikasi web **monitoring KPI, margin, dan project** lintas
unit bisnis. Terdiri dari 3 lapis:

```
  Browser (React SPA)  ──HTTP/JSON──►  Backend (Express API)  ──SQL──►  PostgreSQL
       src/                                 server/src/                  server/db/
```

- **Frontend:** React + Vite (Single Page App)
- **Backend:** Node.js + Express (REST API, autentikasi JWT)
- **Database:** PostgreSQL
- **Deploy:** satu layanan (Express menyajikan hasil build frontend + API `/api`)

Detail deploy ada di [`DEPLOY.md`](./DEPLOY.md).

---

## 2. Peran Pengguna (Role)

| Role | Akses ringkas |
|------|---------------|
| **admin** (Administrator) | Akses penuh seluruh fitur (superset Owner) |
| **owner** | Dashboard semua unit, approval KPI/Project, Admin Panel penuh |
| **finance** | Dashboard, Project, Margin, KPI (read-oriented) |
| **hr** | Seperti Finance + Admin Panel (Unit/Sub-unit/User Manager), **tanpa** Form Library |
| **leader** | Workspace unitnya, approval KPI/Project di unitnya |
| **pic** | Workspace sub-unitnya, mengajukan & meng-update KPI |

Aturan izin ditegakkan di **dua lapis**: frontend (sembunyikan menu) dan backend
(`requireRole`, `canApprove`, `canEditProject`) — backend adalah otoritas final.

---

## 3. Struktur Frontend (`src/`)

| File / folder | Isi |
|---|---|
| `main.jsx` | Titik masuk React (mount `<App/>`) |
| `App.jsx` | Aplikasi utama: state global, router antar-halaman, & seluruh komponen halaman |
| `constants.js` | Konstanta global: `ROLES`, `COLORS`, `FONTS`, `APP_CONFIG`, threshold |
| `assets/logo.js` | Logo brand GDN (data URI base64) |
| `utils/format.js` | Utility **murni**: format rupiah/tanggal, status skor, formula, dll. |
| `components/ui.jsx` | UI primitives: `Icon`, `Card`, `Button`, `Pill`, `ProgressBar`, dll. |
| `api/client.js` | Pembungkus `fetch` + penyimpanan token/sesi (localStorage) |
| `api/auth.js` | Login (email & Google), profil, ubah password, konfigurasi |
| `api/data.js` | Semua pemanggilan API domain (units, users, KPI, project, dst.) |

### Catatan tentang `App.jsx`
File ini masih besar (±11.500 baris) dan berisi banyak komponen halaman. Untuk
navigasi cepat, gunakan **penanda bagian** di komentar:

```
§1 Constants   §4 Utility      §7 Navigation   §10 Leader Pages
§2 Types       §5 UI Primitives §8 Owner Pages   §11 PIC Pages
§3 Mock Data   §6 Auth Layer    §9 Admin Pages   §12 App Router / Main
```

> Konstanta, utility murni, dan UI primitives sudah dipisah ke file sendiri
> (`constants.js`, `utils/format.js`, `components/ui.jsx`). Komponen halaman
> masih di `App.jsx` karena saling berbagi banyak state — dapat dipecah lebih
> lanjut secara bertahap bila diperlukan.

### State global (in-session)
`DataStoreProvider` (React Context) menyimpan data domain yang dimuat dari API
setelah login: `submissions`, `subUnits`, `projects`, `templates`, `milestones`,
`expenses`, `audit`, `subUnitWeights`. Binding modul `LIVE`, `UNITS`, `USERS`
disinkronkan agar helper non-React tetap membaca data terbaru.

---

## 4. Struktur Backend (`server/src/`)

```
index.js          Titik masuk: muat env, bootstrap DB, listen
app.js            Konfigurasi Express: CORS, /api/health, /api/config, daftar route,
                  penyajian frontend (dist) di produksi, error handler
bootstrap.js      Inisialisasi DB otomatis saat start (skema + seed bila kosong) &
                  migrasi idempoten (kolom/enum baru, set admin, dll.)
db.js             Koneksi PostgreSQL (pool) + helper query & withTransaction

routes/           Satu file per domain (endpoint REST):
  auth.js           login email/Google, /me, change-password
  users.js          CRUD user            units.js        CRUD unit
  subUnits.js       CRUD sub-unit        templates.js    CRUD form template
  projects.js       CRUD project         submissions.js  alur KPI (ajukan/approve/close/update)
  milestones.js     CRUD milestone       expenses.js     tambah expense
  dashboard.js      ringkasan            audit.js        baca audit log

lib/              Logika & helper bersama:
  scoring.js        engine skor KPI (dari kpi_submissions)
  dashboard.js      agregasi dashboard   repository.js   query terpusat + enrich
  serializers.js    baris DB (snake_case) -> bentuk API (camelCase)
  auth.js           JWT sign/verify, bcrypt   audit.js   tulis audit log
  formulas.js       library formula       projects.js   stats project + canEditProject

middleware/
  authenticate.js   verifikasi JWT (`authenticate`) + `requireRole(...)`
```

---

## 5. Database (`server/db/`)

- `schema.sql` — definisi 10 tabel + enum (dipakai `db:schema` / bootstrap)
- `seed-data.js` + `seed.js` — data awal (demo) & pengisi idempoten
- `run-schema.js` — penerap skema
- `clear-trial.js` — kosongkan Project/KPI/Margin (sisakan master data)

**Tabel inti:**
`users`, `units`, `sub_units`, `projects`, `milestones`, `expenses`,
`form_templates`, `form_fields`, `kpi_submissions`, `audit_log`.

> **Margin & skor tidak disimpan sebagai kolom** — dihitung (derive) dari
> `kpi_submissions` oleh scoring engine (`lib/scoring.js`). Target = estimasi,
> realisasi = nilai saat closing.

---

## 6. Alur Data Penting

### Login
```
LoginScreen → api/auth.login()/loginWithGoogle()
  → POST /api/auth/login | /api/auth/google
  → backend verifikasi (password / token Google) → terbitkan JWT
  → frontend simpan token → loadAllData() (muat semua data) → masuk dashboard
```
Login Google hanya menerima email yang **sudah terdaftar** di tabel `users`.

### Alur KPI (inti bisnis)
```
PIC ajukan (estimated) → Owner/Leader set bobot & approve (approved)
  → PIC/Owner update realisasi sepanjang periode
  → closing (closed) → skor & margin final dihitung
```
Setiap aksi tercatat di `audit_log` dan tampil di menu **Audit**.

### Approval di Inbox
- **KPI** berstatus `estimated` → muncul di Inbox (Owner/Admin: semua; Leader: unitnya)
- **Project** berstatus `pending_approval` → muncul di Inbox dengan tombol Setujui/Tolak

---

## 7. Konvensi

- **Bahasa komentar:** Indonesia, deskriptif & ringkas.
- **Penamaan:** `camelCase` di JS/API, `snake_case` di kolom DB; konversi via
  `lib/serializers.js`.
- **Keamanan:** password di-hash bcrypt; izin selalu dicek ulang di backend.
- **Idempoten:** bootstrap & migrasi aman dijalankan berulang (penting untuk
  free-tier yang sering restart).

---

## 8. Menjalankan Lokal

```bash
# Backend
cd server && npm install && cp .env.example .env   # set DATABASE_URL
npm run db:reset        # buat skema + data demo
npm run dev             # API di http://localhost:4000

# Frontend (terminal lain, dari root)
npm install && npm run dev   # http://localhost:5173 (proxy /api ke backend)
```

Lihat [`README.md`](./README.md) untuk ringkasan & kredensial demo,
[`DEPLOY.md`](./DEPLOY.md) untuk deploy produksi.
