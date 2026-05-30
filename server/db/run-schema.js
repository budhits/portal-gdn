// Jalankan schema.sql terhadap database yang dikonfigurasi di DATABASE_URL.
// Pemakaian: npm run db:schema   (dari folder server/)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "../src/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Terapkan skema (dipakai juga oleh bootstrap otomatis). Tidak menutup pool.
export async function applySchema() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  console.log("📦 Menerapkan skema database...");
  await pool.query(sql);
  console.log("✅ Skema berhasil diterapkan.");
}

// Jalankan sebagai skrip CLI: terapkan skema lalu tutup pool.
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  applySchema()
    .then(() => pool.end())
    .catch((err) => {
      console.error("❌ Gagal menerapkan skema:", err.message);
      process.exit(1);
    });
}
