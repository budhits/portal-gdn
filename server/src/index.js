// Titik masuk server: muat env, buat app, mulai listen.

import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";
import { bootstrapDatabase } from "./bootstrap.js";

const PORT = process.env.PORT || 4000;
const app = createApp();

// Saat AUTO_MIGRATE=true (mis. di hosting tanpa shell), siapkan database
// otomatis: terapkan skema bila perlu & isi data awal bila masih kosong.
async function start() {
  if (process.env.AUTO_MIGRATE === "true") {
    try {
      await bootstrapDatabase();
    } catch (err) {
      console.error("⚠️  Bootstrap database gagal:", err.message);
    }
  }

  app.listen(PORT, () => {
    console.log(`🚀 Portal GDN API berjalan di http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health`);
  });
}

start();
