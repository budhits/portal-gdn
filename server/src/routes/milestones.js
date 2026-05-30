// Rute milestones: list + CRUD. Setiap perubahan menghitung ulang statistik
// project (milestones_total/done) agar dashboard tetap konsisten.

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { milestoneToApi } from "../lib/serializers.js";
import { logAudit } from "../lib/audit.js";
import { recomputeProjectStats, loadProject, loadActor, canEditProject } from "../lib/projects.js";

const router = Router();
router.use(authenticate);

const genId = () => `ms-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// GET /api/milestones?projectId=
router.get("/", async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const { rows } = projectId
      ? await query("SELECT * FROM milestones WHERE project_id = $1 ORDER BY sort_order, date", [projectId])
      : await query("SELECT * FROM milestones ORDER BY project_id, sort_order, date");
    res.json(rows.map(milestoneToApi));
  } catch (err) { next(err); }
});

// POST /api/milestones  { projectId, name, date, pic, budgetAllocated }
router.post("/", async (req, res, next) => {
  try {
    const { projectId, name, date = null, pic = "", budgetAllocated = 0 } = req.body || {};
    if (!projectId || !name) return res.status(400).json({ error: "projectId dan name wajib diisi." });
    const project = await loadProject(projectId);
    if (!project) return res.status(404).json({ error: "Project tidak ditemukan." });
    if (!canEditProject(await loadActor(req.user.id), project)) {
      return res.status(403).json({ error: "Anda tidak berwenang mengubah project ini." });
    }
    const { rows: ord } = await query(
      "SELECT COALESCE(MAX(sort_order) + 1, 0) AS n FROM milestones WHERE project_id = $1", [projectId]
    );
    const id = genId();
    const { rows } = await query(
      `INSERT INTO milestones (id, project_id, name, done, date, pic, budget_allocated, sort_order)
       VALUES ($1,$2,$3,false,$4,$5,$6,$7) RETURNING *`,
      [id, projectId, name.trim(), date || null, pic, Number(budgetAllocated) || 0, ord[0].n]
    );
    await recomputeProjectStats(projectId);
    await logAudit({ actorId: req.user.id, action: "create", entityType: "milestone",
      entityId: id, entityLabel: `Tambah milestone: ${name}`, unitId: project.unit_id });
    res.status(201).json(milestoneToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/milestones/:id  { done?, name?, date?, pic?, budgetAllocated? }
router.patch("/:id", async (req, res, next) => {
  try {
    const { rows: cur } = await query("SELECT * FROM milestones WHERE id = $1", [req.params.id]);
    if (!cur[0]) return res.status(404).json({ error: "Milestone tidak ditemukan." });
    const project = await loadProject(cur[0].project_id);
    if (!canEditProject(await loadActor(req.user.id), project)) {
      return res.status(403).json({ error: "Anda tidak berwenang mengubah project ini." });
    }
    const allowed = { name: "name", done: "done", date: "date", pic: "pic", budgetAllocated: "budget_allocated" };
    const sets = [];
    const params = [];
    for (const [key, col] of Object.entries(allowed)) {
      if (req.body[key] !== undefined) { params.push(req.body[key]); sets.push(`${col} = $${params.length}`); }
    }
    if (sets.length === 0) return res.status(400).json({ error: "Tidak ada field untuk diubah." });
    params.push(req.params.id);
    const { rows } = await query(`UPDATE milestones SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    await recomputeProjectStats(cur[0].project_id);
    await logAudit({ actorId: req.user.id, action: "update", entityType: "milestone",
      entityId: req.params.id, entityLabel: `Ubah milestone: ${rows[0].name}`, unitId: project.unit_id });
    res.json(milestoneToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/milestones/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { rows: cur } = await query("SELECT * FROM milestones WHERE id = $1", [req.params.id]);
    if (!cur[0]) return res.status(404).json({ error: "Milestone tidak ditemukan." });
    const project = await loadProject(cur[0].project_id);
    if (!canEditProject(await loadActor(req.user.id), project)) {
      return res.status(403).json({ error: "Anda tidak berwenang mengubah project ini." });
    }
    await query("DELETE FROM milestones WHERE id = $1", [req.params.id]);
    await recomputeProjectStats(cur[0].project_id);
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "milestone",
      entityId: req.params.id, entityLabel: `Hapus milestone: ${cur[0].name}`, unitId: project.unit_id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
