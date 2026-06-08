// Utility murni: format angka/tanggal & helper status.
// Tidak menyentuh state aplikasi — aman dipakai ulang di mana saja.

import { COLORS, STATUS_THRESHOLDS } from "../constants.js";

export const MONTHS_ID = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];

export function formatDate(isoDate) {
  const d = new Date(isoDate);
  return `${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatRupiah(amount) {
  // Full format with thousand separators (e.g. Rp 1.000.000) — no Jt/Rb/M
  // abbreviation, so figures are always exact across the whole app.
  const num = Math.round(Number(amount) || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export function formatRupiahFull(amount) {
  const num = Math.round(Number(amount) || 0);
  return `Rp ${num.toLocaleString("id-ID")}`;
}

export function formatDateTime(isoDt) {
  const d = new Date(isoDt);
  const date = formatDate(isoDt);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${date}, ${time}`;
}

export function getScoreStatus(score) {
  if (score === 0) return { label: "Belum Mulai", color: COLORS.textLight, bg: COLORS.bgMuted };
  if (score >= STATUS_THRESHOLDS.onTrack) return { label: "On Track", color: COLORS.success, bg: COLORS.successBg };
  if (score >= STATUS_THRESHOLDS.attention) return { label: "Perlu Perhatian", color: COLORS.warning, bg: COLORS.warningBg };
  return { label: "Tertinggal", color: COLORS.danger, bg: COLORS.dangerBg };
}

export function getProjectStatusInfo(status) {
  switch (status) {
    case "on_track": return { label: "On Track",   color: COLORS.success,   bg: COLORS.successBg };
    case "at_risk":  return { label: "Perhatian",  color: COLORS.warning,   bg: COLORS.warningBg };
    case "behind":   return { label: "Tertinggal", color: COLORS.danger,    bg: COLORS.dangerBg };
    case "done":     return { label: "Selesai",    color: COLORS.primary,   bg: COLORS.infoBg };
    default:         return { label: status,       color: COLORS.textMuted, bg: COLORS.bgMuted };
  }
}

// Kunci & objek periode untuk BULAN BERJALAN (mengikuti tanggal hari ini).
export function getCurrentPeriodKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
export function getCurrentPeriod() {
  const now = new Date();
  return { key: getCurrentPeriodKey(), label: `${MONTHS_ID[now.getMonth()]} ${now.getFullYear()}`, type: "month" };
}

export function getAvailablePeriods() {
  // Dinamis: 12 bulan terakhir (terlama → terbaru) + YTD tahun berjalan.
  // Bulan berjalan selalu ada & jadi default, jadi periode tidak pernah basi.
  const now = new Date();
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: `${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`,
      type: "month",
    });
  }
  out.push({ key: `ytd-${now.getFullYear()}`, label: `YTD ${now.getFullYear()}`, type: "ytd" });
  return out;
}

export function isDateInPeriod(isoDate, period) {
  if (!isoDate) return false;
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12

  if (period.type === "ytd") {
    const ytdYear = parseInt(period.key.split("-")[1], 10);
    return year === ytdYear;
  }

  // Month type: key is "YYYY-MM"
  const [pYear, pMonth] = period.key.split("-").map(n => parseInt(n, 10));
  return year === pYear && month === pMonth;
}

export function getAuditActionInfo(action) {
  switch (action) {
    case "create":  return { label: "Buat",    icon: "plus",        color: COLORS.primary,   bg: COLORS.infoBg };
    case "update":  return { label: "Ubah",    icon: "edit",        color: COLORS.warning,   bg: COLORS.warningBg };
    case "approve": return { label: "Approve", icon: "check",       color: COLORS.success,   bg: COLORS.successBg };
    case "reject":  return { label: "Reject",  icon: "x",           color: COLORS.danger,    bg: COLORS.dangerBg };
    case "close":   return { label: "Closing", icon: "lock",        color: COLORS.secondary, bg: COLORS.goldLight };
    case "delete":  return { label: "Hapus",   icon: "trash",       color: COLORS.danger,    bg: COLORS.dangerBg };
    default:        return { label: action,    icon: "info",        color: COLORS.textMuted, bg: COLORS.bgMuted };
  }
}

export function evalFormula(expr, vars) {
  if (!expr || !expr.trim()) return { ok: false, error: "Rumus kosong" };

  // 1. Substitute variable names with their numeric values.
  // Sort names by length desc so longer names match before shorter substrings.
  let work = expr;
  const names = Object.keys(vars).sort((a, b) => b.length - a.length);
  for (const nm of names) {
    if (!nm.trim()) continue;
    const val = Number(vars[nm]);
    const safeVal = isNaN(val) ? 0 : val;
    // Escape regex special chars in the name
    const escaped = nm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match the name as a whole token (not part of a larger word)
    const re = new RegExp(`(^|[^A-Za-z0-9_])${escaped}(?![A-Za-z0-9_])`, "gi");
    work = work.replace(re, (m, pre) => `${pre}(${safeVal})`);
  }

  // 2. After substitution, only digits, operators, parens, dot, spaces allowed.
  if (/[A-Za-z_]/.test(work)) {
    // Find the leftover token for a helpful error
    const leftover = (work.match(/[A-Za-z_][A-Za-z0-9_ ]*/) || ["?"])[0].trim();
    return { ok: false, error: `Nama tidak dikenal: "${leftover}"` };
  }
  if (/[^0-9+\-*/().\s]/.test(work)) {
    return { ok: false, error: "Ada karakter tidak valid dalam rumus" };
  }

  // 3. Tokenize.
  const tokens = work.match(/\d+\.?\d*|[+\-*/()]/g);
  if (!tokens) return { ok: false, error: "Rumus tidak valid" };

  // 4. Shunting-yard → RPN.
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 };
  const out = [];
  const ops = [];
  let prevType = null; // "num" | "op" | "(" | ")"
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
      // Operator. Handle unary minus/plus.
      let op = t;
      if ((op === "-" || op === "+") && (prevType === null || prevType === "op" || prevType === "(")) {
        // Unary: convert to (0 op x) by pushing 0 first
        out.push(0);
      }
      while (
        ops.length &&
        ops[ops.length - 1] !== "(" &&
        prec[ops[ops.length - 1]] >= prec[op]
      ) {
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

  // 5. Evaluate RPN.
  const stack = [];
  for (const tok of out) {
    if (typeof tok === "number") {
      stack.push(tok);
    } else {
      const b = stack.pop();
      const a = stack.pop();
      if (a === undefined || b === undefined) return { ok: false, error: "Rumus tidak lengkap" };
      let r;
      if (tok === "+") r = a + b;
      else if (tok === "-") r = a - b;
      else if (tok === "*") r = a * b;
      else if (tok === "/") r = b === 0 ? 0 : a / b;
      stack.push(r);
    }
  }
  if (stack.length !== 1) return { ok: false, error: "Rumus tidak lengkap" };
  return { ok: true, value: stack[0] };
}

// Arah penilaian: hormati field.direction eksplisit (Form Builder), lalu fallback tebak nama.
export function getFieldDirection(field) {
  if (field?.direction === "lower_better" || field?.direction === "higher_better") {
    return field.direction;
  }
  const name = (field?.name || "").toLowerCase();
  // Lower-is-better: costs, cost-of-goods, feed-conversion, losses
  const lowerBetterKeywords = ["biaya", "hpp", "fcr", "stock loss", "loss", "kerugian"];
  if (lowerBetterKeywords.some(k => name.includes(k))) return "lower_better";
  // Everything else (omset, margin, sr, panen, transaksi, agen, pelanggan…) higher is better
  return "higher_better";
}

// Pencapaian per field: hitung mentah sesuai arah, lalu batasi ke [floor, cap].
export function computeFieldAchievement(field, target, actual) {
  const dir = getFieldDirection(field);
  const t = Number(target) || 0;
  const a = Number(actual) || 0;
  let raw;
  if (dir === "lower_better") {
    raw = a <= 0 ? 0 : (t / a) * 100;
  } else {
    raw = t <= 0 ? 0 : (a / t) * 100;
  }
  const cap = Number.isFinite(Number(field?.capPct)) ? Number(field.capPct) : 120;
  const floor = Number.isFinite(Number(field?.floorPct)) ? Number(field.floorPct) : 0;
  return Math.min(cap, Math.max(floor, raw));
}

export function formatFieldValue(value, satuan, type) {
  if (value === undefined || value === null || value === "") return "—";
  if (type === "date") return value;
  if (type === "text") return value;

  const num = Number(value);
  if (isNaN(num)) return String(value);

  if (satuan === "Rp") return formatRupiahFull(num);
  if (satuan === "Rp/kg") return `${formatRupiahFull(num)} /kg`;
  if (satuan === "%" || satuan === "x") {
    return `${num.toFixed(satuan === "x" ? 2 : 1)} ${satuan}`;
  }
  // ekor, kg, etc → integer with thousand separator
  return `${num.toLocaleString("id-ID")} ${satuan}`.trim();
}
