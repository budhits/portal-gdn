// Rute KPI submissions: baca (dengan skor/margin turunan) + alur tulis
// (ajukan → approve/reject → closing/update).

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";
import { getSubmissions, getSubmissionById, getTemplatesMap, enrichSubmission } from "../lib/repository.js";
import { logAudit } from "../lib/audit.js";

const router = Router();
router.use(authenticate);

// ── Otorisasi berbasis kepemilikan ───────────────────────────────────────────
async function loadActor(userId) {
  const { rows } = await query("SELECT id, role, unit_id, sub_unit_id FROM users WHERE id = $1", [userId]);
  return rows[0] || null;
}
// Boleh mengajukan/closing/update: Owner (semua), Leader (unitnya), PIC (sub-unitnya).
function canWrite(actor, target) {
  if (!actor) return false;
  if (actor.role === "owner") return true;
  if (actor.role === "leader") return target.unitId === actor.unit_id;
  if (actor.role === "pic") return target.subUnitId === actor.sub_unit_id;
  return false;
}
// Boleh approve/reject: Owner (semua), Leader (unitnya).
function canApprove(actor, target) {
  if (!actor) return false;
  if (actor.role === "owner") return true;
  if (actor.role === "leader") return target.unitId === actor.unit_id;
  return false;
}

const genId = () => `sub-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

// ── READ ──────────────────────────────────────────────────────────────────────
// GET /api/submissions?unitId=&subUnitId=&status=&createdBy=
router.get("/", async (req, res, next) => {
  try {
    const filters = {
      unitId: req.query.unitId, subUnitId: req.query.subUnitId,
      status: req.query.status, createdBy: req.query.createdBy,
    };
    const [subs, templates] = await Promise.all([getSubmissions(filters), getTemplatesMap()]);
    res.json(subs.map((s) => enrichSubmission(s, templates)));
  } catch (err) { next(err); }
});

// GET /api/submissions/:id
router.get("/:id", async (req, res, next) => {
  try {
    const [sub, templates] = await Promise.all([getSubmissionById(req.params.id), getTemplatesMap()]);
    if (!sub) return res.status(404).json({ error: "Submission tidak ditemukan." });
    res.json(enrichSubmission(sub, templates));
  } catch (err) { next(err); }
});

// Util: kirim balik submission ter-enrich setelah mutasi.
async function respondEnriched(res, id) {
  const [sub, templates] = await Promise.all([getSubmissionById(id), getTemplatesMap()]);
  res.json(enrichSubmission(sub, templates));
}

// ── CREATE (ajukan estimasi) ─────────────────────────────────────────────────
// POST /api/submissions  { templateId, subUnitId, period, estimatedValues, subUnitWeight? }
router.post("/", async (req, res, next) => {
  try {
    const { templateId, subUnitId, period, estimatedValues = {}, subUnitWeight } = req.body || {};
    if (!templateId || !subUnitId || !period) {
      return res.status(400).json({ error: "templateId, subUnitId, dan period wajib diisi." });
    }
    const { rows: suRows } = await query("SELECT id, unit_id FROM sub_units WHERE id = $1", [subUnitId]);
    if (!suRows[0]) return res.status(400).json({ error: "Sub-unit tidak ditemukan." });
    const unitId = suRows[0].unit_id;

    const actor = await loadActor(req.user.id);
    if (!canWrite(actor, { unitId, subUnitId })) {
      return res.status(403).json({ error: "Anda tidak berwenang mengajukan KPI untuk sub-unit ini." });
    }
    const tpl = await query("SELECT 1 FROM form_templates WHERE id = $1", [templateId]);
    if (!tpl.rowCount) return res.status(400).json({ error: "Template tidak ditemukan." });

    // Bobot field default diambil dari definisi template (otoritatif di server).
    const { rows: fieldRows } = await query(
      "SELECT field_key, default_weight FROM form_fields WHERE template_id = $1 AND default_weight > 0",
      [templateId]
    );
    const fieldWeights = {};
    for (const f of fieldRows) fieldWeights[f.field_key] = f.default_weight;

    const id = genId();
    await query(
      `INSERT INTO kpi_submissions
        (id, template_id, sub_unit_id, unit_id, status, period,
         estimated_values, actual_values, field_weights, sub_unit_weight, created_by)
       VALUES ($1,$2,$3,$4,'estimated',$5,$6,NULL,$7,$8,$9)`,
      [id, templateId, subUnitId, unitId, period,
       JSON.stringify(estimatedValues), JSON.stringify(fieldWeights),
       Number.isFinite(subUnitWeight) ? subUnitWeight : 50, req.user.id]
    );
    await logAudit({ actorId: req.user.id, action: "create", entityType: "kpi_submission",
      entityId: id, entityLabel: `Ajukan KPI ${period}`, unitId });
    res.status(201);
    await respondEnriched(res, id);
  } catch (err) { next(err); }
});

// ── APPROVE (set bobot final) ────────────────────────────────────────────────
// POST /api/submissions/:id/approve  { fieldWeights, subUnitWeight }
router.post("/:id/approve", async (req, res, next) => {
  try {
    const sub = await getSubmissionById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Submission tidak ditemukan." });
    const actor = await loadActor(req.user.id);
    if (!canApprove(actor, sub)) return res.status(403).json({ error: "Anda tidak berwenang menyetujui KPI ini." });
    if (sub.status !== "estimated") {
      return res.status(409).json({ error: `KPI tidak bisa disetujui dari status "${sub.status}".` });
    }

    const { fieldWeights, subUnitWeight } = req.body || {};
    const weights = fieldWeights || sub.fieldWeights || {};
    const total = Object.values(weights).reduce((s, w) => s + (Number(w) || 0), 0);
    if (total !== 100) return res.status(400).json({ error: `Total bobot field harus = 100% (saat ini ${total}%).` });

    await query(
      `UPDATE kpi_submissions
         SET status = 'approved', field_weights = $2,
             sub_unit_weight = COALESCE($3, sub_unit_weight),
             approved_by = $4, approved_at = now()
       WHERE id = $1`,
      [req.params.id, JSON.stringify(weights),
       Number.isFinite(subUnitWeight) ? subUnitWeight : null, req.user.id]
    );
    await logAudit({ actorId: req.user.id, action: "approve", entityType: "kpi_submission",
      entityId: req.params.id, entityLabel: `Approve KPI ${sub.period}`, unitId: sub.unitId });
    await respondEnriched(res, req.params.id);
  } catch (err) { next(err); }
});

// ── REJECT ────────────────────────────────────────────────────────────────────
// POST /api/submissions/:id/reject  { note }
router.post("/:id/reject", async (req, res, next) => {
  try {
    const sub = await getSubmissionById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Submission tidak ditemukan." });
    const actor = await loadActor(req.user.id);
    if (!canApprove(actor, sub)) return res.status(403).json({ error: "Anda tidak berwenang menolak KPI ini." });

    const note = (req.body?.note || "").trim();
    if (!note) return res.status(400).json({ error: "Catatan koreksi wajib diisi saat menolak." });

    await query(
      "UPDATE kpi_submissions SET status = 'rejected', closing_note = $2 WHERE id = $1",
      [req.params.id, note]
    );
    await logAudit({ actorId: req.user.id, action: "reject", entityType: "kpi_submission",
      entityId: req.params.id, entityLabel: `Tolak KPI ${sub.period}`, unitId: sub.unitId, details: note });
    await respondEnriched(res, req.params.id);
  } catch (err) { next(err); }
});

// ── CLOSE (isi realisasi + catatan) ──────────────────────────────────────────
// POST /api/submissions/:id/close  { actualValues, closingNote }
router.post("/:id/close", async (req, res, next) => {
  try {
    const sub = await getSubmissionById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Submission tidak ditemukan." });
    const actor = await loadActor(req.user.id);
    if (!canWrite(actor, sub)) return res.status(403).json({ error: "Anda tidak berwenang menutup KPI ini." });

    const { actualValues, closingNote } = req.body || {};
    if (!closingNote || closingNote.trim().length < 10) {
      return res.status(400).json({ error: "Catatan closing wajib diisi (minimal 10 karakter)." });
    }
    await query(
      `UPDATE kpi_submissions
         SET status = 'closed', actual_values = $2, closing_note = $3, closed_at = now()
       WHERE id = $1`,
      [req.params.id, JSON.stringify(actualValues || {}), closingNote.trim()]
    );
    await logAudit({ actorId: req.user.id, action: "close", entityType: "kpi_submission",
      entityId: req.params.id, entityLabel: `Closing KPI ${sub.period}`, unitId: sub.unitId, details: closingNote.trim() });
    await respondEnriched(res, req.params.id);
  } catch (err) { next(err); }
});

// ── UPDATE realisasi (bulanan, status tetap) ─────────────────────────────────
// PATCH /api/submissions/:id  { actualValues }
router.patch("/:id", async (req, res, next) => {
  try {
    const sub = await getSubmissionById(req.params.id);
    if (!sub) return res.status(404).json({ error: "Submission tidak ditemukan." });
    const actor = await loadActor(req.user.id);
    if (!canWrite(actor, sub)) return res.status(403).json({ error: "Anda tidak berwenang mengubah KPI ini." });

    const { actualValues } = req.body || {};
    if (actualValues === undefined) return res.status(400).json({ error: "actualValues wajib diisi." });

    await query("UPDATE kpi_submissions SET actual_values = $2 WHERE id = $1",
      [req.params.id, JSON.stringify(actualValues)]);
    await logAudit({ actorId: req.user.id, action: "update", entityType: "kpi_submission",
      entityId: req.params.id, entityLabel: `Update realisasi KPI ${sub.period}`, unitId: sub.unitId });
    await respondEnriched(res, req.params.id);
  } catch (err) { next(err); }
});

export default router;
