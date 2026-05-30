// Rute form-templates: daftar + CRUD (buat/ubah/hapus khusus Owner/Admin).

import { Router } from "express";
import { query, withTransaction } from "../db.js";
import { authenticate, requireRole } from "../middleware/authenticate.js";
import { getTemplatesMap } from "../lib/repository.js";
import { logAudit } from "../lib/audit.js";

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

// Simpan daftar field sebuah template (dipakai create & update).
async function insertFields(client, templateId, fields) {
  let i = 0;
  for (const f of fields || []) {
    i++;
    await client.query(
      `INSERT INTO form_fields
        (template_id, field_key, name, type, satuan, source, formula_id, formula_expr, default_weight, is_margin, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        templateId,
        f.id || `f${i}`,
        (f.name || "").trim(),
        f.type || "number",
        f.satuan || "",
        f.source || "Manual",
        f.formulaId || null,
        f.formulaExpr || null,
        Number(f.defaultWeight) || 0,
        !!f.isMargin,
        i,
      ]
    );
  }
}

// POST /api/templates — buat template baru (Owner/Admin)
router.post("/", requireRole("owner"), async (req, res, next) => {
  try {
    const { id, name, description = "", frequency = "monthly", fields = [] } = req.body || {};
    if (!name || !name.trim()) return res.status(400).json({ error: "Nama template wajib diisi." });
    const tplId = id || `tpl-${Date.now().toString(36)}`;

    const exist = await query("SELECT 1 FROM form_templates WHERE id = $1", [tplId]);
    if (exist.rowCount > 0) return res.status(409).json({ error: "Template dengan id itu sudah ada." });

    await withTransaction(async (client) => {
      await client.query(
        "INSERT INTO form_templates (id, name, description, frequency) VALUES ($1,$2,$3,$4)",
        [tplId, name.trim(), description, frequency]
      );
      await insertFields(client, tplId, fields);
    });
    await logAudit({ actorId: req.user.id, action: "create", entityType: "form_template",
      entityId: tplId, entityLabel: `Buat Template: ${name.trim()}` });

    const map = await getTemplatesMap();
    res.status(201).json(map[tplId]);
  } catch (err) { next(err); }
});

// PATCH /api/templates/:id — ubah template + ganti seluruh field-nya (Owner/Admin)
router.patch("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const { name, description, frequency, fields } = req.body || {};
    const exist = await query("SELECT 1 FROM form_templates WHERE id = $1", [req.params.id]);
    if (exist.rowCount === 0) return res.status(404).json({ error: "Template tidak ditemukan." });

    await withTransaction(async (client) => {
      const sets = [];
      const params = [];
      if (name !== undefined) { params.push(name.trim()); sets.push(`name = $${params.length}`); }
      if (description !== undefined) { params.push(description); sets.push(`description = $${params.length}`); }
      if (frequency !== undefined) { params.push(frequency); sets.push(`frequency = $${params.length}`); }
      if (sets.length > 0) {
        params.push(req.params.id);
        await client.query(`UPDATE form_templates SET ${sets.join(", ")} WHERE id = $${params.length}`, params);
      }
      // Ganti seluruh field bila dikirim.
      if (Array.isArray(fields)) {
        await client.query("DELETE FROM form_fields WHERE template_id = $1", [req.params.id]);
        await insertFields(client, req.params.id, fields);
      }
    });
    await logAudit({ actorId: req.user.id, action: "update", entityType: "form_template",
      entityId: req.params.id, entityLabel: `Ubah Template: ${name || req.params.id}` });

    const map = await getTemplatesMap();
    res.json(map[req.params.id]);
  } catch (err) { next(err); }
});

// DELETE /api/templates/:id — hapus bila tak dipakai submission apa pun (Owner/Admin)
router.delete("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const used = await query("SELECT COUNT(*)::int AS n FROM kpi_submissions WHERE template_id = $1", [req.params.id]);
    if (used.rows[0].n > 0) {
      return res.status(409).json({
        error: `Template tidak bisa dihapus — sudah dipakai ${used.rows[0].n} KPI submission.`,
      });
    }
    const { rows } = await query("DELETE FROM form_templates WHERE id = $1 RETURNING name", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Template tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "form_template",
      entityId: req.params.id, entityLabel: `Hapus Template: ${rows[0].name}` });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
