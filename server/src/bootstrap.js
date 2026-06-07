// Inisialisasi database otomatis saat aplikasi start (aman & idempoten).
//
// Berguna di hosting yang tak menyediakan akses shell (mis. Render free tier):
// alih-alih menjalankan `db:reset` manual, aplikasi menyiapkan databasenya
// sendiri saat pertama kali jalan.
//
// Aman: hanya menerapkan skema bila tabel belum ada, dan hanya mengisi data
// awal bila tabel users masih kosong. Jika sudah ada data, TIDAK menyentuh
// apa pun (tidak menghapus / menimpa). Diaktifkan via env AUTO_MIGRATE=true.

import bcrypt from "bcryptjs";
import { pool } from "./db.js";
import { applySchema } from "../db/run-schema.js";
import { seed } from "../db/seed.js";
import { clearTrialData } from "../db/clear-trial.js";

export async function bootstrapDatabase() {
  // Apakah tabel inti (users) sudah ada?
  const { rows } = await pool.query("SELECT to_regclass('public.users') AS reg");
  const tableExists = rows[0].reg !== null;

  if (!tableExists) {
    console.log("🔧 Tabel belum ada — menerapkan skema database...");
    await applySchema();
  }

  // Apakah sudah ada user? (kalau ada, jangan ganggu data yang ada)
  const { rows: c } = await pool.query("SELECT COUNT(*)::int AS n FROM users");
  if (c[0].n === 0) {
    console.log("🌱 Database kosong — mengisi data awal...");
    await seed();
    console.log("✅ Data awal selesai diisi.");
  } else {
    console.log(`✔️  Database sudah berisi ${c[0].n} user — lewati pengisian data.`);
  }

  // Migrasi idempoten (selalu dijalankan, aman diulang).
  await runMigrations();
}

/**
 * Migrasi ringan yang aman diulang. Untuk database yang sudah terisi
 * (mis. produksi) yang tak melewati schema.sql terbaru.
 */
async function runMigrations() {
  // 1. Tambah peran "admin" (Administrator) ke enum bila belum ada.
  //    ADD VALUE IF NOT EXISTS aman & idempoten (Postgres 12+).
  await pool.query("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin'");

  // 2. Jadikan user budhi sebagai Administrator (idempoten).
  const { rowCount } = await pool.query(
    "UPDATE users SET role = 'admin' WHERE id = 'budhi' AND role <> 'admin'"
  );
  if (rowCount > 0) console.log("🛡️  User 'budhi' disetel sebagai Administrator.");

  // 3. Kolom daily_margin untuk menyimpan input margin harian (idempoten).
  await pool.query("ALTER TABLE kpi_submissions ADD COLUMN IF NOT EXISTS daily_margin JSONB");

  // 3b. Cara input realisasi margin dipilih di awal: 'daily' | 'monthly' (null = legacy).
  await pool.query("ALTER TABLE kpi_submissions ADD COLUMN IF NOT EXISTS margin_input_mode TEXT");

  // 4. Kolom formula_expr untuk template buatan user (formula custom).
  await pool.query("ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS formula_expr TEXT");

  // 5. Kolom weight untuk bobot sub-unit yang persisten.
  await pool.query("ALTER TABLE sub_units ADD COLUMN IF NOT EXISTS weight INTEGER");

  // 5b. Kontrol KPI per field: arah (Min/Maks) + cap & floor pencapaian.
  await pool.query("ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS direction TEXT NOT NULL DEFAULT 'higher_better'");
  await pool.query("ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS cap_pct INTEGER NOT NULL DEFAULT 120");
  await pool.query("ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS floor_pct INTEGER NOT NULL DEFAULT 0");

  // 6. Tabel meta untuk penanda operasi sekali-jalan.
  await pool.query(
    "CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT, created_at TIMESTAMPTZ DEFAULT now())"
  );

  // 6b. Reset password darurat bila lupa: set env RESET_PASSWORD="email:passwordbaru"
  //     (mis. "budhi.ts@gmail.com:RahasiaBaru123"). Dijalankan tiap start selama
  //     env ada — HAPUS env setelah berhasil agar password tak ter-reset lagi.
  if (process.env.RESET_PASSWORD) {
    const idx = process.env.RESET_PASSWORD.indexOf(":");
    const email = process.env.RESET_PASSWORD.slice(0, idx).toLowerCase().trim();
    const newPass = process.env.RESET_PASSWORD.slice(idx + 1);
    if (email && newPass && newPass.length >= 8) {
      const hash = await bcrypt.hash(newPass, 10);
      const { rowCount } = await pool.query(
        "UPDATE users SET password_hash = $1 WHERE email = $2", [hash, email]
      );
      console.log(rowCount > 0
        ? `🔑 Password untuk ${email} berhasil di-reset. HAPUS env RESET_PASSWORD sekarang.`
        : `⚠️  RESET_PASSWORD: email ${email} tidak ditemukan.`);
    } else {
      console.log("⚠️  RESET_PASSWORD format salah. Pakai: email:passwordbaru (min 8 char).");
    }
  }

  // 7. Pembersihan data trial SEKALI JALAN bila CLEAR_TRIAL_DATA=true.
  //    Penanda 'trial_cleared' mencegah pengulangan (aman di free-tier yang
  //    sering restart) — jadi data trial yang Anda input tak akan ikut terhapus.
  if (process.env.CLEAR_TRIAL_DATA === "true") {
    const { rows } = await pool.query("SELECT 1 FROM app_meta WHERE key = 'trial_cleared'");
    if (rows.length === 0) {
      console.log("🧹 CLEAR_TRIAL_DATA=true → mengosongkan Project, KPI & Margin (sekali jalan)...");
      await clearTrialData();
      await pool.query("INSERT INTO app_meta (key, value) VALUES ('trial_cleared', now()::text)");
      console.log("✅ Data trial dikosongkan. User/Unit/Sub-unit/Template/Audit tetap.");
    } else {
      console.log("✔️  Pembersihan trial sudah pernah dijalankan — dilewati.");
    }
  }
}
