// Konstanta & konfigurasi global aplikasi.
// Dipisah dari App.jsx agar mudah ditemukan & dipakai ulang oleh modul lain.
//
// ── REVISI DESIGN SYSTEM (drop-in) ───────────────────────────────────────────
// File ini adalah pengganti langsung untuk src/constants.js.
// Perubahan: palet netral dihangatkan & dipertajam, ditambah `goldDeep`.
// CATATAN: font (Bricolage Grotesque + Plus Jakarta Sans) kini DIMUAT di
// index.html — tanpa itu, FONTS di bawah jatuh ke fallback Segoe UI.

export const APP_CONFIG = {
  name: "Portal GDN",
  version: "2.0.0-prototype",
  period: "Mei 2026",
};

export const ROLES = {
  ADMIN: "admin",
  OWNER: "owner",
  FINANCE: "finance",
  HR: "hr",
  LEADER: "leader",
  PIC: "pic",
};

// Peran setingkat Owner ke atas (akses penuh fitur "owner-level").
export const OWNER_LEVEL_ROLES = [ROLES.ADMIN, ROLES.OWNER];
export const isOwnerLevel = (role) => OWNER_LEVEL_ROLES.includes(role);

export const ROLE_LABELS = {
  [ROLES.ADMIN]: "Administrator",
  [ROLES.OWNER]: "Owner",
  [ROLES.FINANCE]: "Finance",
  [ROLES.HR]: "HR",
  [ROLES.LEADER]: "Leader Unit",
  [ROLES.PIC]: "PIC Sub Unit",
};

export const COLORS = {
  // GDN brand palette
  // Primary accent = biru-air (elemen "aliran air" / perikanan)
  primary: "#3B7BC4",
  primaryDark: "#2C5F9E",
  // Secondary = krem/emas (brand GDN) — dipakai untuk sentuhan brand
  secondary: "#C9A45C",

  success: "#5B9B47",
  successBg: "#EAF3E5",
  warning: "#C98A2E",
  warningBg: "#FAF1E0",
  danger: "#C0453B",
  dangerBg: "#F8E7E5",
  info: "#3B7BC4",
  infoBg: "#E7F0F8",

  // Charcoal (header/nav) — sedikit lebih hangat & dalam, selaras logo
  dark: "#1C2128",
  darker: "#12161C",
  text: "#22262E",
  textMuted: "#5E6573",
  textLight: "#9298A6",
  border: "#E6E7EB",
  bg: "#F7F8F6",
  bgMuted: "#EEF0EC",
  white: "#FFFFFF",

  // Brand gold accent — gold (utama), goldDeep (tekan/hover), goldLight (latar)
  gold: "#C9A45C",
  goldDeep: "#A8823F",
  goldLight: "#EFE4CB",
};

// Brand typography (DIMUAT di index.html via Google Fonts)
export const FONTS = {
  body: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  heading: "'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif",
};

// Skala radius (ringkas dari 7 nilai → 4) — dipakai oleh ui.jsx
export const RADIUS = {
  sm: 8,    // tombol · input · chip
  md: 12,   // field · swatch · kontrol
  lg: 16,   // card · panel · modal
  pill: 999,
};

export const STATUS_THRESHOLDS = {
  onTrack: 90,
  attention: 70,
};
