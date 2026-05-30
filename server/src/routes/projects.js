// Rute projects: list + CRUD.

import { Router } from "express";
import { query, withTransaction } from "../db.js";
import { authenticate, requireRole } from "../middleware/authenticate.js";
import { projectToApi } from "../lib/serializers.js";
import { logAudit } from "../lib/audit.js";
import { recomputeProjectStats, canEditProject } from "../lib/projects.js";

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

// POST /api/projects  (Owner/Leader/PIC) — sekaligus milestones (transaksional)
router.post("/", requireRole("owner", "leader", "pic"), async (req, res, next) => {
  try {
    const b = req.body || {};
    if (!b.unitId || !b.name) {
      return res.status(400).json({ error: "unitId dan name wajib diisi." });
    }
    const id = b.id || `pj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const milestones = Array.isArray(b.milestones) ? b.milestones : [];

    const created = await withTransaction(async (c) => {
      const { rows } = await c.query(
        `INSERT INTO projects (id, unit_id, sub_unit_id, name, description, status,
            milestones_total, milestones_done, budget_planned, budget_spent, start_date, end_date)
         VALUES ($1,$2,$3,$4,$5,$6,$7,0,$8,0,$9,$10) RETURNING *`,
        [id, b.unitId, b.subUnitId ?? null, b.name, b.desc ?? "", b.status ?? "pending_approval",
         milestones.length, b.budgetPlanned ?? 0, b.startDate ?? null, b.endDate ?? null]
      );
      let order = 0;
      for (const m of milestones) {
        const msId = m.id || `ms-${id}-${order + 1}`;
        await c.query(
          `INSERT INTO milestones (id, project_id, name, done, date, pic, budget_allocated, sort_order)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          [msId, id, m.name, !!m.done, m.date || null, m.pic || "", Number(m.budgetAllocated) || 0, order++]
        );
      }
      await recomputeProjectStats(id, c);
      await logAudit({ actorId: req.user.id, action: "create", entityType: "project",
        entityId: id, entityLabel: `Ajukan Project: ${b.name}`, unitId: b.unitId }, c);
      const { rows: fresh } = await c.query("SELECT * FROM projects WHERE id = $1", [id]);
      return fresh[0];
    });

    res.status(201).json(projectToApi(created));
  } catch (err) { next(err); }
});

// PATCH /api/projects/:id  (Owner/Leader)
router.patch("/:id", requireRole("owner", "leader"), async (req, res, next) => {
  try {
    // Cek kepemilikan: Owner/Admin semua; Leader hanya project di unitnya.
    const { rows: prows } = await query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
    const target = prows[0];
    if (!target) return res.status(404).json({ error: "Project tidak ditemukan." });
    const { rows: arows } = await query("SELECT id, role, unit_id, sub_unit_id FROM users WHERE id = $1", [req.user.id]);
    if (!canEditProject(arows[0], target)) {
      return res.status(403).json({ error: "Anda tidak berwenang mengubah project ini." });
    }
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
router.delete("/:id", requireRole("owner", "leader"), async (req, res, next) => {
  try {
    const { rows: prows } = await query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
    const target = prows[0];
    if (!target) return res.status(404).json({ error: "Project tidak ditemukan." });
    const { rows: arows } = await query("SELECT id, role, unit_id, sub_unit_id FROM users WHERE id = $1", [req.user.id]);
    if (!canEditProject(arows[0], target)) {
      return res.status(403).json({ error: "Anda tidak berwenang menghapus project ini." });
    }
    await query("DELETE FROM projects WHERE id = $1", [req.params.id]);
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "project",
      entityId: req.params.id, entityLabel: `Hapus Project: ${target.name}`, unitId: target.unit_id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
