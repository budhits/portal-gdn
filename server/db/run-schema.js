// Jalankan schema.sql terhadap database yang dikonfigurasi di DATABASE_URL.
// Pemakaian: npm run db:schema   (dari folder server/)

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { pool } from "../src/db.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function main() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf8");
  console.log("📦 Menerapkan skema database...");
  await pool.query(sql);
  console.log("✅ Skema berhasil diterapkan.");
  await pool.end();
}

main().catch((err) => {
  console.error("❌ Gagal menerapkan skema:", err.message);
  process.exit(1);
});
