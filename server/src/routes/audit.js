// Rute audit log (read-only).

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { auditToApi } from "../lib/serializers.js";

const router = Router();
router.use(authenticate);

// GET /api/audit?unitId=&limit=
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500);
    const { unitId } = req.query;
    const { rows } = unitId
      ? await query("SELECT * FROM audit_log WHERE unit_id = $1 ORDER BY ts DESC LIMIT $2", [unitId, limit])
      : await query("SELECT * FROM audit_log ORDER BY ts DESC LIMIT $1", [limit]);
    res.json(rows.map(auditToApi));
  } catch (err) { next(err); }
});

export default router;
