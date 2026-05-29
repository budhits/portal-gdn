// Fungsi autentikasi yang dipakai UI.

import { apiFetch, setToken, setStoredUser, getStoredUser, clearSession } from "./client.js";

/**
 * Login dengan email & password. Menyimpan token + user, lalu mengembalikan user.
 */
export async function login(email, password) {
  const data = await apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  setToken(data.token);
  setStoredUser(data.user);
  return data.user;
}

/** Ambil profil user dari token tersimpan (untuk validasi sesi saat reload). */
export async function fetchMe() {
  const data = await apiFetch("/auth/me");
  setStoredUser(data.user);
  return data.user;
}

export function logout() {
  clearSession();
}

export { getStoredUser };
