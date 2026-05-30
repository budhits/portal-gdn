// Koneksi PostgreSQL terpusat (connection pool).
// Semua modul lain mengimpor `pool` / `query` dari sini.

import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL belum di-set. Salin server/.env.example ke server/.env.");
}

// Database managed (Render/Railway/Neon/Supabase) umumnya mewajibkan SSL.
// Aktifkan dengan menyetel DATABASE_SSL=true di environment produksi.
const useSsl = process.env.DATABASE_SSL === "true";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Kesalahan tak terduga pada koneksi PostgreSQL:", err);
});

/**
 * Helper query singkat.
 * @param {string} text  SQL dengan placeholder $1, $2, ...
 * @param {any[]} [params]
 */
export function query(text, params) {
  return pool.query(text, params);
}

/**
 * Jalankan sekumpulan operasi dalam satu transaksi.
 * @param {(client: pg.PoolClient) => Promise<T>} fn
 * @returns {Promise<T>}
 * @template T
 */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
