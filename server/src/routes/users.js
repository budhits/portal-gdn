// Rute kelola user: list + CRUD. Membuat/mengubah/menghapus khusus Owner.
// Password di-hash dengan bcrypt; password_hash tidak pernah dikirim ke klien.

import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { authenticate, requireRole } from "../middleware/authenticate.js";
import { userToApi } from "../lib/serializers.js";
import { logAudit } from "../lib/audit.js";

const router = Router();
router.use(authenticate);

const ROLES = ["owner", "finance", "hr", "leader", "pic"];

// GET /api/users  — semua user (tanpa password)
router.get("/", async (req, res, next) => {
  try {
    const { role, unitId } = req.query;
    const where = [];
    const params = [];
    if (role) { params.push(role); where.push(`role = $${params.length}`); }
    if (unitId) { params.push(unitId); where.push(`unit_id = $${params.length}`); }
    const sql = `SELECT * FROM users ${where.length ? "WHERE " + where.join(" AND ") : ""} ORDER BY name`;
    const { rows } = await query(sql, params);
    res.json(rows.map(userToApi));
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "User tidak ditemukan." });
    res.json(userToApi(rows[0]));
  } catch (err) { next(err); }
});

// POST /api/users  (Owner) — tambah user baru
router.post("/", requireRole("owner"), async (req, res, next) => {
  try {
    const { id, name, email, password, role, unitId = null, subUnitId = null } = req.body || {};
    if (!id || !name || !email || !password || !role) {
      return res.status(400).json({ error: "id, name, email, password, dan role wajib diisi." });
    }
    if (!ROLES.includes(role)) {
      return res.status(400).json({ error: `Role tidak valid. Pilih: ${ROLES.join(", ")}` });
    }
    const dup = await query("SELECT 1 FROM users WHERE id = $1 OR email = $2", [id, email.toLowerCase()]);
    if (dup.rowCount > 0) return res.status(409).json({ error: "ID atau email sudah dipakai." });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await query(
      `INSERT INTO users (id, name, email, password_hash, role, unit_id, sub_unit_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [id, name, email.toLowerCase(), hash, role, unitId, subUnitId]
    );
    await logAudit({ actorId: req.user.id, action: "create", entityType: "user",
      entityId: id, entityLabel: `Tambah user: ${name} (${role})`, unitId });
    res.status(201).json(userToApi(rows[0]));
  } catch (err) { next(err); }
});

// PATCH /api/users/:id  (Owner) — ubah data / role / password
router.patch("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    const b = req.body || {};
    if (b.role && !ROLES.includes(b.role)) {
      return res.status(400).json({ error: `Role tidak valid. Pilih: ${ROLES.join(", ")}` });
    }
    const sets = [];
    const params = [];
    const setCol = (col, val) => { params.push(val); sets.push(`${col} = $${params.length}`); };

    if (b.name !== undefined) setCol("name", b.name);
    if (b.email !== undefined) setCol("email", b.email.toLowerCase());
    if (b.role !== undefined) setCol("role", b.role);
    if (b.unitId !== undefined) setCol("unit_id", b.unitId);
    if (b.subUnitId !== undefined) setCol("sub_unit_id", b.subUnitId);
    if (b.password) setCol("password_hash", await bcrypt.hash(b.password, 10));
    if (sets.length === 0) return res.status(400).json({ error: "Tidak ada field untuk diubah." });

    setCol("updated_at", new Date());
    params.push(req.params.id);
    const { rows } = await query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = $${params.length} RETURNING *`, params
    );
    if (!rows[0]) return res.status(404).json({ error: "User tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "update", entityType: "user",
      entityId: req.params.id, entityLabel: `Ubah user: ${rows[0].name}`, unitId: rows[0].unit_id });
    res.json(userToApi(rows[0]));
  } catch (err) { next(err); }
});

// DELETE /api/users/:id  (Owner) — tidak boleh menghapus diri sendiri
router.delete("/:id", requireRole("owner"), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: "Tidak bisa menghapus akun sendiri." });
    }
    const { rows } = await query("DELETE FROM users WHERE id = $1 RETURNING *", [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: "User tidak ditemukan." });
    await logAudit({ actorId: req.user.id, action: "delete", entityType: "user",
      entityId: req.params.id, entityLabel: `Hapus user: ${rows[0].name}`, unitId: rows[0].unit_id });
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
