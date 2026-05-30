// Agregasi dashboard per-periode — di-port dari src/App.jsx:
//   getSubUnitSnapshotForPeriod, calculateUnitScoreForPeriod,
//   calculateUnitMarginForPeriod, calculateGrandTotalMarginForPeriod.

import { query } from "../db.js";
import { getTemplatesMap } from "./repository.js";
import {
  deriveScoreFromSubmission, deriveMarginFromSubmission,
  isDateInPeriod, getScoreStatus,
} from "./scoring.js";

// Snapshot skor sebuah sub-unit dalam satu periode (dari closing yang masuk periode).
function subUnitSnapshot(subUnitId, period, submissions, templates) {
  const matches = submissions.filter((s) =>
    s.subUnitId === subUnitId && s.status === "closed" && s.closedAt && isDateInPeriod(s.closedAt, period)
  );
  if (matches.length === 0) return null;

  const scoreOf = (s) => deriveScoreFromSubmission(s, templates[s.templateId]) ?? 0;
  const latest = matches.reduce((a, b) => (new Date(a.closedAt) > new Date(b.closedAt) ? a : b));

  if (period.type === "ytd") {
    const scores = matches
      .map((s) => deriveScoreFromSubmission(s, templates[s.templateId]))
      .filter((v) => v !== null);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { subUnitId, score: avg, weight: latest.subUnitWeight || 0, closedAt: latest.closedAt };
  }
  return { subUnitId, score: scoreOf(latest), weight: latest.subUnitWeight || 0, closedAt: latest.closedAt };
}

// Skor tertimbang sebuah unit dalam periode.
function unitScore(unitId, subUnits, period, submissions, templates) {
  const subs = subUnits.filter((s) => s.unitId === unitId);
  let totalWeight = 0, weightedSum = 0, contributing = 0;
  for (const su of subs) {
    const snap = subUnitSnapshot(su.id, period, submissions, templates);
    if (!snap) continue;
    weightedSum += snap.score * snap.weight;
    totalWeight += snap.weight;
    contributing++;
  }
  const score = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
  return { score, contributingCount: contributing, totalSubUnits: subs.length };
}

// Margin tertimbang sebuah unit dalam periode (closed = dihitung, lainnya = pending).
function unitMargin(unitId, period, submissions, templates) {
  let target = 0, actual = 0, pendingTotal = 0, closedCount = 0;
  for (const s of submissions.filter((x) => x.unitId === unitId)) {
    const m = deriveMarginFromSubmission(s, templates[s.templateId]);
    if (!m.hasMargin && m.target <= 0) continue;
    if (s.status === "closed" && isDateInPeriod(s.closedAt, period)) {
      target += m.target; actual += m.actual; closedCount++;
    } else if (s.status === "approved" || s.status === "estimated") {
      pendingTotal += m.target;
    }
  }
  const percentage = target > 0 ? Math.round((actual / target) * 100) : 0;
  return { target, actual, percentage, closedCount, pendingTotal };
}

/**
 * Bangun ringkasan dashboard untuk satu periode.
 */
export async function buildDashboard(period) {
  const [{ rows: units }, { rows: subUnitsRaw }, templates] = await Promise.all([
    query("SELECT id, name FROM units ORDER BY name"),
    query("SELECT id, unit_id FROM sub_units"),
    getTemplatesMap(),
  ]);
  const { rows: subRows } = await query("SELECT * FROM kpi_submissions");
  const submissions = subRows.map((r) => ({
    id: r.id, templateId: r.template_id, subUnitId: r.sub_unit_id, unitId: r.unit_id,
    status: r.status, period: r.period,
    estimatedValues: r.estimated_values || {}, actualValues: r.actual_values,
    fieldWeights: r.field_weights || {}, subUnitWeight: r.sub_unit_weight, closedAt: r.closed_at,
  }));
  const subUnits = subUnitsRaw.map((r) => ({ id: r.id, unitId: r.unit_id }));

  let grandTarget = 0, grandActual = 0, grandPending = 0;
  const unitRows = units.map((u) => {
    const score = unitScore(u.id, subUnits, period, submissions, templates);
    const margin = unitMargin(u.id, period, submissions, templates);
    grandTarget += margin.target; grandActual += margin.actual; grandPending += margin.pendingTotal;
    return {
      unitId: u.id,
      name: u.name,
      score: score.score,
      status: getScoreStatus(score.score),
      contributingCount: score.contributingCount,
      totalSubUnits: score.totalSubUnits,
      margin,
    };
  });

  const grandPct = grandTarget > 0 ? Math.round((grandActual / grandTarget) * 100) : 0;
  return {
    period,
    units: unitRows,
    grandTotal: { target: grandTarget, actual: grandActual, percentage: grandPct, pendingTotal: grandPending },
  };
}
