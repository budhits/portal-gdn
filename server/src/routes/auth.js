// Rute autentikasi: login (email/password & Google) & profil user.

import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { query } from "../db.js";
import { signToken, checkPassword } from "../lib/auth.js";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

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

// POST /api/auth/google  { credential }  — login via Google Identity Services.
// Verifikasi ID token Google, lalu HANYA izinkan email yang sudah terdaftar.
router.post("/google", async (req, res, next) => {
  try {
    if (!googleClient) {
      return res.status(503).json({ error: "Login Google belum dikonfigurasi di server." });
    }
    const { credential } = req.body || {};
    if (!credential) return res.status(400).json({ error: "Credential Google tidak ada." });

    // Verifikasi tanda tangan & audience token (aman dari pemalsuan).
    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: "Token Google tidak valid." });
    }

    if (!payload?.email_verified) {
      return res.status(401).json({ error: "Email Google belum terverifikasi." });
    }
    const email = (payload.email || "").toLowerCase().trim();

    // Hanya email yang sudah terdaftar di User Manager yang boleh masuk.
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);
    const user = rows[0];
    if (!user) {
      return res.status(403).json({
        error: `Email ${email} belum terdaftar. Hubungi Administrator untuk didaftarkan.`,
      });
    }

    // Simpan foto profil Google bila user belum punya avatar.
    if (payload.picture && !user.avatar) {
      await query("UPDATE users SET avatar = $1 WHERE id = $2", [payload.picture, user.id]);
      user.avatar = payload.picture;
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

// POST /api/auth/change-password  (butuh token) — ubah password sendiri.
router.post("/change-password", authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "Password baru minimal 8 karakter." });
    }
    const { rows } = await query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    const user = rows[0];
    if (!user) return res.status(404).json({ error: "User tidak ditemukan." });

    // Bila user sudah punya password, wajib verifikasi password lama.
    // (Akun yang dibuat & hanya login via Google bisa menetapkan password pertama.)
    if (user.password_hash) {
      const ok = await checkPassword(currentPassword || "", user.password_hash);
      if (!ok) return res.status(401).json({ error: "Password lama salah." });
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user.id]);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
