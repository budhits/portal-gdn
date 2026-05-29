// SCORING ENGINE — di-port dari src/App.jsx (§4) agar hasil hitung identik.
//
// Sumber kebenaran tunggal: kpi_submissions. Skor & margin sub-unit DITURUNKAN
// dari submission (tidak disimpan terpisah).
//
// Bentuk objek yang diharapkan fungsi di sini:
//   template = { id, frequency, fields: [{ id, name, type, formulaId, formulaExpr?, isMargin }] }
//             (field.id = "f1", "f2", ... = kunci di estimatedValues/actualValues/fieldWeights)
//   submission = { templateId, status, estimatedValues, actualValues, fieldWeights, subUnitWeight, closedAt, ... }

import { getFormula } from "./formulas.js";

export const STATUS_THRESHOLDS = { onTrack: 90, attention: 70 };

// ── Evaluator rumus aman (tanpa eval) untuk template buatan user ─────────────
export function evalFormula(expr, vars) {
  if (!expr || !expr.trim()) return { ok: false, error: "Rumus kosong" };

  let work = expr;
  const names = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const nm of names) {
    if (!nm.trim()) continue;
    const val = Number(vars[nm]);
    const safeVal = isNaN(val) ? 0 : val;
    const escaped = nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`(^|[^A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "gi");
    work = work.replace(re, (m, pre) => `${pre}(${safeVal})`);
  }

  if (/[A-Za-z_]/.test(work)) {
    const leftover = (work.match(/[A-Za-z_][A-Za-z0-9_ ]*/) || ["?"])[0].trim();
    return { ok: false, error: `Nama tidak dikenal: "${leftover}"` };
  }
  if (/[^0-9+\-*/().\s]/.test(work)) {
    return { ok: false, error: "Ada karakter tidak valid dalam rumus" };
  }

  const tokens = work.match(/\d+\.?\d*|[+\-*/()]/g);
  if (!tokens) return { ok: false, error: "Rumus tidak valid" };

  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const out = [];
  const ops = [];
  let prevType = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (/^\d/.test(t)) {
      out.push(parseFloat(t));
      prevType = "num";
    } else if (t === "(") {
      ops.push(t);
      prevType = "(";
    } else if (t === ")") {
      while (ops.length && ops[ops.length - 1] !== "(") out.push(ops.pop());
      if (!ops.length) return { ok: false, error: "Kurung tidak seimbang" };
      ops.pop();
      prevType = ")";
    } else {
      let op = t;
      if ((op === "-" || op === "+") && (prevType === null || prevType === "op" || prevType === "(")) {
        out.push(0);
      }
      while (ops.length && ops[ops.length - 1] !== "(" && prec[ops[ops.length - 1]] >= prec[op]) {
        out.push(ops.pop());
      }
      ops.push(op);
      prevType = "op";
    }
  }
  while (ops.length) {
    const o = ops.pop();
    if (o === "(") return { ok: false, error: "Kurung tidak seimbang" };
    out.push(o);
  }

  // Evaluasi RPN
  const st = [];
  for (const tok of out) {
    if (typeof tok === "number") {
      st.push(tok);
    } else {
      const b = st.pop();
      const a = st.pop();
      if (a === undefined || b === undefined) return { ok: false, error: "Rumus tidak valid" };
      let r;
      if (tok === "+") r = a + b;
      else if (tok === "-") r = a - b;
      else if (tok === "*") r = a * b;
      else if (tok === "/") r = b === 0 ? 0 : a / b;
      st.push(r);
    }
  }
  if (st.length !== 1) return { ok: false, error: "Rumus tidak valid" };
  return { ok: true, value: st[0] };
}

// ── Hitung nilai field (manual + auto) keyed by NAMA field ───────────────────
export function computeFieldValues(template, valuesByFieldId) {
  const byName = {};
  for (const field of template.fields) {
    if (field.type !== "auto") {
      byName[field.name] = valuesByFieldId[field.id] !== undefined
        ? Number(valuesByFieldId[field.id]) || valuesByFieldId[field.id]
        : 0;
    }
  }

  // 8 lewatan agar rantai dependensi terdalam (7 level) ikut terselesaikan.
  for (let pass = 0; pass < 8; pass++) {
    for (const field of template.fields) {
      if (field.type !== "auto") continue;
      if (field.formulaId) {
        const formula = getFormula(field.formulaId);
        if (!formula) continue;
        try {
          byName[field.name] = formula.compute(byName);
        } catch {
          byName[field.name] = 0;
        }
      } else if (field.formulaExpr) {
        const r = evalFormula(field.formulaExpr, byName);
        byName[field.name] = r.ok ? r.value : 0;
      }
    }
  }
  return byName;
}

// ── Arah penilaian field ─────────────────────────────────────────────────────
export function getFieldDirection(field) {
  const name = (field.name || "").toLowerCase();
  const lowerBetter = ["biaya", "hpp", "fcr", "stock loss", "loss", "kerugian"];
  if (lowerBetter.some((k) => name.includes(k))) return "lower_better";
  return "higher_better";
}

export function computeFieldAchievement(field, target, actual) {
  const dir = getFieldDirection(field);
  const t = Number(target) || 0;
  const a = Number(actual) || 0;
  if (dir === "lower_better") {
    if (a <= 0) return 0;
    return (t / a) * 100;
  }
  if (t <= 0) return 0;
  return (a / t) * 100;
}

// ── Turunkan skor sub-unit dari satu submission ──────────────────────────────
export function deriveScoreFromSubmission(submission, template) {
  if (!submission || !submission.actualValues || !template) return null;

  const targetVals = computeFieldValues(template, submission.estimatedValues || {});
  const actualVals = computeFieldValues(template, submission.actualValues || {});
  const weights = submission.fieldWeights || {};

  let weightedSum = 0;
  let totalWeight = 0;
  for (const fieldId of Object.keys(weights)) {
    const weight = Number(weights[fieldId]) || 0;
    if (weight <= 0) continue;
    const field = template.fields.find((f) => f.id === fieldId);
    if (!field) continue;
    const achievement = computeFieldAchievement(field, targetVals[field.name], actualVals[field.name]);
    weightedSum += achievement * weight;
    totalWeight += weight;
  }

  if (totalWeight <= 0) return null;
  return Math.round(weightedSum / totalWeight);
}

// ── Turunkan margin (target & actual) dari field bertanda isMargin ───────────
export function deriveMarginFromSubmission(submission, template) {
  const empty = { target: 0, actual: 0, hasMargin: false };
  if (!submission || !template) return empty;

  const marginField = template.fields.find((f) => f.isMargin);
  if (!marginField) return empty;

  const targetVals = computeFieldValues(template, submission.estimatedValues || {});
  const target = Number(targetVals[marginField.name]) || 0;

  let actual = 0;
  if (submission.actualValues) {
    const actualVals = computeFieldValues(template, submission.actualValues);
    actual = Number(actualVals[marginField.name]) || 0;
  }
  return { target, actual, hasMargin: target > 0 || actual > 0 };
}

// ── Status & periode ─────────────────────────────────────────────────────────
export function getScoreStatus(score) {
  if (!score || score === 0) return { label: "Belum Mulai", level: "none" };
  if (score >= STATUS_THRESHOLDS.onTrack) return { label: "On Track", level: "success" };
  if (score >= STATUS_THRESHOLDS.attention) return { label: "Perlu Perhatian", level: "warning" };
  return { label: "Tertinggal", level: "danger" };
}

export function getAvailablePeriods() {
  return [
    { key: "2026-02", label: "Feb 2026", type: "month" },
    { key: "2026-03", label: "Mar 2026", type: "month" },
    { key: "2026-04", label: "Apr 2026", type: "month" },
    { key: "2026-05", label: "Mei 2026", type: "month" },
    { key: "ytd-2026", label: "YTD 2026", type: "ytd" },
  ];
}

export function findPeriod(key) {
  return getAvailablePeriods().find((p) => p.key === key) || null;
}

export function isDateInPeriod(isoDate, period) {
  if (!isoDate || !period) return false;
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;

  if (period.type === "ytd") {
    const ytdYear = parseInt(period.key.split("-")[1], 10);
    return year === ytdYear;
  }
  const [pYear, pMonth] = period.key.split("-").map((n) => parseInt(n, 10));
  return year === pYear && month === pMonth;
}
