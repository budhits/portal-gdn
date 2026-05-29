// Pengambil data domain dari backend + util untuk memuat semuanya sekaligus
// (bootstrap) setelah login.

import { apiFetch } from "./client.js";

export const fetchUnits        = () => apiFetch("/units");
export const fetchUsers        = () => apiFetch("/users");
export const fetchSubUnits     = () => apiFetch("/sub-units");
export const fetchProjects     = () => apiFetch("/projects");
export const fetchTemplates    = () => apiFetch("/templates");
export const fetchSubmissions  = () => apiFetch("/submissions");

/** Ubah array ber-`id` menjadi objek ter-index berdasarkan id (mis. UNITS[id]). */
export function indexById(arr) {
  const map = {};
  for (const item of arr) map[item.id] = item;
  return map;
}

/**
 * Ambil seluruh dataset inti secara paralel.
 * @returns {Promise<{units, users, subUnits, projects, templates, submissions}>}
 */
export async function fetchAllCoreData() {
  const [units, users, subUnits, projects, templates, submissions] = await Promise.all([
    fetchUnits(),
    fetchUsers(),
    fetchSubUnits(),
    fetchProjects(),
    fetchTemplates(),
    fetchSubmissions(),
  ]);
  return { units, users, subUnits, projects, templates, submissions };
}
