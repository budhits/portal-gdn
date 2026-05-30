// Helper bersama untuk project: hitung ulang statistik & otorisasi edit.

import { query } from "../db.js";

/**
 * Hitung ulang milestones_total, milestones_done, budget_spent sebuah project
 * dari tabel milestones & expenses (sumber kebenaran).
 */
export async function recomputeProjectStats(projectId, client) {
  const runner = client || { query };
  await runner.query(
    `UPDATE projects p SET
       milestones_total = (SELECT count(*) FROM milestones m WHERE m.project_id = p.id),
       milestones_done  = (SELECT count(*) FROM milestones m WHERE m.project_id = p.id AND m.done),
       budget_spent     = COALESCE((SELECT sum(amount) FROM expenses e WHERE e.project_id = p.id), 0)
     WHERE p.id = $1`,
    [projectId]
  );
}

export async function loadProject(id) {
  const { rows } = await query("SELECT id, unit_id, sub_unit_id, name FROM projects WHERE id = $1", [id]);
  return rows[0] || null;
}

export async function loadActor(userId) {
  const { rows } = await query("SELECT id, role, unit_id, sub_unit_id FROM users WHERE id = $1", [userId]);
  return rows[0] || null;
}

/**
 * Boleh mengedit project (milestone/expense): Owner (semua),
 * Leader (unitnya), PIC (sub-unitnya, atau project level-unit di unitnya).
 */
export function canEditProject(actor, project) {
  if (!actor || !project) return false;
  if (actor.role === "admin" || actor.role === "owner") return true;
  if (actor.role === "leader") return project.unit_id === actor.unit_id;
  if (actor.role === "pic") {
    if (project.sub_unit_id && project.sub_unit_id === actor.sub_unit_id) return true;
    if (project.sub_unit_id === null && project.unit_id === actor.unit_id) return true;
  }
  return false;
}
