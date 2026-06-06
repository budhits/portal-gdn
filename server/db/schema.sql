-- ════════════════════════════════════════════════════════════════════════════
-- Portal GDN — Database Schema (PostgreSQL)
-- Gerbang Digital Nusantara — Sistem Planning & Monitoring Bisnis
--
-- Diturunkan dari model data di src/App.jsx (§2 Type Definitions, §3 Mock Data).
--
-- Catatan desain:
--   • KPI_SNAPSHOTS & MARGIN_ENTRIES TIDAK dibuatkan tabel — di aplikasi keduanya
--     sudah deprecated; skor & margin DIHITUNG dari kpi_submissions oleh Scoring
--     Engine di backend.
--   • Formula Library tetap di kode backend (punya fungsi compute), bukan tabel.
--   • Nilai/bobot KPI yang dinamis (per-field) disimpan sebagai JSONB.
-- ════════════════════════════════════════════════════════════════════════════

-- Idempotent: jalankan ulang aman saat development.
DROP TABLE IF EXISTS audit_log       CASCADE;
DROP TABLE IF EXISTS kpi_submissions CASCADE;
DROP TABLE IF EXISTS form_fields     CASCADE;
DROP TABLE IF EXISTS form_templates  CASCADE;
DROP TABLE IF EXISTS expenses        CASCADE;
DROP TABLE IF EXISTS milestones      CASCADE;
DROP TABLE IF EXISTS projects        CASCADE;
DROP TABLE IF EXISTS sub_units        CASCADE;
DROP TABLE IF EXISTS units           CASCADE;
DROP TABLE IF EXISTS users           CASCADE;

DROP TYPE IF EXISTS user_role          CASCADE;
DROP TYPE IF EXISTS sub_unit_status     CASCADE;
DROP TYPE IF EXISTS project_status      CASCADE;
DROP TYPE IF EXISTS template_frequency  CASCADE;
DROP TYPE IF EXISTS field_type          CASCADE;
DROP TYPE IF EXISTS submission_status    CASCADE;
DROP TYPE IF EXISTS audit_action        CASCADE;

-- ── Enums ───────────────────────────────────────────────────────────────────
CREATE TYPE user_role         AS ENUM ('admin', 'owner', 'finance', 'hr', 'leader', 'pic');
CREATE TYPE sub_unit_status   AS ENUM ('active', 'inactive');
CREATE TYPE project_status     AS ENUM ('on_track', 'at_risk', 'behind', 'done', 'pending_approval');
CREATE TYPE template_frequency AS ENUM ('monthly', 'cycle', 'event');
CREATE TYPE field_type         AS ENUM ('number', 'text', 'date', 'auto');
CREATE TYPE submission_status  AS ENUM ('estimated', 'approved', 'closed', 'rejected');
CREATE TYPE audit_action       AS ENUM ('create', 'update', 'approve', 'reject', 'close', 'delete');

-- ── users ───────────────────────────────────────────────────────────────────
-- Hierarki & akses. password_hash ditambahkan untuk auth (tidak ada di mock).
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT,                       -- diisi saat seed/registrasi
  role          user_role NOT NULL,
  avatar        TEXT NOT NULL DEFAULT '',
  unit_id       TEXT,                        -- FK ditambah setelah units dibuat
  sub_unit_id   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── units ───────────────────────────────────────────────────────────────────
CREATE TABLE units (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  leader_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
  color       TEXT NOT NULL DEFAULT '#6B6B76',
  color_dark  TEXT NOT NULL DEFAULT '#46464E',
  color_light TEXT NOT NULL DEFAULT '#F0F0F2',
  icon        TEXT NOT NULL DEFAULT 'cog',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── sub_units ────────────────────────────────────────────────────────────────
CREATE TABLE sub_units (
  id         TEXT PRIMARY KEY,
  unit_id    TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  pic_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  icon       TEXT NOT NULL DEFAULT 'cog',
  status     sub_unit_status NOT NULL DEFAULT 'active',
  weight     INTEGER,                    -- bobot sub-unit di unit (persisten; null = pakai bobot submission)
  created_at DATE NOT NULL DEFAULT CURRENT_DATE
);
CREATE INDEX idx_sub_units_unit ON sub_units(unit_id);

-- Lengkapi FK users -> units / sub_units (deferred karena saling rujuk).
ALTER TABLE users
  ADD CONSTRAINT fk_users_unit
    FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_users_sub_unit
    FOREIGN KEY (sub_unit_id) REFERENCES sub_units(id) ON DELETE SET NULL;

-- ── projects ─────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id               TEXT PRIMARY KEY,
  unit_id          TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  sub_unit_id      TEXT REFERENCES sub_units(id) ON DELETE SET NULL,
  name             TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  status           project_status NOT NULL DEFAULT 'on_track',
  milestones_total INTEGER NOT NULL DEFAULT 0,
  milestones_done  INTEGER NOT NULL DEFAULT 0,
  budget_planned   BIGINT NOT NULL DEFAULT 0,   -- Rupiah
  budget_spent     BIGINT NOT NULL DEFAULT 0,   -- Rupiah
  start_date       DATE,
  end_date         DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_projects_unit     ON projects(unit_id);
CREATE INDEX idx_projects_sub_unit ON projects(sub_unit_id);

-- ── milestones ───────────────────────────────────────────────────────────────
-- Tahapan sebuah project, masing-masing punya target tanggal & alokasi budget.
CREATE TABLE milestones (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  done             BOOLEAN NOT NULL DEFAULT false,
  date             DATE,                         -- target tanggal
  pic              TEXT NOT NULL DEFAULT '',
  budget_allocated BIGINT NOT NULL DEFAULT 0,    -- Rupiah
  sort_order       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_milestones_project ON milestones(project_id);

-- ── expenses ─────────────────────────────────────────────────────────────────
-- Realisasi pengeluaran project, opsional terkait sebuah milestone.
CREATE TABLE expenses (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id TEXT REFERENCES milestones(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  amount       BIGINT NOT NULL DEFAULT 0,        -- Rupiah
  date         DATE,
  has_receipt  BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_expenses_project   ON expenses(project_id);
CREATE INDEX idx_expenses_milestone ON expenses(milestone_id);

-- ── form_templates ───────────────────────────────────────────────────────────
-- Owner rancang sekali, dipakai banyak sub-unit.
CREATE TABLE form_templates (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  frequency   template_frequency NOT NULL DEFAULT 'monthly',
  created_at  DATE NOT NULL DEFAULT CURRENT_DATE
);

-- ── form_fields ──────────────────────────────────────────────────────────────
-- Field per template. field_key = id lokal di template (mis. "f1"), dipakai
-- sebagai kunci di estimated_values/actual_values/field_weights submission.
CREATE TABLE form_fields (
  id             BIGSERIAL PRIMARY KEY,
  template_id    TEXT NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  field_key      TEXT NOT NULL,             -- "f1", "f2", ...
  name           TEXT NOT NULL,             -- "SR", "FCR", "Margin"
  type           field_type NOT NULL DEFAULT 'number',
  satuan         TEXT NOT NULL DEFAULT '',
  source         TEXT NOT NULL DEFAULT 'Manual',  -- Manual|Pembukuan|Formula|...
  formula_id     TEXT,                      -- rujuk FORMULA_LIBRARY (di kode), null jika manual
  formula_expr   TEXT,                      -- ekspresi formula template buatan user (mis. "Omset - Total_Biaya")
  default_weight INTEGER NOT NULL DEFAULT 0,
  is_margin      BOOLEAN NOT NULL DEFAULT false,
  direction      TEXT NOT NULL DEFAULT 'higher_better',  -- 'higher_better' (Min/tinggi=baik) | 'lower_better' (Maks/rendah=baik)
  cap_pct        INTEGER NOT NULL DEFAULT 120,           -- batas atas pencapaian (%)
  floor_pct      INTEGER NOT NULL DEFAULT 0,             -- batas bawah pencapaian (%)
  sort_order     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (template_id, field_key)
);
CREATE INDEX idx_form_fields_template ON form_fields(template_id);

-- ── kpi_submissions ──────────────────────────────────────────────────────────
-- Instance pemakaian template oleh PIC/Leader. Nilai & bobot dinamis -> JSONB.
-- Siklus: estimated -> approved -> closed.
CREATE TABLE kpi_submissions (
  id               TEXT PRIMARY KEY,
  template_id      TEXT NOT NULL REFERENCES form_templates(id) ON DELETE RESTRICT,
  sub_unit_id      TEXT NOT NULL REFERENCES sub_units(id) ON DELETE CASCADE,
  unit_id          TEXT NOT NULL REFERENCES units(id) ON DELETE CASCADE,
  status           submission_status NOT NULL DEFAULT 'estimated',
  period           TEXT NOT NULL,                         -- "Mei 2026" / "Siklus Mei-Agu 2026"
  estimated_values JSONB NOT NULL DEFAULT '{}'::jsonb,    -- { fieldKey: number|string }
  actual_values    JSONB,                                 -- null sampai di-closing
  field_weights    JSONB NOT NULL DEFAULT '{}'::jsonb,    -- { fieldKey: weight }
  sub_unit_weight  INTEGER NOT NULL DEFAULT 0,            -- bobot sub-unit di unit
  created_by       TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
  approved_at      TIMESTAMPTZ,
  closed_at        TIMESTAMPTZ,
  closing_note     TEXT,
  daily_margin     JSONB                                  -- { "1": 1000000, "2": ... } input margin harian KPI bulanan
);
CREATE INDEX idx_submissions_sub_unit ON kpi_submissions(sub_unit_id);
CREATE INDEX idx_submissions_unit     ON kpi_submissions(unit_id);
CREATE INDEX idx_submissions_status   ON kpi_submissions(status);
CREATE INDEX idx_submissions_period   ON kpi_submissions(period);

-- ── audit_log ────────────────────────────────────────────────────────────────
-- Production: di-generate otomatis dari setiap mutation.
CREATE TABLE audit_log (
  id           BIGSERIAL PRIMARY KEY,
  ts           TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  action       audit_action NOT NULL,
  entity_type  TEXT NOT NULL,        -- kpi_submission|project|sub_unit|user|form_template|weight
  entity_id    TEXT NOT NULL,
  entity_label TEXT NOT NULL DEFAULT '',
  unit_id      TEXT,                 -- denormalized untuk filter cepat
  details      TEXT,
  diff         JSONB                 -- { before, after } untuk update
);
CREATE INDEX idx_audit_unit  ON audit_log(unit_id);
CREATE INDEX idx_audit_ts    ON audit_log(ts DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
