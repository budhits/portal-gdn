// Rute dashboard: daftar periode & ringkasan agregat per periode.

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getAvailablePeriods, findPeriod } from "../lib/scoring.js";
import { buildDashboard } from "../lib/dashboard.js";

const router = Router();
router.use(authenticate);

// GET /api/dashboard/periods
router.get("/periods", (_req, res) => {
  res.json(getAvailablePeriods());
});

// GET /api/dashboard?period=2026-05  (default: periode bulan terakhir)
router.get("/", async (req, res, next) => {
  try {
    const periods = getAvailablePeriods();
    const key = req.query.period || "2026-05";
    const period = findPeriod(key);
    if (!period) {
      return res.status(400).json({ error: `Periode tidak dikenal. Pilihan: ${periods.map((p) => p.key).join(", ")}` });
    }
    const data = await buildDashboard(period);
    res.json(data);
  } catch (err) { next(err); }
});

export default router;
