// Rute form-templates (read-only): daftar template KPI beserta field-nya.

import { Router } from "express";
import { authenticate } from "../middleware/authenticate.js";
import { getTemplatesMap } from "../lib/repository.js";

const router = Router();
router.use(authenticate);

// GET /api/templates — semua template + fields
router.get("/", async (_req, res, next) => {
  try {
    const map = await getTemplatesMap();
    res.json(Object.values(map));
  } catch (err) { next(err); }
});

// GET /api/templates/:id
router.get("/:id", async (req, res, next) => {
  try {
    const map = await getTemplatesMap();
    const tpl = map[req.params.id];
    if (!tpl) return res.status(404).json({ error: "Template tidak ditemukan." });
    res.json(tpl);
  } catch (err) { next(err); }
});

export default router;
