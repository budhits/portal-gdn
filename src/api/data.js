// Pengambil data domain dari backend + util untuk memuat semuanya sekaligus
// (bootstrap) setelah login.

import { apiFetch } from "./client.js";

export const fetchUnits        = () => apiFetch("/units");
export const fetchUsers        = () => apiFetch("/users");
export const fetchSubUnits     = () => apiFetch("/sub-units");
export const fetchProjects     = () => apiFetch("/projects");
export const fetchTemplates    = () => apiFetch("/templates");
export const fetchSubmissions  = () => apiFetch("/submissions");
export const fetchAudit        = () => apiFetch("/audit");
export const fetchMilestones   = () => apiFetch("/milestones");
export const fetchExpenses     = () => apiFetch("/expenses");

/** Kelompokkan array ber-`projectId` menjadi objek { projectId: [item...] }. */
export function groupByProject(arr) {
  const out = {};
  for (const item of arr) (out[item.projectId] = out[item.projectId] || []).push(item);
  return out;
}

// ── Mutasi milestone & expense ───────────────────────────────────────────────
export const createMilestone = (body)     => apiFetch("/milestones", { method: "POST", body });
export const updateMilestone = (id, body) => apiFetch(`/milestones/${id}`, { method: "PATCH", body });
export const deleteMilestone = (id)       => apiFetch(`/milestones/${id}`, { method: "DELETE" });
export const createExpense   = (body)     => apiFetch("/expenses", { method: "POST", body });

// ── Mutasi user (Owner) ──────────────────────────────────────────────────────
export const createUser = (body)     => apiFetch("/users", { method: "POST", body });
export const updateUser = (id, body) => apiFetch(`/users/${id}`, { method: "PATCH", body });
export const deleteUser = (id)       => apiFetch(`/users/${id}`, { method: "DELETE" });

// ── Mutasi unit bisnis (Owner) ───────────────────────────────────────────────
export const createUnit = (body)     => apiFetch("/units", { method: "POST", body });
export const updateUnit = (id, body) => apiFetch(`/units/${id}`, { method: "PATCH", body });
export const deleteUnit = (id)       => apiFetch(`/units/${id}`, { method: "DELETE" });

// ── Mutasi form template (Owner/Admin) ───────────────────────────────────────
export const createTemplate = (body)     => apiFetch("/templates", { method: "POST", body });
export const updateTemplate = (id, body) => apiFetch(`/templates/${id}`, { method: "PATCH", body });
export const deleteTemplate = (id)       => apiFetch(`/templates/${id}`, { method: "DELETE" });

// ── Mutasi sub-unit (Owner/Leader) ───────────────────────────────────────────
export const createSubUnit = (body)     => apiFetch("/sub-units", { method: "POST", body });
export const updateSubUnit = (id, body) => apiFetch(`/sub-units/${id}`, { method: "PATCH", body });
export const deleteSubUnit = (id)       => apiFetch(`/sub-units/${id}`, { method: "DELETE" });

// ── Mutasi project (Owner/Leader) ────────────────────────────────────────────
export const createProject = (body)     => apiFetch("/projects", { method: "POST", body });
export const updateProject = (id, body) => apiFetch(`/projects/${id}`, { method: "PATCH", body });
export const deleteProject = (id)       => apiFetch(`/projects/${id}`, { method: "DELETE" });

// ── Alur KPI submission ──────────────────────────────────────────────────────
export const createSubmission       = (body)     => apiFetch("/submissions", { method: "POST", body });
export const approveSubmission      = (id, body) => apiFetch(`/submissions/${id}/approve`, { method: "POST", body });
export const rejectSubmission       = (id, body) => apiFetch(`/submissions/${id}/reject`, { method: "POST", body });
export const closeSubmission        = (id, body) => apiFetch(`/submissions/${id}/close`, { method: "POST", body });
export const updateSubmissionActual = (id, body) => apiFetch(`/submissions/${id}`, { method: "PATCH", body });
export const saveDailyMargin        = (id, dailyMargin) => apiFetch(`/submissions/${id}`, { method: "PATCH", body: { dailyMargin } });

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
