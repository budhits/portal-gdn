// Rute autentikasi: login & profil user yang sedang masuk.

import { Router } from "express";
import { query } from "../db.js";
import { signToken, checkPassword } from "../lib/auth.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

// Bentuk user yang aman dikirim ke frontend (tanpa password_hash).
const publicUser = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  avatar: row.avatar,
  unitId: row.unit_id,
  subUnitId: row.sub_unit_id,
});

// POST /api/auth/login  { email, password }
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email dan password wajib diisi." });
    }

    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email.toLowerCase().trim()]);
    const user = rows[0];

    // Pesan disamakan agar tidak membocorkan email mana yang terdaftar.
    const ok = user && (await checkPassword(password, user.password_hash));
    if (!ok) {
      return res.status(401).json({ error: "Email atau password salah." });
    }

    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me  (butuh token) — kembalikan profil user saat ini.
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    if (!rows[0]) return res.status(404).json({ error: "User tidak ditemukan." });
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    next(err);
  }
});

export default router;
