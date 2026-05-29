// Rute projects: list + CRUD.

import { Router } from "express";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/authenticate.js";
import { projectToApi } from "../lib/serializers.js";
import { logAudit } from "../lib/audit.js";

const router = Router();
router.use(authenticate);

// GET /api/projects?unitId=...
router.get("/", async (req, res, next) => {
  try {
    const { unitId } = req.query;
    const { rows } = unitId
      ? await query("SELECT * FROM projects WHERE unit_id = $1 ORDER BY start_date DESC", [unitId])
      : await query("SELECT * FROM projects ORDER BY start_date DESC");
    res.json(rows.map(projectToApi));
  } catch (err) { next(err); }
});

// GET /api/projects/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Project tidak ditemukan." });
    res.json(projectToApi(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/projects  (Owner/Leader)
router.post("/", requireRole("owner", "leader"), async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.id || !b.unitId || !b.name) {
      return res.status(400).json({ error: "id, unitId, dan name wajib diisi." });
    }
    const { rows } = await query(
      `INSERT INTO projects (id, unit_id, sub_unit_id, name, description, status,
          milestones_total, milestones_done, budget_planned, budget_spent, start_date, end_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.id, b.unitId, b.subUnitId ?? null, b.name, b.desc ?? "", b.status ?? "on_track",
       b.milestonesTotal ?? 0, b.milestonesDone ?? 0, b.budgetPlanned ?? 0, b.budgetSpent ?? 0,
       b.startDate ?? null, b.endDate ?? null]
    );
    await logAudit({ actorId: req.user.id, action: "create", entityType: "project",
      entityId: b.id, entityLabel: `Ajukan Project: ${b.name}`, unitId: b.unitId });
    res.status(201).json(projectToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/projects/:id  (Owner/Leader)
router.patch("/:id", requireRole("owner", "leader"), async (req, res, next) => {
  try {
    const allowed = {
      name: "name", desc: "description", status: "status",
      milestonesTotal: "milestones_total", milestonesDone: "milestones_done",
      budgetPlanned: "budget_planned", budgetSpent: "budget_spent",
      startDate: "start_date", endDate: "end_date", subUnitId: "sub_unit_id",
    };
    const sets = [];
    const params = [];
    for (const [key, col] of Object.entries(allowed)) {
      if (req.body[key] !== undefined) { params.push(req.body[key]); sets.push(`${col} = $${params.length}`); }
    }
    if (sets.length === 0) return res.status(400).json({ error: "Tidak ada field untuk diubah." });
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE projects SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params
    );
    if (!rows[0]) return res.status(404).json({ error: "Project tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "update", entityType: "project",
      entityId: req.params.id, entityLabel: `Ubah Project: ${rows[0].name}`, unitId: rows[0].unit_id });
    res.json(projectToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/projects/:id  (Owner)
router.delete("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const { rows } = await query("DELETE FROM projects WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Project tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "project",
      entityId: req.params.id, entityLabel: `Hapus Project: ${rows[0].name}`, unitId: rows[0].unit_id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
