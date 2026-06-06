// Repository: ambil data dari PostgreSQL lalu bentuk ke shape yang dipakai
// scoring engine & API (camelCase). Memusatkan SQL agar rute tetap ringkas.

import { query } from "../db.js";
import {
  deriveScoreFromSubmission,
  deriveMarginFromSubmission,
  getScoreStatus,
} from "./scoring.js";

// ── Templates (dengan fields) ────────────────────────────────────────────────
// field.id = field_key ("f1") supaya cocok dengan kunci di JSON submission.
export async function getTemplatesMap() {
  const { rows: templates } = await query(
    `SELECT id, name, description, frequency, created_at FROM form_templates ORDER BY created_at`
  );
  const { rows: fields } = await query(
    `SELECT template_id, field_key, name, type, satuan, source, formula_id,
            formula_expr, default_weight, is_margin, direction, cap_pct, floor_pct, sort_order
       FROM form_fields ORDER BY template_id, sort_order`
  );

  const map = {};
  for (const t of templates) {
    map[t.id] = {
      id: t.id,
      name: t.name,
      description: t.description,
      frequency: t.frequency,
      createdAt: t.created_at,
      fields: [],
    };
  }
  for (const f of fields) {
    if (!map[f.template_id]) continue;
    map[f.template_id].fields.push({
      id: f.field_key,
      name: f.name,
      type: f.type,
      satuan: f.satuan,
      source: f.source,
      formulaId: f.formula_id,
      formulaExpr: f.formula_expr,
      defaultWeight: f.default_weight,
      isMargin: f.is_margin,
      direction: f.direction,
      capPct: f.cap_pct,
      floorPct: f.floor_pct,
    });
  }
  return map;
}

// ── Submissions ──────────────────────────────────────────────────────────────
const submissionRowToApi = (r) => ({
  id: r.id,
  templateId: r.template_id,
  subUnitId: r.sub_unit_id,
  unitId: r.unit_id,
  status: r.status,
  period: r.period,
  estimatedValues: r.estimated_values || {},
  actualValues: r.actual_values,
  fieldWeights: r.field_weights || {},
  subUnitWeight: r.sub_unit_weight,
  createdBy: r.created_by,
  createdAt: r.created_at,
  approvedBy: r.approved_by,
  approvedAt: r.approved_at,
  closedAt: r.closed_at,
  closingNote: r.closing_note,
  dailyMargin: r.daily_margin || null,
});

export async function getSubmissions(filters = {}) {
  const where = [];
  const params = [];
  const add = (sql, val) => { params.push(val); where.push(sql.replace("?", `$${params.length}`)); };

  if (filters.status) add("status = ?", filters.status);
  if (filters.subUnitId) add("sub_unit_id = ?", filters.subUnitId);
  if (filters.unitId) add("unit_id = ?", filters.unitId);
  if (filters.createdBy) add("created_by = ?", filters.createdBy);

  const sql = `SELECT * FROM kpi_submissions
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY created_at DESC`;
  const { rows } = await query(sql, params);
  return rows.map(submissionRowToApi);
}

export async function getSubmissionById(id) {
  const { rows } = await query("SELECT * FROM kpi_submissions WHERE id = $1", [id]);
  return rows[0] ? submissionRowToApi(rows[0]) : null;
}

/**
 * Lampirkan skor & margin turunan ke sebuah submission.
 * @param {object} submission shape API
 * @param {object} templatesMap hasil getTemplatesMap()
 */
export function enrichSubmission(submission, templatesMap) {
  const template = templatesMap[submission.templateId] || null;
  const score = deriveScoreFromSubmission(submission, template);
  const margin = deriveMarginFromSubmission(submission, template);
  return {
    ...submission,
    derived: {
      score,
      status: getScoreStatus(score || 0),
      marginTarget: margin.target,
      marginActual: submission.status === "closed" ? margin.actual : 0,
      hasMargin: margin.hasMargin,
    },
  };
}
