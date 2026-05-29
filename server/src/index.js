// Titik masuk server: muat env, buat app, mulai listen.

import dotenv from "dotenv";
dotenv.config();

import { createApp } from "./app.js";

const PORT = process.env.PORT || 4000;
const app = createApp();

app.listen(PORT, () => {
  console.log(`🚀 Portal GDN API berjalan di http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
});
