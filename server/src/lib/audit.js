// Helper pencatatan audit log untuk setiap mutasi penting.

import { query } from "../db.js";

/**
 * Catat satu entri audit.
 * @param {object} e
 * @param {string} e.actorId
 * @param {"create"|"update"|"approve"|"reject"|"close"|"delete"} e.action
 * @param {string} e.entityType
 * @param {string} e.entityId
 * @param {string} [e.entityLabel]
 * @param {string|null} [e.unitId]
 * @param {string|null} [e.details]
 * @param {object|null} [e.diff]
 * @param {import("pg").PoolClient} [client] - opsional, untuk dipakai dalam transaksi
 */
export async function logAudit(e, client) {
  const runner = client || { query };
  await runner.query(
    `INSERT INTO audit_log (actor_id, action, entity_type, entity_id, entity_label, unit_id, details, diff)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      e.actorId, e.action, e.entityType, e.entityId,
      e.entityLabel || "", e.unitId || null, e.details || null,
      e.diff ? JSON.stringify(e.diff) : null,
    ]
  );
}
