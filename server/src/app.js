// Konfigurasi aplikasi Express (tanpa listen — supaya mudah dites).

import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import authRoutes from "./routes/auth.js";
import usersRoutes from "./routes/users.js";
import unitsRoutes from "./routes/units.js";
import subUnitsRoutes from "./routes/subUnits.js";
import projectsRoutes from "./routes/projects.js";
import milestonesRoutes from "./routes/milestones.js";
import expensesRoutes from "./routes/expenses.js";
import templatesRoutes from "./routes/templates.js";
import submissionsRoutes from "./routes/submissions.js";
import auditRoutes from "./routes/audit.js";
import dashboardRoutes from "./routes/dashboard.js";

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
  app.use("/api/users", usersRoutes);
  app.use("/api/units", unitsRoutes);
  app.use("/api/sub-units", subUnitsRoutes);
  app.use("/api/projects", projectsRoutes);
  app.use("/api/milestones", milestonesRoutes);
  app.use("/api/expenses", expensesRoutes);
  app.use("/api/templates", templatesRoutes);
  app.use("/api/submissions", submissionsRoutes);
  app.use("/api/audit", auditRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  // 404 untuk rute API yang tidak dikenal
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Endpoint tidak ditemukan." });
  });

  // ── Produksi: sajikan frontend hasil build (single service) ──────────────────
  // Jika folder build frontend ada, layani sebagai file statis + fallback SPA.
  // Frontend memanggil "/api" relatif (origin sama) sehingga tanpa CORS.
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const distPath = process.env.FRONTEND_DIST || path.resolve(__dirname, "../../dist");
  if (fs.existsSync(path.join(distPath, "index.html"))) {
    app.use(express.static(distPath));
    // Semua GET non-/api dikembalikan ke index.html (single-page app).
    app.get(/^(?!\/api\/).*/, (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Penanganan error terpusat
  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    console.error("API error:", err);
    res.status(err.status || 500).json({ error: err.message || "Kesalahan server." });
  });

  return app;
}
