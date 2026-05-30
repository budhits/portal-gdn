// Rute units: list + CRUD (hanya Owner yang boleh ubah struktur unit).

import { Router } from "express";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/authenticate.js";
import { unitToApi, subUnitToApi } from "../lib/serializers.js";
import { logAudit } from "../lib/audit.js";

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

// POST /api/units  (Owner) — tambah unit bisnis baru
router.post("/", requireRole("owner"), async (req, res, next) => {
  try {
    const {
      id, name, leaderId = null,
      color = "#6B6B76", colorDark = "#46464E", colorLight = "#F0F0F2",
      icon = "cog",
    } = req.body || {};
    if (!id || !name) {
      return res.status(400).json({ error: "id dan name wajib diisi." });
    }
    const { rows: exist } = await query("SELECT 1 FROM units WHERE id = $1", [id]);
    if (exist[0]) return res.status(409).json({ error: "Unit dengan id itu sudah ada." });

    const { rows } = await query(
      `INSERT INTO units (id, name, leader_id, color, color_dark, color_light, icon)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, name, leaderId, color, colorDark, colorLight, icon]
    );
    await logAudit({ actorId: req.user.id, action: "create", entityType: "unit",
      entityId: id, entityLabel: `Tambah Unit: ${name}`, unitId: id });
    res.status(201).json(unitToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/units/:id  (Owner) — ubah nama, leader, warna, ikon
router.patch("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const allowed = {
      name: "name", leaderId: "leader_id", color: "color",
      colorDark: "color_dark", colorLight: "color_light", icon: "icon",
    };
    const sets = [];
    const params = [];
    for (const [key, col] of Object.entries(allowed)) {
      if (req.body[key] !== undefined) { params.push(req.body[key]); sets.push(`${col} = $${params.length}`); }
    }
    if (sets.length === 0) return res.status(400).json({ error: "Tidak ada field untuk diubah." });
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE units SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params
    );
    if (!rows[0]) return res.status(404).json({ error: "Unit tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "update", entityType: "unit",
      entityId: req.params.id, entityLabel: `Ubah Unit: ${rows[0].name}`, unitId: req.params.id });
    res.json(unitToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/units/:id  (Owner) — hanya bila unit kosong
router.delete("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    // Cegah hapus bila masih ada sub-unit atau project yang menggantung.
    const { rows: subs } = await query("SELECT COUNT(*)::int AS n FROM sub_units WHERE unit_id = $1", [req.params.id]);
    const { rows: projs } = await query("SELECT COUNT(*)::int AS n FROM projects WHERE unit_id = $1", [req.params.id]);
    if (subs[0].n > 0 || projs[0].n > 0) {
      return res.status(409).json({
        error: `Unit tidak bisa dihapus — masih ada ${subs[0].n} sub unit dan ${projs[0].n} project.`,
      });
    }
    const { rows } = await query("DELETE FROM units WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "Unit tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "unit",
      entityId: req.params.id, entityLabel: `Hapus Unit: ${rows[0].name}`, unitId: req.params.id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
