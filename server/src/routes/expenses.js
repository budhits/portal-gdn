// Rute expenses (realisasi): list + create. Create menghitung ulang
// budget_spent project agar dashboard budget konsisten.

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { expenseToApi } from "../lib/serializers.js";
import { logAudit } from "../lib/audit.js";
import { recomputeProjectStats, loadProject, loadActor, canEditProject } from "../lib/projects.js";

const router = Router();
router.use(authenticate);

const genId = () => `ex-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// GET /api/expenses?projectId=
router.get("/", async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const { rows } = projectId
      ? await query("SELECT * FROM expenses WHERE project_id = $1 ORDER BY date", [projectId])
      : await query("SELECT * FROM expenses ORDER BY project_id, date");
    res.json(rows.map(expenseToApi));
  } catch (err) { next(err); }
});

// POST /api/expenses  { projectId, milestoneId?, name, amount, date, hasReceipt }
router.post("/", async (req, res, next) => {
  try {
    const { projectId, milestoneId = null, name, amount, date = null, hasReceipt = false } = req.body || {};
    if (!projectId || !name || amount === undefined) {
      return res.status(400).json({ error: "projectId, name, dan amount wajib diisi." });
    }
    const project = await loadProject(projectId);
    if (!project) return res.status(404).json({ error: "Project tidak ditemukan." });
    if (!canEditProject(await loadActor(req.user.id), project)) {
      return res.status(403).json({ error: "Anda tidak berwenang mengubah project ini." });
    }
    const id = genId();
    const { rows } = await query(
      `INSERT INTO expenses (id, project_id, milestone_id, name, amount, date, has_receipt)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, projectId, milestoneId || null, name.trim(), Number(amount) || 0, date || null, !!hasReceipt]
    );
    await recomputeProjectStats(projectId);
    await logAudit({ actorId: req.user.id, action: "create", entityType: "expense",
      entityId: id, entityLabel: `Realisasi: ${name}`, unitId: project.unit_id });
    res.status(201).json(expenseToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/expenses/:id  { milestoneId?, name?, amount?, date?, hasReceipt? }
router.patch("/:id", async (req, res, next) => {
  try {
    const { rows: ex } = await query("SELECT * FROM expenses WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ error: "Realisasi tidak ditemukan." });
    const project = await loadProject(ex[0].project_id);
    if (!project) return res.status(404).json({ error: "Project tidak ditemukan." });
    if (!canEditProject(await loadActor(req.user.id), project)) {
      return res.status(403).json({ error: "Anda tidak berwenang mengubah project ini." });
    }
    const map = { milestoneId: "milestone_id", name: "name", amount: "amount", date: "date", hasReceipt: "has_receipt" };
    const sets = []; const params = [];
    for (const [k, col] of Object.entries(map)) {
      if (req.body[k] === undefined) continue;
      let v = req.body[k];
      if (k === "milestoneId") v = v || null;
      else if (k === "name") v = String(v).trim();
      else if (k === "amount") v = Number(v) || 0;
      else if (k === "date") v = v || null;
      else if (k === "hasReceipt") v = !!v;
      params.push(v); sets.push(`${col} = $${params.length}`);
    }
    if (!sets.length) return res.status(400).json({ error: "Tidak ada perubahan." });
    params.push(req.params.id);
    const { rows } = await query(`UPDATE expenses SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params);
    await recomputeProjectStats(project.id);
    await logAudit({ actorId: req.user.id, action: "update", entityType: "expense",
      entityId: req.params.id, entityLabel: `Realisasi: ${rows[0].name}`, unitId: project.unit_id });
    res.json(expenseToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/expenses/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const { rows: ex } = await query("SELECT * FROM expenses WHERE id = $1", [req.params.id]);
    if (!ex[0]) return res.status(404).json({ error: "Realisasi tidak ditemukan." });
    const project = await loadProject(ex[0].project_id);
    if (project && !canEditProject(await loadActor(req.user.id), project)) {
      return res.status(403).json({ error: "Anda tidak berwenang mengubah project ini." });
    }
    await query("DELETE FROM expenses WHERE id = $1", [req.params.id]);
    if (project) await recomputeProjectStats(project.id);
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "expense",
      entityId: req.params.id, entityLabel: `Realisasi: ${ex[0].name}`, unitId: project?.unit_id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
