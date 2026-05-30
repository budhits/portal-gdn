// Rute sub-units: list + CRUD (Owner/Leader yang boleh ubah).

import { Router } from "express";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/authenticate.js";
import { subUnitToApi } from "../lib/serializers.js";
import { logAudit } from "../lib/audit.js";

const router = Router();
router.use(authenticate);

// GET /api/sub-units?unitId=...
router.get("/", async (req, res, next) => {
  try {
    const { unitId } = req.query;
    const { rows } = unitId
      ? await query("SELECT * FROM sub_units WHERE unit_id = $1 ORDER BY created_at", [unitId])
      : await query("SELECT * FROM sub_units ORDER BY unit_id, created_at");
    res.json(rows.map(subUnitToApi));
  } catch (err) { next(err); }
});

// GET /api/sub-units/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM sub_units WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Sub-unit tidak ditemukan." });
    res.json(subUnitToApi(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/sub-units  (Owner/Leader)
router.post("/", requireRole("owner", "leader"), async (req, res, next) => {
  try {
    const { id, unitId, name, picId = null, icon = "cog", status = "active" } = req.body || {};
    if (!id || !unitId || !name) {
      return res.status(400).json({ error: "id, unitId, dan name wajib diisi." });
    }
    const { rows } = await query(
      `INSERT INTO sub_units (id, unit_id, name, pic_id, icon, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [id, unitId, name, picId, icon, status]
    );
    await logAudit({ actorId: req.user.id, action: "create", entityType: "sub_unit",
      entityId: id, entityLabel: `Tambah Sub Unit: ${name}`, unitId });
    res.status(201).json(subUnitToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/sub-units/:id  (Owner/Leader)
router.patch("/:id", requireRole("owner", "leader"), async (req, res, next) => {
  try {
    const allowed = { name: "name", picId: "pic_id", icon: "icon", status: "status", unitId: "unit_id", weight: "weight" };
    const sets = [];
    const params = [];
    for (const [key, col] of Object.entries(allowed)) {
      if (req.body[key] !== undefined) { params.push(req.body[key]); sets.push(`${col} = $${params.length}`); }
    }
    if (sets.length === 0) return res.status(400).json({ error: "Tidak ada field untuk diubah." });
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE sub_units SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params
    );
    if (!rows[0]) return res.status(404).json({ error: "Sub-unit tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "update", entityType: "sub_unit",
      entityId: req.params.id, entityLabel: `Ubah Sub Unit: ${rows[0].name}`, unitId: rows[0].unit_id });
    res.json(subUnitToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/sub-units/:id  (Owner)
router.delete("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const { rows } = await query("DELETE FROM sub_units WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Sub-unit tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "sub_unit",
      entityId: req.params.id, entityLabel: `Hapus Sub Unit: ${rows[0].name}`, unitId: rows[0].unit_id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
