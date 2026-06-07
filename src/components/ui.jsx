// Komponen UI dasar (primitives) yang dipakai di seluruh aplikasi.
// Murni presentasional — hanya bergantung pada COLORS/FONTS, tanpa state aplikasi.

import { useState } from "react";
import { COLORS, FONTS, RADIUS } from "../constants.js";

export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.6, style }) {
  const paths = {
    dashboard: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></>,
    project: <><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></>,
    margin: <><line x1="12" y1="2" x2="12" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></>,
    kpi: <><line x1="3" y1="21" x2="21" y2="21"/><rect x="5" y="11" width="3" height="7"/><rect x="10.5" y="7" width="3" height="11"/><rect x="16" y="13" width="3" height="5"/></>,
    inbox: <><path d="M3 12h5l2 3h4l2-3h5"/><path d="M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/></>,
    audit: <><path d="M9 11l3 3 8-8"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></>,
    admin: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    workspace: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></>,
    building: <><rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 22v-4h6v4"/><line x1="9" y1="6" x2="9" y2="6"/><line x1="15" y1="6" x2="15" y2="6"/><line x1="9" y1="10" x2="9" y2="10"/><line x1="15" y1="10" x2="15" y2="10"/></>,
    chart: <><line x1="3" y1="21" x2="21" y2="21"/><polyline points="4 14 9 9 13 13 20 6"/></>,
    money: <><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    checkCircle: <><circle cx="12" cy="12" r="9"/><polyline points="16 9 11 14.5 8 11.5"/></>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    copy: <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></>,
    play: <><polygon points="6 4 20 12 6 20 6 4"/></>,
    lock: <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></>,
    fish: <><path d="M6.5 12c2-4 6-6 11-6 0 0-1 3-1 6s1 6 1 6c-5 0-9-2-11-6z"/><path d="M6.5 12C5 12 3 13 2 15c2 0 3-1 4.5-3z"/><circle cx="15" cy="10" r="0.6"/></>,
    cog: <><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l2.5 2.5M16.5 16.5L19 19M19 5l-2.5 2.5M7.5 16.5L5 19"/></>,
    store: <><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M3 9a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0"/></>,
    signal: <><path d="M5 12.55a8 8 0 0 1 14 0"/><path d="M8.5 16.5a4 4 0 0 1 7 0"/><line x1="12" y1="20" x2="12" y2="20"/></>,
    water: <><path d="M12 2.5S5 10 5 15a7 7 0 0 0 14 0c0-5-7-12.5-7-12.5z"/></>,
    bot: <><rect x="4" y="8" width="16" height="12" rx="2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><line x1="12" y1="4" x2="12" y2="8"/><circle cx="12" cy="3" r="1"/></>,
    info: <><circle cx="12" cy="12" r="9"/><line x1="12" y1="11" x2="12" y2="16"/><line x1="12" y1="8" x2="12" y2="8"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
    save: <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    warning: <><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    list: <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3" y2="6"/><line x1="3" y1="12" x2="3" y2="12"/><line x1="3" y1="18" x2="3" y2="18"/></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  };

  const path = paths[name] || paths.info;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke={color} strokeWidth={strokeWidth}
      strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, ...style }}
    >
      {path}
    </svg>
  );
}

export function Pill({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 9px",
      borderRadius: 99,
      background: bg,
      color: color,
      fontSize: 11.5,
      fontWeight: 700,
      lineHeight: 1.4,
    }}>
      {children}
    </span>
  );
}

export function Card({ children, style, onClick, hover }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.border}`,
        boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.2s",
        cursor: onClick ? "pointer" : "default",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        // Izinkan Card menyusut di dalam grid/flex (cegah tabel lebar mendorong
        // lebar halaman melebihi layar HP — overflow:auto di dalam baru berfungsi).
        minWidth: 0,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ProgressBar({ value, color, height = 8 }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div style={{
      height,
      background: COLORS.bgMuted,
      borderRadius: 99,
      overflow: "hidden",
    }}>
      <div style={{
        height: "100%",
        width: `${clamped}%`,
        background: color,
        borderRadius: 99,
        transition: "width 0.6s ease",
      }} />
    </div>
  );
}

// Kartu statistik terpadu — satu gaya untuk Dashboard, Margin, KPI.
// radius 16, garis aksen kiri 3px, angka besar Bricolage (tabular-nums).
export function StatCard({ label, value, valueColor, accent = COLORS.primary, sub, valueSize = 30, children }) {
  return (
    <div style={{
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderLeft: `3px solid ${accent}`,
      borderRadius: RADIUS.lg,
      padding: "14px 16px",
      minWidth: 0,
    }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      {value !== undefined && value !== null && (
        <div style={{
          fontFamily: FONTS.heading, fontSize: valueSize, fontWeight: 800,
          color: valueColor || accent, marginTop: 5, lineHeight: 1.05,
          fontVariantNumeric: "tabular-nums", letterSpacing: -0.5, wordBreak: "break-word",
        }}>{value}</div>
      )}
      {children && <div style={{ marginTop: 6 }}>{children}</div>}
      {sub && <div style={{ fontSize: 12.5, color: COLORS.textLight, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Button({ children, variant = "primary", onClick, disabled, size = "md", fullWidth }) {
  const VARIANTS = {
    primary:   { background: COLORS.primary, color: COLORS.white, border: "none" },
    secondary: { background: COLORS.white, color: COLORS.text, border: `1px solid ${COLORS.border}` },
    success:   { background: COLORS.success, color: COLORS.white, border: "none" },
    danger:    { background: COLORS.white, color: COLORS.danger, border: `1px solid ${COLORS.danger}` },
    ghost:     { background: "transparent", color: COLORS.textMuted, border: "none" },
    gold:      { background: COLORS.gold, color: "#2A2410", border: "none" },
  };

  const SIZES = {
    sm: { padding: "5px 10px", fontSize: 12 },
    md: { padding: "8px 14px", fontSize: 13 },
    lg: { padding: "10px 18px", fontSize: 14 },
  };

  const v = VARIANTS[variant];
  const s = SIZES[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v,
        ...s,
        borderRadius: RADIUS.sm,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "inherit",
        opacity: disabled ? 0.5 : 1,
        width: fullWidth ? "100%" : "auto",
        transition: "opacity 0.15s",
      }}
    >
      {children}
    </button>
  );
}

export function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
      gap: 10,
    }}>
      <div>
        <h2 style={{ margin: 0, fontFamily: FONTS.heading, fontSize: 18, fontWeight: 700, color: COLORS.dark, letterSpacing: -0.3 }}>{title}</h2>
        {subtitle && <p style={{ margin: "3px 0 0", fontSize: 13, color: COLORS.textMuted }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function InfoBanner({ icon, title, children, variant = "info" }) {
  const VARIANTS = {
    info:    { bg: COLORS.infoBg,    border: "#C5DBF0", color: COLORS.primaryDark },
    warning: { bg: COLORS.warningBg, border: "#EBD9B4", color: "#8A6420" },
    success: { bg: COLORS.successBg, border: "#CDE3C2", color: "#3F6E31" },
  };
  const v = VARIANTS[variant];
  const iconName = icon || "info";

  return (
    <div style={{
      padding: "12px 14px",
      background: v.bg,
      border: `1px solid ${v.border}`,
      borderRadius: 10,
      color: v.color,
    }}>
      {title && (
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name={iconName} size={15} color={v.color} /> {title}
        </div>
      )}
      <div style={{ fontSize: 13, lineHeight: 1.5, display: "flex", gap: 8 }}>
        {!title && <Icon name={iconName} size={15} color={v.color} style={{ marginTop: 1 }} />}
        <div>{children}</div>
      </div>
    </div>
  );
}
