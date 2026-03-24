import { useState, useEffect, useRef } from "react";
import { X, ExternalLink, Star, ChevronDown, Info } from "lucide-react";
import { loadModalPrefs, loadModalPrefsFromDb, type ModalDisplayPrefs } from "../lib/modalPrefs";
import { RiskBadge, RiskDot } from "./RiskUI";
import type { Risk } from "./RiskUI";

// ─── types ────────────────────────────────────────────────────────────────────
type ModalTab = "overview" | "clauses";

export interface SiteRowData {
  site:    string;
  type:    string;
  risk:    Risk;
  clauses: number;
  date:    string;
  saved?:  boolean;
}

export interface SiteDetailModalProps {
  site:          SiteRowData;
  onClose:       () => void;
  onSaveToggle:  (site: string) => void;
}

interface Clause {
  id:     number;
  level:  Risk;
  text:   string;
  detail: { short: string; medium: string; full: string };
  cat:    string;
  isNew?: boolean;
}

// ─── design tokens ────────────────────────────────────────────────────────────
const P = {
  ivory:      "#FDFAF5",
  ivoryDark:  "#F5EFE4",
  ivoryDeep:  "#E8DECE",           // darker body bg — creates card contrast
  espresso:   "#1C0D06",
  choco:      "#4A2E1C",
  chocoMid:   "#7A5236",
  chocoLight: "#B8916A",
  divider:    "#D9CAB8",
  // EP-aligned risk colours
  red:    "#EF4444",
  amber:  "#F59E0B",
  forest: "#3D6B4F",
  // expand panel tints (match EP "why it matters")
  redExpand:    "rgba(239,68,68,0.05)",
  amberExpand:  "rgba(245,158,11,0.05)",
  forestExpand: "rgba(61,107,79,0.05)",
  redBorder:    "rgba(239,68,68,0.32)",
  amberBorder:  "rgba(245,158,11,0.32)",
  forestBorder: "rgba(61,107,79,0.32)",
  // risk bar colours (sit on light header — slightly richer)
  redBar:    "#C8302A",
  amberBar:  "#B06A10",
  forestBar: "#2A6048",
} as const;

// helpers
const rBar  = (r: Risk) => r === "high" ? P.redBar : r === "med" ? P.amberBar : P.forestBar;
const expBg  = (r: Risk) => r === "high" ? P.redExpand    : r === "med" ? P.amberExpand  : P.forestExpand;
const expBdr = (r: Risk) => r === "high" ? P.redBorder    : r === "med" ? P.amberBorder  : P.forestBorder;

// ─── clause data ──────────────────────────────────────────────────────────────
const CLAUSES: Record<Risk, Clause[]> = {
  high: [
    {
      id: 1, level: "high", cat: "Data Sharing", isNew: true,
      text: "Your data may be sold to third-party advertisers without opt-out.",
      detail: {
        short:  "Your data can be sold to advertisers with no way to stop it.",
        medium: "The policy allows the platform to sell your personal data to advertising networks. There is no clear opt-out mechanism, and objecting may revoke core access.",
        full:   "Under this clause, the company reserves the right to transfer your personal data — including browsing behaviour, preferences, and demographics — to third-party ad networks for targeted advertising. There is no granular opt-out control. Declining consent may block access to core features of the service.",
      },
    },
    {
      id: 2, level: "high", cat: "Data Retention",
      text: "Usage data is retained indefinitely after account deletion.",
      detail: {
        short:  "Your data persists indefinitely even if you delete your account.",
        medium: "Even if you delete your account, usage data and interactions remain on their servers. No clear deletion timeline is provided.",
        full:   "This clause specifically states that anonymised or aggregated usage data derived from your account activity will be retained by the company indefinitely, even after you request account deletion. While technically 'anonymised', re-identification is possible through data combination with third-party datasets.",
      },
    },
    {
      id: 3, level: "high", cat: "Privacy", isNew: true,
      text: "The company may access private messages for moderation purposes.",
      detail: {
        short:  "Staff can read your private messages.",
        medium: "The platform grants itself the right to read private messages as part of 'content moderation'. No audit trail or clear trigger threshold is mentioned.",
        full:   "This provision allows the company's automated systems and human reviewers to access the content of private communications sent through the platform. The trigger for access is broadly defined as 'suspected violations' — leaving wide discretion to the company with no defined appeals process.",
      },
    },
  ],
  med: [
    {
      id: 4, level: "med", cat: "Data Collection",
      text: "Your location data is collected even when the app is closed.",
      detail: {
        short:  "Background location tracking is always active.",
        medium: "The app collects precise location in the background. You can disable this in device settings, but it may reduce functionality significantly.",
        full:   "Location data collection occurs continuously, including when the application is not actively in use. This data is used for personalised recommendations and is shared with analytics partners.",
      },
    },
    {
      id: 5, level: "med", cat: "Terms",
      text: "Terms may change at any time with only 7 days' email notice.",
      detail: {
        short:  "Terms can change with very little warning.",
        medium: "The company can modify any term with a 7-day email notice. Continued use counts as consent to new terms.",
        full:   "The policy grants the company unilateral right to modify any term of service with a 7-day notice window delivered via email. Continued use of the service after the notice period constitutes acceptance of all changes without requiring explicit re-consent.",
      },
    },
    {
      id: 6, level: "med", cat: "Sharing", isNew: true,
      text: "Inferred data about your behaviour may be shared with business partners.",
      detail: {
        short:  "Behavioural inferences about you can be shared.",
        medium: "The platform makes inferences about your personality and preferences, and may share these with business partners for unspecified commercial purposes.",
        full:   "Inferred profiles derived from your activity — including predicted preferences, purchase likelihood, and personality traits — may be shared with affiliated business partners. The scope of these inferences and the identity of partners is not transparently disclosed.",
      },
    },
  ],
  low: [
    {
      id: 7, level: "low", cat: "Analytics",
      text: "Anonymised analytics data is shared with performance monitoring tools.",
      detail: {
        short:  "Non-personal analytics data is used for performance tracking.",
        medium: "The service shares anonymised telemetry data with third-party performance tools to improve reliability and uptime.",
        full:   "Aggregated and anonymised performance metrics from your usage sessions are shared with approved third-party monitoring tools. No personal identifiers are included. This is standard practice for maintaining service quality.",
      },
    },
    {
      id: 8, level: "low", cat: "Cookies",
      text: "Essential cookies are used to maintain your session state.",
      detail: {
        short:  "Necessary cookies keep you logged in.",
        medium: "Session cookies are set for authentication and security purposes. They expire when you close your browser or after 30 days.",
        full:   "Strictly necessary cookies are deployed to maintain login state and protect against cross-site request forgery. These cannot be disabled without breaking core functionality. Non-essential cookies require separate consent.",
      },
    },
  ],
};

// ─── clause card ──────────────────────────────────────────────────────────────
// Uses EP-style dot + "WHY IT MATTERS" expand panel with risk-tinted colours.
function ClauseCard({
  clause, summaryLength, vPad,
}: {
  clause: Clause;
  summaryLength: ModalDisplayPrefs["summaryLength"];
  vPad: string;
}) {
  const [open, setOpen] = useState(false);
  const detail = clause.detail[summaryLength];

  return (
    <div style={{
      // Card sits on P.ivoryDeep body — use P.ivory so they pop clearly
      background: P.ivory,
      border: `1px solid ${P.divider}`,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 1px 4px rgba(28,13,6,0.07)",
    }}>
      {/* ── header row ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "flex-start",
          gap: 12, padding: vPad, background: "none", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        {/* EP-style dot */}
        <RiskDot level={clause.level} size={8} marginTop={5} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{
              fontFamily: "'DM Mono', monospace", fontSize: 10,
              color: P.chocoMid, textTransform: "uppercase", letterSpacing: "0.08em",
            }}>
              {clause.cat}
            </span>
            {clause.isNew && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                padding: "2px 7px", borderRadius: 99, textTransform: "uppercase",
                background:
                  clause.level === "high" ? "#FEF2F2"
                  : clause.level === "med"  ? "#FFFBEB"
                  : "#D4E8DC",
                color:
                  clause.level === "high" ? "#DC2626"
                  : clause.level === "med"  ? "#B45309"
                  : "#3D6B4F",
                border: `1px solid ${
                  clause.level === "high" ? "#FECACA"
                  : clause.level === "med"  ? "#FDE68A"
                  : "#A8C8B5"
                }`,
              }}>
                NEW
              </span>
            )}
          </div>
          <p style={{
            marginTop: 4, fontSize: 13, fontWeight: 500, color: P.espresso,
            lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif",
          }}>
            {clause.text}
          </p>
        </div>

        <ChevronDown
          size={14}
          style={{
            color: P.chocoLight, flexShrink: 0, marginTop: 4,
            transition: "transform 0.2s",
            transform: open ? "rotate(180deg)" : "none",
          }}
        />
      </button>

      {/* ── EP-style "WHY IT MATTERS" expand panel ── */}
      {open && (
        <div style={{
          background: expBg(clause.level),
          borderLeft: `2.5px solid ${expBdr(clause.level)}`,
          margin: "0 14px 12px 30px",
          padding: "9px 14px",
          borderRadius: "0 8px 8px 0",
        }}>
          <div style={{
            fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
            textTransform: "uppercase",
            color:
              clause.level === "high" ? P.red
              : clause.level === "med"  ? P.amber
              : P.forest,
            marginBottom: 5,
            fontFamily: "'DM Mono', monospace",
          }}>
            Why it matters
          </div>
          <p style={{
            fontSize: 12.5, color: P.chocoMid, lineHeight: 1.6,
            fontFamily: "'DM Sans', sans-serif", margin: 0,
          }}>
            {detail}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────
export default function SiteDetailModal({ site, onClose, onSaveToggle }: SiteDetailModalProps) {
  const [tab,   setTab]   = useState<ModalTab>("overview");
  const [saved, setSaved] = useState(!!site.saved);
  // Start from localStorage immediately; swap to DB version once fetched
  const [prefs, setPrefs] = useState<ModalDisplayPrefs>(loadModalPrefs());

  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync prefs from Supabase on mount — updates state so modal re-renders
  useEffect(() => {
    loadModalPrefsFromDb()
      .then(p => setPrefs(p))
      .catch(() => { /* keep localStorage prefs */ });
  }, []);

  // Derived layout vars from prefs
  const fs      = ({ small: 11.5, medium: 13, large: 15 } as const)[prefs.fontSize] ?? 13;
  const vPad    = prefs.compactMode ? "10px 16px" : "14px 18px";
  const bodyPad = prefs.compactMode ? "18px 22px" : "24px 28px";

  // Clause visibility filter
  const all: Clause[] = [...CLAUSES.high, ...CLAUSES.med, ...CLAUSES.low];
  const visible = all.filter(c => {
    if (prefs.riskLevel === "high")   return c.level === "high";
    if (prefs.riskLevel === "medium") return c.level !== "low";
    return true;
  });

  const riskScore = site.risk === "high" ? 82 : site.risk === "med" ? 51 : 22;
  const newCount  = CLAUSES[site.risk].filter(c => c.isNew).length;

  // Auto-expand clauses tab on open if setting is on
  useEffect(() => {
    if (prefs.autoExpand) setTab("clauses");
  }, [prefs.autoExpand]);

  // Escape key
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // Inject keyframes + scrollbar CSS once
  useEffect(() => {
    const id = "sdm-kf";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = `
      @keyframes modalUp {
        from { opacity:0; transform:translateY(28px) scale(0.98); }
        to   { opacity:1; transform:translateY(0)    scale(1);    }
      }
      .sdm-scroll::-webkit-scrollbar       { width:4px; }
      .sdm-scroll::-webkit-scrollbar-track { background:transparent; }
      .sdm-scroll::-webkit-scrollbar-thumb { background:${P.divider}; border-radius:4px; }
      .sdm-ghost:hover { background:rgba(184,145,106,0.18) !important; }
      .sdm-row:hover   { background:${P.ivoryDark} !important; }
      .sdm-tab:hover   { background:rgba(184,145,106,0.12) !important; }
      .sdm-foot-lnk:hover { background:rgba(74,46,28,0.07) !important; }
    `;
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, []);

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(12,5,2,0.62)",
        backdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "20px 12px",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: fs,
      }}
    >
      {/* ── modal sheet ───────────────────────────────────────────────────── */}
      <div style={{
        width: "100%", maxWidth: 580, maxHeight: "90vh",
        display: "flex", flexDirection: "column",
        background: P.ivoryDeep,           // slightly deeper — body cards will pop
        borderRadius: 20,
        boxShadow: "0 24px 64px rgba(28,13,6,0.30), 0 4px 12px rgba(28,13,6,0.14)",
        overflow: "hidden",
        animation: "modalUp 0.28s cubic-bezier(0.22,1,0.36,1) both",
        border: "1.5px solid rgba(255,255,255,0.55)",
      }}>

        {/* ── HEADER — light chocolate glassmorphism ───────────────────── */}
        <div style={{
          padding: "20px 22px 0",
          // Light warm-ivory frosted glass — no more dark espresso gradient
          background: "rgba(252, 243, 228, 0.80)",
          backdropFilter: "blur(24px) saturate(175%)",
          WebkitBackdropFilter: "blur(24px) saturate(175%)",
          borderBottom: `1.5px solid rgba(184,145,106,0.28)`,
          boxShadow: "0 2px 0 rgba(255,255,255,0.78) inset",
        }}>

          {/* top row: risk box  |  site info  |  badge  |  star + close */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 14 }}>

            {/* small risk-tinted box on left */}
            <div style={{
              width: 42, height: 42, borderRadius: 11, flexShrink: 0,
              background:
                site.risk === "high" ? "#FEF2F2"
                : site.risk === "med"  ? "#FFFBEB"
                : "#D4E8DC",
              border: `1.5px solid ${
                site.risk === "high" ? "#FECACA"
                : site.risk === "med"  ? "#FDE68A"
                : "#A8C8B5"
              }`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {/* a large dot in the box matches the clause-dot aesthetic */}
              <RiskDot level={site.risk} size={14} marginTop={0} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                fontFamily: "'Lora', serif", fontWeight: 700, fontSize: 18,
                color: P.espresso, margin: 0, lineHeight: 1.3,
              }}>
                {site.site}
              </h2>
              <p style={{ margin: "3px 0 0", fontSize: 11.5, color: P.chocoMid, fontWeight: 400 }}>
                {site.type} · Scanned {site.date}
              </p>
            </div>

            {/* star + close */}
            <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
              <button
                onClick={() => { setSaved(s => !s); onSaveToggle(site.site); }}
                className="sdm-ghost"
                style={{
                  width: 30, height: 30, borderRadius: 8, border: "none",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <Star
                  size={15}
                  fill={saved ? P.chocoLight : "none"}
                  color={saved ? P.chocoLight : P.chocoMid}
                  strokeWidth={1.8}
                />
              </button>
              <button
                onClick={onClose}
                className="sdm-ghost"
                style={{
                  width: 30, height: 30, borderRadius: 8, border: "none",
                  background: "transparent", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.15s",
                }}
              >
                <X size={15} color={P.chocoMid} strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* risk progress bar (Settings: showRiskBar) */}
          {prefs.showRiskBar && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{
                  fontSize: 10, color: P.chocoMid,
                  fontFamily: "'DM Mono', monospace", letterSpacing: "0.07em",
                }}>
                  RISK SCORE
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 700, color: rBar(site.risk),
                  fontFamily: "'DM Mono', monospace",
                }}>
                  {riskScore}/100
                </span>
              </div>
              <div style={{
                height: 5, background: "rgba(74,46,28,0.12)",
                borderRadius: 99, overflow: "hidden",
              }}>
                <div style={{
                  height: "100%", width: `${riskScore}%`,
                  background: `linear-gradient(90deg, ${rBar(site.risk)}88, ${rBar(site.risk)})`,
                  borderRadius: 99, transition: "width 0.5s cubic-bezier(0.22,1,0.36,1)",
                }} />
              </div>
            </div>
          )}

          {/* tab strip */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap" }}>
            {(["overview", "clauses"] as ModalTab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="sdm-tab"
                style={{
                  padding: "8px 16px", border: "none", cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
                  borderRadius: "8px 8px 0 0",
                  background: tab === t ? P.ivoryDeep : "transparent",
                  color: tab === t ? P.espresso : P.chocoLight,
                  transition: "all 0.15s", textTransform: "capitalize",
                }}
              >
                {t}
                {t === "clauses" && (
                  <span style={{
                    marginLeft: 6, fontSize: 10, fontWeight: 700,
                    padding: "2px 6px", borderRadius: 99,
                    background: tab === "clauses"
                      ? (site.risk === "high" ? "#FEF2F2" : site.risk === "med" ? "#FFFBEB" : "#D4E8DC")
                      : "rgba(74,46,28,0.10)",
                    color: tab === "clauses"
                      ? (site.risk === "high" ? "#DC2626" : site.risk === "med" ? "#B45309" : "#3D6B4F")
                      : P.chocoLight,
                  }}>
                    {visible.length}
                  </span>
                )}
              </button>
            ))}
            {/* risk badge — right end of tab strip */}
            <span style={{ marginLeft: "auto" }}>
              <RiskBadge risk={site.risk} />
            </span>          </div>
        </div>

        {/* ── BODY ──────────────────────────────────────────────────────── */}
        <div
          className="sdm-scroll"
          style={{
            flex: 1, overflowY: "auto",
            padding: bodyPad,
            // ivoryDeep is the base — ivory cards will float above it clearly
            background: P.ivoryDeep,
          }}
        >
          {tab === "overview" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>

              {/* quick stats */}
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { label: "Clauses",    value: site.clauses.toString() },
                  { label: "Risk Level", value: site.risk.toUpperCase() },
                  { label: "Type",       value: site.type.split(" ")[0] },
                  { label: "New",        value: newCount > 0 ? `${newCount} new` : "None" },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    flex: 1,
                    background: P.ivory,    // lighter card on darker body
                    borderRadius: 10,
                    padding: "11px 13px",
                    border: `1px solid ${P.divider}`,
                    boxShadow: "0 1px 3px rgba(28,13,6,0.06)",
                  }}>
                    <div style={{
                      fontSize: 9.5, fontWeight: 600, color: P.chocoLight,
                      textTransform: "uppercase", letterSpacing: "0.07em",
                      fontFamily: "'DM Mono', monospace",
                    }}>
                      {label}
                    </div>
                    <div style={{
                      marginTop: 5, fontSize: 14, fontWeight: 700, color: P.espresso,
                    }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              {/* summary */}
              <div style={{
                background: P.ivory, borderRadius: 12,
                padding: "16px 18px", border: `1px solid ${P.divider}`,
                boxShadow: "0 1px 3px rgba(28,13,6,0.06)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                  <Info size={13} color={P.chocoLight} />
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: P.chocoMid,
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    fontFamily: "'DM Mono', monospace",
                  }}>
                    Summary
                  </span>
                </div>
                <p style={{
                  fontSize: 13, color: P.choco, lineHeight: 1.7,
                  fontFamily: "'DM Sans', sans-serif", margin: 0,
                }}>
                  {site.site}'s policy contains{" "}
                  <strong>{site.clauses} flagged clauses</strong>{" "}
                  across {Math.max(2, Math.ceil(site.clauses / 3))} categories. The{" "}
                  <strong>{site.risk} risk</strong> rating reflects{" "}
                  {site.risk === "high"
                    ? "significant data sharing and retention concerns."
                    : site.risk === "med"
                    ? "moderate concerns around consent and notifications."
                    : "low-impact standard practices."}
                  {newCount > 0 &&
                    ` ${newCount} clause${newCount > 1 ? "s" : ""} flagged as recently updated.`}
                </p>
              </div>

              {/* top findings — EP dots here too */}
              <div>
                <p style={{
                  fontSize: 10, fontWeight: 700, color: P.chocoMid,
                  textTransform: "uppercase", letterSpacing: "0.08em",
                  fontFamily: "'DM Mono', monospace", marginBottom: 10,
                }}>
                  Top Findings
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {CLAUSES[site.risk].slice(0, 3).map(c => (
                    <div
                      key={c.id}
                      className="sdm-row"
                      onClick={() => setTab("clauses")}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: 11,
                        padding: "11px 14px", borderRadius: 10, cursor: "pointer",
                        background: P.ivory, border: `1px solid ${P.divider}`,
                        transition: "background 0.12s",
                        boxShadow: "0 1px 3px rgba(28,13,6,0.05)",
                      }}
                    >
                      <RiskDot level={c.level} size={8} marginTop={5} />
                      <p style={{
                        fontSize: 12.5, color: P.choco, lineHeight: 1.5, margin: 0,
                      }}>
                        {c.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            /* ── clauses tab ── */
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {visible.length === 0 ? (
                <div style={{
                  textAlign: "center", padding: "48px 0",
                  color: P.chocoLight, fontSize: 13,
                }}>
                  No clauses match the current filter settings.
                </div>
              ) : (
                visible.map(c => (
                  <ClauseCard
                    key={c.id}
                    clause={c}
                    summaryLength={prefs.summaryLength}
                    vPad={vPad}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* ── FOOTER ────────────────────────────────────────────────────── */}
        <div style={{
          padding: "13px 22px", display: "flex", alignItems: "center", gap: 10,
          borderTop: `1px solid rgba(184,145,106,0.30)`,
          background: "rgba(253,250,245,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}>
          <button
            onClick={() => { setSaved(s => !s); onSaveToggle(site.site); }}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${saved ? P.chocoMid : P.divider}`,
              background: saved ? P.chocoMid : "transparent",
              color: saved ? "#FDFAF5" : P.choco,
              transition: "all 0.18s",
            }}
          >
            {saved ? "★ Saved" : "☆ Save Site"}
          </button>

          <a
            href={`https://${site.site}`}
            target="_blank"
            rel="noopener noreferrer"
            className="sdm-foot-lnk"
            style={{
              flex: 1, padding: "9px 0", borderRadius: 10, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              border: `1.5px solid ${P.divider}`,
              background: "transparent", color: P.choco,
              textDecoration: "none",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              transition: "background 0.15s",
            }}
          >
            <ExternalLink size={13} />
            Open Site
          </a>

          <span style={{
            marginLeft: "auto", fontSize: 10.5,
            color: P.chocoLight, fontFamily: "'DM Mono', monospace",
            whiteSpace: "nowrap",
          }}>
            {site.clauses} clauses · {site.date}
          </span>
        </div>

      </div>
    </div>
  );
}
