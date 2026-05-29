// Konfigurasi aplikasi Express (tanpa listen — supaya mudah dites).

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";

export function createApp() {
  const app = express();

  const origins = (process.env.CORS_ORIGIN || "http://localhost:5173")
    .split(",")
    .map((s) => s.trim());

  app.use(cors({ origin: origins, credentials: true }));
  app.use(express.json({ limit: "1mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "portal-gdn-api", time: new Date().toISOString() });
  });

  // Rute domain
  app.use("/api/auth", authRoutes);

  // 404 untuk rute API yang tidak dikenal
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Endpoint tidak ditemukan." });
  });

  // Penanganan error terpusat
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error("API error:", err);
    res.status(err.status || 500).json({ error: err.message || "Kesalahan server." });
  });

  return app;
}
