// Helper untuk token JWT dan verifikasi password.

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-ganti-di-produksi";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/** Buat token untuk satu user. */
export function signToken(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/** Verifikasi token, mengembalikan payload atau melempar error. */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

/** Bandingkan password polos dengan hash di database. */
export function checkPassword(plain, hash) {
  if (!hash) return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}
