// Rute Hak Akses: akses menu per role yang bisa diatur Admin. Disimpan sebagai
// satu JSON di app_meta (key 'menu_access'). Bentuk: { role: { menuKey: bool } }.
// Baca: semua user terautentikasi (agar app bisa menerapkan). Tulis: HANYA Admin.

import { Router } from "express";
import { query } from "../db.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// GET /api/permissions/menu → override akses menu ({} bila belum diatur).
router.get("/menu", async (_req, res, next) => {
  try {
    const { rows } = await query("SELECT value FROM app_meta WHERE key = 'menu_access'");
    let val = {};
    if (rows[0]?.value) { try { val = JSON.parse(rows[0].value); } catch { val = {}; } }
    res.json(val);
  } catch (err) { next(err); }
});

// PUT /api/permissions/menu  { role: { menuKey: bool } } — HANYA Admin.
router.put("/menu", async (req, res, next) => {
  try {
    const { rows } = await query("SELECT role FROM users WHERE id = $1", [req.user.id]);
    if (rows[0]?.role !== "admin") {
      return res.status(403).json({ error: "Hanya Admin yang boleh mengubah hak akses." });
    }
    const body = req.body && typeof req.body === "object" && !Array.isArray(req.body) ? req.body : {};
    const json = JSON.stringify(body);
    await query(
      `INSERT INTO app_meta (key, value) VALUES ('menu_access', $1)
       ON CONFLICT (key) DO UPDATE SET value = $1`, [json]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

export default router;
