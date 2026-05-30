// Test regresi scoring engine — memastikan hasil hitung tetap identik dengan
// engine di src/App.jsx. Jalankan: node --test  (dari folder server/)

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeFieldValues, deriveScoreFromSubmission, deriveMarginFromSubmission,
  computeFieldAchievement, evalFormula,
} from "../src/lib/scoring.js";

// Template Kolam Deder (subset field yang relevan, id = field_key).
const deder = {
  id: "tpl-kolam-deder", frequency: "cycle",
  fields: [
    { id: "f3",  name: "Tebar",                     type: "number" },
    { id: "f4",  name: "SR",                        type: "number" },
    { id: "f5",  name: "Bobot_per_Ekor",            type: "number" },
    { id: "f6",  name: "FCR",                       type: "number" },
    { id: "f7",  name: "Harga_Jual",                type: "number" },
    { id: "f8",  name: "Harga_Benih_per_ekor",      type: "number" },
    { id: "f9",  name: "Harga_Pakan",               type: "number" },
    { id: "f10", name: "Biaya_Borongan_Panen",      type: "number" },
    { id: "f11", name: "Biaya_per_kg_Panen",        type: "number" },
    { id: "f12", name: "Biaya_Pemeliharaan_per_kg", type: "number" },
    { id: "f13", name: "Biaya_CapEx",               type: "number" },
    { id: "f14", name: "Biaya_Lain-lain",           type: "number" },
    { id: "f15", name: "Panen",        type: "auto", formulaId: "panen_dari_sr" },
    { id: "f16", name: "Berat_Panen",  type: "auto", formulaId: "berat_dari_bobot" },
    { id: "f17", name: "Pakan",        type: "auto", formulaId: "pakan_dari_fcr" },
    { id: "f18", name: "HPP_Benih",    type: "auto", formulaId: "hpp_benih_ekor" },
    { id: "f19", name: "HPP_Pakan",    type: "auto", formulaId: "hpp_pakan" },
    { id: "f20", name: "Total_Biaya",  type: "auto", formulaId: "total_biaya_komponen" },
    { id: "f21", name: "HPP",          type: "auto", formulaId: "hpp_dari_total" },
    { id: "f22", name: "Omset",        type: "auto", formulaId: "omset" },
    { id: "f23", name: "Margin",       type: "auto", formulaId: "margin_dari_total", isMargin: true },
  ],
};

const sub001Actual = { f3: 12000, f4: 85, f5: 250, f6: 1.24, f7: 22000, f8: 150, f9: 12500, f10: 1800000, f11: 1300, f12: 8500, f13: 3000000, f14: 1200000 };

test("computeFieldValues: rantai formula kolam deder benar", () => {
  const v = computeFieldValues(deder, sub001Actual);
  assert.equal(v["Panen"], 10200);
  assert.equal(v["Berat_Panen"], 2550);
  assert.equal(v["Pakan"], 3162);
  assert.equal(v["HPP_Benih"], 1800000);
  assert.equal(v["HPP_Pakan"], 39525000);
  assert.equal(v["Total_Biaya"], 72315000);
  assert.equal(v["Omset"], 56100000);
  assert.equal(v["Margin"], -16215000);
});

test("deriveMarginFromSubmission: sub-001 menghasilkan margin (rugi)", () => {
  const sub = { templateId: deder.id, status: "closed",
    estimatedValues: sub001Actual, actualValues: sub001Actual, fieldWeights: {} };
  const m = deriveMarginFromSubmission(sub, deder);
  assert.equal(m.actual, -16215000);
  assert.equal(m.hasMargin, false); // margin negatif -> tidak dihitung di agregasi
});

test("deriveScoreFromSubmission: bobot field menghasilkan skor bulat", () => {
  const sub = {
    templateId: deder.id, status: "closed",
    estimatedValues: { f3: 12000, f4: 85, f5: 250, f6: 1.2, f7: 22000, f8: 150, f9: 12000, f10: 1500000, f11: 1200, f12: 8000, f13: 3000000, f14: 1000000 },
    actualValues: sub001Actual,
    fieldWeights: { f4: 25, f6: 25, f21: 25, f23: 25 },
  };
  const score = deriveScoreFromSubmission(sub, deder);
  assert.equal(typeof score, "number");
  assert.equal(score, 73);
});

test("computeFieldAchievement: arah lower_better untuk biaya/FCR", () => {
  // FCR lower better: target 1.2, actual 1.0 -> 120%
  assert.equal(Math.round(computeFieldAchievement({ name: "FCR" }, 1.2, 1.0)), 120);
  // Omset higher better: target 100, actual 120 -> 120%
  assert.equal(Math.round(computeFieldAchievement({ name: "Omset" }, 100, 120)), 120);
});

test("evalFormula: evaluator aman menghitung ekspresi", () => {
  const r = evalFormula("(A + B) * 2", { A: 3, B: 7 });
  assert.equal(r.ok, true);
  assert.equal(r.value, 20);
  assert.equal(evalFormula("A / B", { A: 10, B: 0 }).value, 0); // bagi nol -> 0
});
