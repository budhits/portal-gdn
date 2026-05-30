// Inisialisasi database otomatis saat aplikasi start (aman & idempoten).
//
// Berguna di hosting yang tak menyediakan akses shell (mis. Render free tier):
// alih-alih menjalankan `db:reset` manual, aplikasi menyiapkan databasenya
// sendiri saat pertama kali jalan.
//
// Aman: hanya menerapkan skema bila tabel belum ada, dan hanya mengisi data
// awal bila tabel users masih kosong. Jika sudah ada data, TIDAK menyentuh
// apa pun (tidak menghapus / menimpa). Diaktifkan via env AUTO_MIGRATE=true.

import { pool } from "./db.js";
import { applySchema } from "../db/run-schema.js";
import { seed } from "../db/seed.js";

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

  // 4. Kolom formula_expr untuk template buatan user (formula custom).
  await pool.query("ALTER TABLE form_fields ADD COLUMN IF NOT EXISTS formula_expr TEXT");

  // 5. Kolom weight untuk bobot sub-unit yang persisten.
  await pool.query("ALTER TABLE sub_units ADD COLUMN IF NOT EXISTS weight INTEGER");
}
