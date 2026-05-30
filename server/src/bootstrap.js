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
}
