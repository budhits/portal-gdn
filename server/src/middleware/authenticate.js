// Middleware: pastikan request membawa token JWT valid di header Authorization.
// Menaruh data user ringkas di req.user = { id, role, name }.

import { verifyToken } from "../lib/auth.js";

export function authenticate(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token tidak ditemukan. Silakan login." });
  }

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ error: "Token tidak valid atau kedaluwarsa." });
  }
}

/**
 * Middleware: batasi akses ke peran tertentu.
 * Contoh: router.post("/", authenticate, requireRole("owner"), handler)
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Akses ditolak untuk peran Anda." });
    }
    next();
  };
}
