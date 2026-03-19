/**
 * RiskUI.tsx — Shared risk indicator components.
 *
 * Two exports:
 *   RiskBadge  — pill badge (HIGH RISK / MEDIUM RISK / LOW RISK)
 *                Exact same design as ExtensionPopup .ep-badge-high/med/low
 *   RiskDot    — small coloured bullet with glow ring
 *                Exact same design as ExtensionPopup .ep-dot-red/amber/green
 *
 * Import from here anywhere badges or dots are needed.
 */

import { AlertTriangle, Shield } from "lucide-react";

export type Risk = "high" | "med" | "low";

// ─── RiskBadge ────────────────────────────────────────────────────────────────
// Matches EP: .ep-badge + .ep-badge-high / .ep-badge-med / .ep-badge-low

const BADGE_CONFIG: Record<Risk, {
  bg: string; border: string; color: string; label: string;
}> = {
  high: { bg: "#FEF2F2", border: "#FECACA", color: "#DC2626", label: "HIGH RISK"   },
  med:  { bg: "#FFFBEB", border: "#FDE68A", color: "#B45309", label: "MEDIUM RISK" },
  low:  { bg: "#D4E8DC", border: "#A8C8B5", color: "#3D6B4F", label: "LOW RISK"    },
} as const;

export function RiskBadge({ risk }: { risk: Risk }) {
  const c = BADGE_CONFIG[risk];
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 12px", borderRadius: 100,
        fontSize: 10, fontWeight: 800, letterSpacing: "0.06em",
        textTransform: "uppercase", whiteSpace: "nowrap",
        fontFamily: "'DM Sans', sans-serif",
        background: c.bg, border: `1px solid ${c.border}`, color: c.color,
      }}
    >
      {risk === "high" && <AlertTriangle size={10} strokeWidth={2.5} />}
      {risk === "low"  && <Shield        size={10} strokeWidth={2.5} />}
      {risk === "med"  && <span style={{ fontSize: 11, lineHeight: 1 }}>~</span>}
      {c.label}
    </span>
  );
}

// ─── RiskDot ──────────────────────────────────────────────────────────────────
// Matches EP: .ep-dot + .ep-dot-red / .ep-dot-amber / .ep-dot-green

const DOT_CONFIG: Record<Risk, { bg: string; glow: string }> = {
  high: { bg: "#EF4444", glow: "rgba(239,68,68,0.14)"   },
  med:  { bg: "#F59E0B", glow: "rgba(245,158,11,0.14)"  },
  low:  { bg: "#3D6B4F", glow: "rgba(61,107,79,0.14)"   },
} as const;

export function RiskDot({
  level,
  size = 8,
  marginTop = 4,
}: {
  level: Risk;
  size?: number;
  marginTop?: number;
}) {
  const d = DOT_CONFIG[level];
  return (
    <span
      style={{
        display: "inline-block",
        width: size, height: size,
        borderRadius: "50%",
        flexShrink: 0,
        marginTop,
        background: d.bg,
        boxShadow: `0 0 0 ${Math.round(size * 0.375)}px ${d.glow}`,
      }}
    />
  );
}
