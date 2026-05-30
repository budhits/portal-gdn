// Konstanta & konfigurasi global aplikasi.
// Dipisah dari App.jsx agar mudah ditemukan & dipakai ulang oleh modul lain.

export const APP_CONFIG = {
  name: "Portal GDN",
  version: "2.0.0-prototype",
  period: "Mei 2026",
};

// (Logo GDN dipindah ke ./assets/logo.js — diimpor di atas)

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

  // Charcoal (header/nav) — dari website GDN
  dark: "#1E1E24",
  darker: "#16161A",
  text: "#2E2E36",
  textMuted: "#6B6B76",
  textLight: "#9C9CA6",
  border: "#E4E4E7",
  bg: "#FAFAF8",
  bgMuted: "#F2F2EF",
  white: "#FFFFFF",

  // Brand gold accent for nav/logo
  gold: "#C9A45C",
  goldLight: "#E8DCC0",
};

// Brand typography
export const FONTS = {
  body: "'Plus Jakarta Sans', 'Segoe UI', sans-serif",
  heading: "'Bricolage Grotesque', 'Plus Jakarta Sans', sans-serif",
};

export const STATUS_THRESHOLDS = {
  onTrack: 90,
  attention: 70,
};
