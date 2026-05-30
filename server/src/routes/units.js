// Rute units (read-only untuk sekarang).

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { unitToApi, subUnitToApi } from "../lib/serializers.js";

const router = Router();
router.use(authenticate);

// GET /api/units — semua unit
router.get("/", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM units ORDER BY name");
    res.json(rows.map(unitToApi));
  } catch (err) { next(err); }
});

// GET /api/units/:id — satu unit + sub-unit di dalamnya
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM units WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Unit tidak ditemukan." });
    const { rows: subs } = await query("SELECT * FROM sub_units WHERE unit_id = $1 ORDER BY created_at", [req.params.id]);
    res.json({ ...unitToApi(rows[0]), subUnits: subs.map(subUnitToApi) });
  } catch (err) { next(err); }
});

export default router;
