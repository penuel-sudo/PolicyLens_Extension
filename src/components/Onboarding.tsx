import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap, Target, Shield, Check, FileText, Folders, HardDrive,
  Globe, AlertTriangle, AlertOctagon, Cookie, FolderOpen, CreditCard,
  Clock, Lock, Eye, CheckCircle,
} from "lucide-react";
import {
  saveConcerns, loadConcerns, syncConcernsToProfile,
  savePermissions, loadPermissions, syncPermissionsToProfile,
  completeOnboarding,
  type PermState,
} from "../lib/userPrefs";

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type Risk = "high" | "medium" | "low";

interface PrefCategory {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
  border: string;
  pills: string[];
}

interface MockClause {
  clause: string;
  risk: Risk;
  why: string;
}

/* ─── Responsive Hook ────────────────────────────────────────────────────────── */
function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth <= 768;
  });
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

/* ─── Shared Data ────────────────────────────────────────────────────────────── */
const PREF_CATEGORIES: PrefCategory[] = [
  {
    id: "privacy", label: "Privacy", emoji: "Lock", color: "#4A8C3F", bg: "#F0FAF0", border: "#C3E0BF",
    pills: ["Data collection", "Third-party sharing", "Profile building", "Location tracking", "Biometric data", "Cross-site tracking", "Data retention", "Anonymisation"],
  },
  {
    id: "cookies", label: "Cookies", emoji: "Cookie", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A",
    pills: ["Essential cookies", "Analytics tracking", "Ad targeting", "Session data", "Persistent cookies", "Third-party cookies"],
  },
  {
    id: "terms", label: "Terms", emoji: "FileText", color: "#5C3D2E", bg: "#FDF8F0", border: "#D4BFA8",
    pills: ["Auto-renewal", "Cancellation policy", "Arbitration clause", "Liability limits", "IP ownership", "Account termination", "Fee changes"],
  },
  {
    id: "data", label: "Data", emoji: "FolderOpen", color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE",
    pills: ["Right to delete", "Data portability", "Access requests", "GDPR", "CCPA rights", "Breach notice"],
  },
  {
    id: "financial", label: "Financial", emoji: "CreditCard", color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE",
    pills: ["Payment sharing", "Credit checks", "Subscription traps", "Hidden fees", "Refund policy", "Price changes"],
  },
];

const MOCK_CLAUSES: MockClause[] = [
  { clause: "Your data is sold to advertisers",     risk: "high",   why: "Third-party ad networks receive your browsing history and purchase data without explicit consent each session." },
  { clause: "Auto-renewal without any reminder",    risk: "medium", why: "Subscription renews silently 7 days before period ends. No email notice is legally required under their TOS." },
  { clause: "Arbitration waives your legal rights", risk: "high",   why: "You give up the right to join class-action lawsuits. All disputes go to private arbitration the company controls." },
  { clause: "Location tracked in background",       risk: "medium", why: "Background location is collected for 'service improvement' — opt-out is buried three levels deep in settings." },
];

/* ════════════════════════════════════════════════════════════════════════════
   MOBILE VARIANT  (≤ 768 px — 360 px fixed card, chrome header + footer)
   ════════════════════════════════════════════════════════════════════════════ */

const CM = {
  cream: "#FDF8F0",    creamDark: "#F5EBD8",  creamLine: "#EAD8C4",
  choco: "#5C3D2E",   chocoDeep: "#3E2518",  tan: "#B8966A", tanLight: "#D4BFA8",
  muted: "#9B8B7A",   text: "#2C1810",       sub: "#6B5744",
  green: "#4A8C3F",   greenLight: "#F0FAF0", greenLine: "#C3E0BF",
  red: "#EF4444",     redBg: "#FEE2E2",      redText: "#991B1B",
};

const M_STEPS = ["welcome", "how it works", "preview", "concerns", "permissions", "done"];

const M_RISK: Record<Risk, { bg: string; text: string; dot: string; label: string }> = {
  high:   { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", label: "HIGH" },
  medium: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "MED"  },
  low:    { bg: "#F0FAF0",  text: "#4A8C3F", dot: "#4A8C3F", label: "LOW" },
};

function MRiskBadge({ level }: { level: Risk }) {
  const r = M_RISK[level];
  return (
    <span style={{
      background: r.bg, color: r.text, fontSize: 9,
      fontFamily: "'DM Mono',monospace", fontWeight: 700,
      letterSpacing: "0.08em", padding: "2px 7px", borderRadius: 4,
      display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: r.dot, display: "inline-block" }} />
      {r.label}
    </span>
  );
}

function MBackBtn({ onClick }: { onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 5, background: "none",
        border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
        fontSize: 12, color: hover ? CM.choco : CM.muted, padding: "4px 0", transition: "color 0.15s",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

function MPrimaryBtn({ children, onClick, disabled = false }: {
  children: ReactNode; onClick?: () => void; disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "100%", padding: "14px 20px",
        background: disabled ? CM.tanLight : hover ? CM.chocoDeep : CM.choco,
        color: disabled ? CM.muted : CM.cream,
        fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 13.5,
        border: "none", borderRadius: 11, cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s", letterSpacing: "0.01em",
      }}
    >
      {children}
    </button>
  );
}

function MDots({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === current ? 20 : 6, height: 6, borderRadius: 3,
            background: i === current ? CM.choco : i < current ? CM.green : CM.tanLight,
            transition: "all 0.3s ease",
          }}
        />
      ))}
    </div>
  );
}

/* ── Mobile Screens ── */

function MWelcomeScreen({ onNext }: { onNext: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);
  const f = (d: number): CSSProperties => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? "translateY(0)" : "translateY(20px)",
    transition: `all 0.55s ease ${d}s`,
  });
  return (
    <div style={{ padding: "40px 26px 30px", textAlign: "center" }}>
      <div style={{ ...f(0), marginBottom: 28 }}>
        <div style={{
          width: 76, height: 76, borderRadius: "50%",
          border: `2.5px solid ${CM.green}`, background: CM.greenLight,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto",
          boxShadow: `0 0 0 8px ${CM.creamDark},0 0 0 9px ${CM.creamLine}`,
        }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="11" stroke={CM.green} strokeWidth="2" />
            <text x="18" y="23" textAnchor="middle" fontFamily="Lora,serif" fontWeight="700" fontSize="15" fill={CM.green}>P</text>
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <line
                key={i}
                x1={18 + 12 * Math.cos((deg * Math.PI) / 180)}
                y1={18 + 12 * Math.sin((deg * Math.PI) / 180)}
                x2={18 + 16 * Math.cos((deg * Math.PI) / 180)}
                y2={18 + 16 * Math.sin((deg * Math.PI) / 180)}
                stroke={CM.green} strokeWidth="1.5" strokeLinecap="round"
              />
            ))}
          </svg>
        </div>
      </div>
      <div style={{ ...f(0.1), marginBottom: 10 }}>
        <div style={{
          fontSize: 8.5, fontFamily: "'DM Mono',monospace", letterSpacing: "0.22em",
          color: CM.green, fontWeight: 700, marginBottom: 14,
        }}>POLICYLENS · AI EXTENSION</div>
        <h1 style={{
          fontFamily: "'Lora',serif", fontSize: 38, fontWeight: 700, color: CM.text,
          lineHeight: 1.1, margin: "0 0 14px", letterSpacing: "-0.025em",
        }}>
          Read less.<br />
          <em style={{ color: CM.choco, fontStyle: "italic" }}>Know more.</em>
        </h1>
      </div>
      <div style={{ ...f(0.18), marginBottom: 34 }}>
        <p style={{
          fontSize: 13.5, fontFamily: "'DM Sans',sans-serif", color: CM.sub,
          lineHeight: 1.7, margin: 0, maxWidth: 230, marginInline: "auto",
        }}>
          AI that decodes legal fine print — before you click <em>"I agree."</em>
        </p>
      </div>
      <div style={{ ...f(0.28) }}>
        <MPrimaryBtn onClick={onNext}>Get started →</MPrimaryBtn>
        <p style={{ marginTop: 13, fontSize: 9.5, color: CM.tanLight, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em" }}>
          FREE · NO ACCOUNT · NO TRACKING
        </p>
      </div>
    </div>
  );
}

function MHowItWorksScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [active, setActive] = useState(0);
  const items = [
    { icon: Globe, title: "You land on a site", body: "PolicyLens detects legal links and cookie banners automatically as you browse — no action needed." },
    { icon: Zap, title: "AI reads it instantly", body: "The full policy is processed in seconds. No copy-paste, no reading walls of dense legal text." },
    { icon: FileText, title: "You see what matters", body: "Plain English summaries, risk badges, expandable clauses. One clean popup — done." },
  ];
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % items.length), 2500);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <MBackBtn onClick={onBack} />
      <h2 style={{ fontFamily: "'Lora',serif", fontSize: 22, color: CM.text, margin: "10px 0 4px", fontWeight: 700 }}>How it works</h2>
      <p style={{ fontSize: 12, color: CM.muted, fontFamily: "'DM Sans',sans-serif", margin: "0 0 18px" }}>
        Three steps. Zero effort on your part.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              flex: 1, padding: "9px 4px", borderRadius: 9, border: "none",
              background: active === i ? CM.choco : CM.creamDark,
              color: active === i ? CM.cream : CM.muted,
              fontFamily: "'DM Mono',monospace", fontSize: 8.5, fontWeight: 700,
              letterSpacing: "0.06em", cursor: "pointer", transition: "all 0.2s", lineHeight: 1.6,
              display: "flex", flexDirection: "column", alignItems: "center",
            }}
          >
            <item.icon size={18} style={{ marginBottom: 4 }} />
            <span>STEP {i + 1}</span>
          </button>
        ))}
      </div>
      <div style={{
        background: CM.creamDark, borderRadius: 14, padding: "22px 20px",
        minHeight: 132, border: `1px solid ${CM.creamLine}`,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -18, top: -18, width: 90, height: 90, borderRadius: "50%", background: CM.cream, opacity: 0.45 }} />
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              opacity: i === active ? 1 : 0,
              transform: i === active ? "translateX(0)" : "translateX(16px)",
              transition: "all 0.35s ease",
              position: i === 0 ? "relative" : "absolute",
              top: i === 0 ? "auto" : 22,
              left: i === 0 ? "auto" : 20,
              pointerEvents: "none",
            }}
          >
            <div style={{ marginBottom: 10 }}><item.icon size={32} color={CM.choco} /></div>
            <div style={{ fontFamily: "'Lora',serif", fontSize: 16, color: CM.text, fontWeight: 700, marginBottom: 6 }}>{item.title}</div>
            <div style={{ fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: CM.sub, lineHeight: 1.65 }}>{item.body}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18 }}>
        <MPrimaryBtn onClick={onNext}>See a live example →</MPrimaryBtn>
      </div>
    </div>
  );
}

function MPreviewScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const clause = MOCK_CLAUSES[idx];
  const canPrev = idx > 0;
  const canNext = idx < MOCK_CLAUSES.length - 1;
  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <MBackBtn onClick={onBack} />
      <h2 style={{ fontFamily: "'Lora',serif", fontSize: 22, color: CM.text, margin: "10px 0 4px", fontWeight: 700 }}>Live example</h2>
      <p style={{ fontSize: 12, color: CM.muted, fontFamily: "'DM Sans',sans-serif", margin: "0 0 16px" }}>
        Tap any clause to see what it really means.
      </p>
      {/* fake site bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8, background: CM.creamDark,
        borderRadius: 8, padding: "8px 12px", marginBottom: 14,
        border: `1px solid ${CM.creamLine}`,
      }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: CM.red }} />
        <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: CM.sub }}>
          example-social.com · Privacy Policy
        </span>
        <span style={{
          marginLeft: "auto", fontSize: 9, fontFamily: "'DM Mono',monospace",
          background: CM.redBg, color: CM.redText, padding: "2px 6px", borderRadius: 4, fontWeight: 700,
        }}>
          ⚠ 3 HIGH
        </span>
      </div>
      {/* progress rail */}
      <div style={{ display: "flex", gap: 5, marginBottom: 12 }}>
        {MOCK_CLAUSES.map((_, i) => (
          <button
            key={i}
            onClick={() => { setIdx(i); setOpen(false); }}
            style={{
              flex: 1, height: 4, borderRadius: 2, border: "none",
              background: i === idx ? CM.choco : i < idx ? CM.green : CM.tanLight,
              cursor: "pointer", transition: "background 0.25s",
            }}
          />
        ))}
      </div>
      {/* clause card */}
      <div style={{
        background: CM.cream, border: `1.5px solid ${CM.creamLine}`,
        borderRadius: 12, overflow: "hidden",
        boxShadow: "0 2px 14px rgba(92,61,46,0.08)",
      }}>
        <div
          onClick={() => setOpen(!open)}
          style={{ padding: "17px 16px", cursor: "pointer", display: "flex", alignItems: "flex-start", gap: 12 }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontFamily: "'Lora',serif", color: CM.text, fontWeight: 700, lineHeight: 1.4, marginBottom: 8 }}>
              {clause.clause}
            </div>
            <MRiskBadge level={clause.risk} />
          </div>
          <div style={{ marginTop: 2, fontSize: 12, color: CM.tanLight, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▾</div>
        </div>
        {open && (
          <div style={{ padding: "13px 16px 16px", borderTop: `1px solid ${CM.creamLine}`, background: CM.creamDark }}>
            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: CM.green, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 6 }}>WHY IT MATTERS</div>
            <div style={{ fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: CM.sub, lineHeight: 1.7 }}>{clause.why}</div>
          </div>
        )}
      </div>
      {/* clause nav */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
        <button
          onClick={() => { if (canPrev) { setIdx(idx - 1); setOpen(false); } }}
          style={{
            background: "none", border: "none", cursor: canPrev ? "pointer" : "default",
            fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
            color: canPrev ? CM.choco : CM.tanLight, padding: "6px 0",
          }}
        >
          ← Prev
        </button>
        <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: CM.tanLight }}>
          {idx + 1} of {MOCK_CLAUSES.length}
        </span>
        <button
          onClick={() => { if (canNext) { setIdx(idx + 1); setOpen(false); } }}
          style={{
            background: "none", border: "none", cursor: canNext ? "pointer" : "default",
            fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: 600,
            color: canNext ? CM.choco : CM.tanLight, padding: "6px 0",
          }}
        >
          Next →
        </button>
      </div>
      <div style={{ marginTop: 16 }}>
        <MPrimaryBtn onClick={onNext}>Set my concerns →</MPrimaryBtn>
      </div>
    </div>
  );
}

function MPreferencesScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => loadConcerns());
  const [tab, setTab] = useState(0);
  const toggle = (cat: string, pill: string) => {
    const key = `${cat}::${pill}`;
    setSelected(s => {
      const next = { ...s, [key]: !s[key] };
      saveConcerns(next);
      return next;
    });
  };
  const totalSelected = Object.values(selected).filter(Boolean).length;
  const cat = PREF_CATEGORIES[tab];
  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <MBackBtn onClick={onBack} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "10px 0 4px" }}>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 22, color: CM.text, margin: 0, fontWeight: 700 }}>
          What concerns you?
        </h2>
        {totalSelected > 0 && (
          <span style={{
            background: CM.choco, color: CM.cream, fontFamily: "'DM Mono',monospace",
            fontSize: 9, fontWeight: 700, padding: "3px 9px", borderRadius: 20,
            letterSpacing: "0.06em", flexShrink: 0, marginTop: 2,
          }}>
            {totalSelected} picked
          </span>
        )}
      </div>
      <p style={{ fontSize: 12, color: CM.muted, fontFamily: "'DM Sans',sans-serif", margin: "0 0 16px" }}>
        Choose topics — we'll prioritise alerts for you.
      </p>
      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}>
        {PREF_CATEGORIES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setTab(i)}
            style={{
              flexShrink: 0, padding: "6px 12px", borderRadius: 20, border: "none",
              background: tab === i ? CM.choco : CM.creamDark,
              color: tab === i ? CM.cream : CM.sub,
              fontFamily: "'DM Sans',sans-serif", fontSize: 11.5,
              fontWeight: tab === i ? 700 : 500,
              cursor: "pointer", transition: "all 0.18s", display: "flex", alignItems: "center", gap: 6,
            }}
          >
            {c.emoji === "Lock" && <Lock size={12} />}
            {c.emoji === "Cookie" && <Cookie size={12} />}
            {c.emoji === "FileText" && <FileText size={12} />}
            {c.emoji === "FolderOpen" && <FolderOpen size={12} />}
            {c.emoji === "CreditCard" && <CreditCard size={12} />}
            <span>{c.label}</span>
          </button>
        ))}
      </div>
      <div style={{ background: CM.creamDark, borderRadius: 12, padding: "14px", border: `1px solid ${CM.creamLine}`, minHeight: 168 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {cat.pills.map(pill => {
            const key = `${cat.id}::${pill}`;
            const on = !!selected[key];
            return (
              <button
                key={pill}
                onClick={() => toggle(cat.id, pill)}
                style={{
                  padding: "7px 14px", borderRadius: 20,
                  border: `1.5px solid ${on ? cat.color : CM.creamLine}`,
                  background: on ? cat.bg : CM.cream,
                  color: on ? cat.color : CM.sub,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 12, fontWeight: on ? 700 : 500,
                  cursor: "pointer", transition: "all 0.18s",
                  display: "flex", alignItems: "center", gap: 5,
                  boxShadow: on ? `0 0 0 3px ${cat.border}` : "none",
                }}
              >
                {on && <Check size={10} />}
                {pill}
              </button>
            );
          })}
        </div>
      </div>
      {totalSelected > 0 && (
        <div style={{ marginTop: 11, display: "flex", flexWrap: "wrap", gap: 5 }}>
          {PREF_CATEGORIES.map(c =>
            c.pills.filter(p => selected[`${c.id}::${p}`]).map(p => (
              <span
                key={`${c.id}::${p}`}
                style={{
                  fontSize: 10, fontFamily: "'DM Mono',monospace",
                  background: c.bg, color: c.color,
                  border: `1px solid ${c.border}`, padding: "2px 8px", borderRadius: 10,
                }}
              >
                {p}
              </span>
            ))
          )}
        </div>
      )}
      <div style={{ marginTop: 14 }}>
        <MPrimaryBtn onClick={onNext} disabled={totalSelected === 0}>
          {totalSelected === 0 ? "Pick at least one topic" : `Continue with ${totalSelected} topic${totalSelected > 1 ? "s" : ""} →`}
        </MPrimaryBtn>
      </div>
      <div style={{ textAlign: "center", marginTop: 9 }}>
        <button
          onClick={onNext}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: CM.tanLight }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function MPermissionsScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [checked, setChecked] = useState<PermState>(() => loadPermissions());
  const allGranted = checked.tabs && checked.storage;
  const perms = [
    { key: "tabs" as const,    icon: Folders, title: "Active tab access", desc: "Detect policy links on the current page" },
    { key: "storage" as const, icon: HardDrive, title: "Local storage",     desc: "Save history & your preferences" },
  ];
  return (
    <div style={{ padding: "20px 24px 24px" }}>
      <MBackBtn onClick={onBack} />
      <h2 style={{ fontFamily: "'Lora',serif", fontSize: 22, color: CM.text, margin: "10px 0 4px", fontWeight: 700 }}>One quick thing</h2>
      <p style={{ fontSize: 12, color: CM.muted, fontFamily: "'DM Sans',sans-serif", margin: "0 0 18px", lineHeight: 1.6 }}>
        PolicyLens needs two permissions. Your data never leaves your browser.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
        {perms.map(p => {
          const on = checked[p.key];
          return (
            <div
              key={p.key}
              onClick={() => setChecked(c => {
                const next = { ...c, [p.key]: !c[p.key] };
                savePermissions(next);
                return next;
              })}
              style={{
                border: `1.5px solid ${on ? CM.green : CM.creamLine}`,
                background: on ? CM.greenLight : CM.cream,
                borderRadius: 10, padding: "14px", cursor: "pointer",
                display: "flex", alignItems: "center", gap: 12, transition: "all 0.2s",
              }}
            >
              <p.icon size={20} color={CM.choco} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 13.5, color: CM.text }}>{p.title}</div>
                <div style={{ fontSize: 11, color: CM.muted, fontFamily: "'DM Sans',sans-serif", marginTop: 2 }}>{p.desc}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${on ? CM.green : CM.tanLight}`,
                background: on ? CM.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 12, fontWeight: 700, transition: "all 0.2s",
              }}>
                {on && <Check size={14} color="#fff" />}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        background: CM.creamDark, borderRadius: 8, padding: "10px 13px",
        marginBottom: 18, display: "flex", gap: 9, alignItems: "flex-start",
        border: `1px solid ${CM.creamLine}`,
      }}>
        <Lock size={14} color={CM.green} />
        <p style={{ fontSize: 10.5, fontFamily: "'DM Sans',sans-serif", color: CM.sub, margin: 0, lineHeight: 1.65 }}>
          All analysis runs locally or via encrypted requests. We never store or sell your data.
        </p>
      </div>
      <MPrimaryBtn onClick={onNext} disabled={!allGranted}>
        {allGranted ? "All done →" : "Tap both above to continue"}
      </MPrimaryBtn>
    </div>
  );
}

function MDoneScreen({ onFinish }: { onFinish: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);
  return (
    <div style={{ textAlign: "center", padding: "38px 26px 30px" }}>
      <div style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "scale(1)" : "scale(0.6)",
        transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1)", marginBottom: 22,
      }}>
        <div style={{
          width: 74, height: 74, borderRadius: "50%", background: CM.green,
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto",
          boxShadow: `0 0 0 10px ${CM.greenLight},0 0 0 11px ${CM.greenLine}`,
        }}><CheckCircle size={36} color="#fff" strokeWidth={3} /></div>
      </div>
      <div style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
        transition: "all 0.5s ease 0.2s",
      }}>
        <div style={{ fontSize: 8.5, fontFamily: "'DM Mono',monospace", letterSpacing: "0.22em", color: CM.green, fontWeight: 700, marginBottom: 11 }}>
          YOU'RE PROTECTED
        </div>
        <h1 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: CM.text, lineHeight: 1.2, margin: "0 0 10px" }}>
          PolicyLens is<br />
          <em style={{ color: CM.choco, fontStyle: "italic" }}>ready to go.</em>
        </h1>
        <p style={{ fontSize: 12.5, fontFamily: "'DM Sans',sans-serif", color: CM.sub, lineHeight: 1.7, margin: "0 0 26px" }}>
          Visit any site with a policy or cookie banner — we'll handle the reading.
        </p>
        <div style={{ display: "flex", gap: 10, marginBottom: 26 }}>
          {[{ n: "0", label: "Sites analyzed", icon: Globe }, { n: "0", label: "Risks found", icon: AlertTriangle }, { n: "0", label: "Hrs saved", icon: Clock }].map((s, i) => (
            <div key={i} style={{ flex: 1, background: CM.creamDark, borderRadius: 10, padding: "12px 8px", border: `1px solid ${CM.creamLine}` }}>
              <div style={{ marginBottom: 6 }}><s.icon size={18} color={CM.green} /></div>
              <div style={{ fontFamily: "'Lora',serif", fontSize: 24, fontWeight: 700, color: CM.choco }}>{s.n}</div>
              <div style={{ fontSize: 9.5, fontFamily: "'DM Sans',sans-serif", color: CM.muted, lineHeight: 1.4, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <MPrimaryBtn onClick={onFinish}>Open Dashboard</MPrimaryBtn>
        <p style={{ marginTop: 11, fontSize: 10.5, color: CM.tanLight, fontFamily: "'DM Sans',sans-serif" }}>
          or just browse — we'll do the rest
        </p>
      </div>
    </div>
  );
}

function MobileOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);

  const go = (next: number) => {
    if (busy) return;
    setDir(next > step ? 1 : -1);
    setBusy(true);
    setTimeout(() => { setStep(next); setBusy(false); }, 210);
  };
  const next = () => go(Math.min(step + 1, M_STEPS.length - 1));
  const back = () => go(Math.max(step - 1, 0));

  const screens = [
    <MWelcomeScreen     onNext={next} />,
    <MHowItWorksScreen  onNext={next} onBack={back} />,
    <MPreviewScreen     onNext={next} onBack={back} />,
    <MPreferencesScreen onNext={next} onBack={back} />,
    <MPermissionsScreen onNext={next} onBack={back} />,
    <MDoneScreen        onFinish={onComplete} />,
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 30% 20%, #E2C9A8 0%, #C9A87A 45%, #B8916A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}>
        <div style={{
          width: 360, background: CM.cream, borderRadius: 20, overflow: "hidden",
          boxShadow: "0 8px 20px rgba(92,61,46,0.1),0 32px 80px rgba(92,61,46,0.24),0 0 0 1px rgba(92,61,46,0.07)",
        }}>
          {/* Chrome bar */}
          <div style={{
            background: "#FAF3E4", borderBottom: `1px solid ${CM.creamLine}`,
            padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: "50%",
              overflow: "hidden", flexShrink: 0,
            }}>
              <img src="/favicon_io/favicon-32x32.png" alt="PolicyLens" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
            <span style={{ fontFamily: "'Lora',serif", fontSize: 13, fontWeight: 700, color: CM.text }}>PolicyLens</span>
            <div style={{ marginLeft: "auto" }}>
              <MDots current={step} total={M_STEPS.length} />
            </div>
          </div>

          {/* Screen */}
          <div style={{
            opacity: busy ? 0 : 1,
            transform: busy ? `translateX(${dir * 18}px)` : "translateX(0)",
            transition: "all 0.21s ease",
          }}>
            {screens[step]}
          </div>

          {/* Footer */}
          <div style={{
            background: "#FAF3E4", borderTop: `1px solid ${CM.creamLine}`,
            padding: "7px 16px", display: "flex", justifyContent: "space-between",
          }}>
            <span style={{ fontSize: 8.5, fontFamily: "'DM Mono',monospace", color: CM.tan, letterSpacing: "0.1em" }}>
              {M_STEPS[step].toUpperCase()}
            </span>
            <span style={{ fontSize: 8.5, fontFamily: "'DM Mono',monospace", color: CM.tan, letterSpacing: "0.1em" }}>
              {step + 1} / {M_STEPS.length}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DESKTOP VARIANT  (> 768 px — 900 px max card with left sidebar)
   ════════════════════════════════════════════════════════════════════════════ */

const CD = {
  cream: "#FDF8F0",    creamDark: "#F5EBD8",  creamMid: "#EEE0C8",  creamLine: "#E0CEBA",
  choco: "#5C3D2E",   chocoDeep: "#3E2518",  chocoLight: "#7A5242",
  tan: "#B8966A",     tanLight: "#D4BFA8",   tanFaint: "#EDE0CC",
  muted: "#9B8B7A",   text: "#2C1810",       sub: "#6B5744",
  green: "#4A8C3F",   greenLight: "#F0FAF0", greenLine: "#C3E0BF",  greenDark: "#366B2E",
  red: "#EF4444",     redBg: "#FEE2E2",      redText: "#991B1B",
  amber: "#F59E0B",   amberBg: "#FEF3C7",   amberText: "#92400E",
  sidebar: "#2C1810",
};

const D_STEPS = [
  { id: "welcome",     label: "Welcome",       icon: "Hand" },
  { id: "how",         label: "How it works",  icon: "Zap" },
  { id: "preview",     label: "Live preview",  icon: "Eye" },
  { id: "preferences", label: "Your concerns", icon: "Target" },
  { id: "permissions", label: "Permissions",   icon: "Lock" },
  { id: "done",        label: "All set",       icon: "Check"  },
];

const D_RISK: Record<Risk, { bg: string; text: string; dot: string; label: string }> = {
  high:   { bg: "#FEE2E2", text: "#991B1B", dot: "#EF4444", label: "HIGH RISK" },
  medium: { bg: "#FEF3C7", text: "#92400E", dot: "#F59E0B", label: "MED RISK"  },
  low:    { bg: "#F0FAF0",  text: "#4A8C3F", dot: "#4A8C3F", label: "LOW RISK" },
};

function DRiskBadge({ level }: { level: Risk }) {
  const r = D_RISK[level];
  return (
    <span style={{
      background: r.bg, color: r.text, fontSize: 10,
      fontFamily: "'DM Mono',monospace", fontWeight: 700, letterSpacing: "0.07em",
      padding: "3px 9px", borderRadius: 5, display: "inline-flex",
      alignItems: "center", gap: 5, flexShrink: 0,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: r.dot }} />
      {r.label}
    </span>
  );
}

function DBtn({ children, onClick, disabled = false, variant = "primary", style: styleProp = {} }: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  style?: CSSProperties;
}) {
  const [hov, setHov] = useState(false);
  const variants: Record<string, CSSProperties> = {
    primary: {
      background: disabled ? CD.tanLight : hov ? CD.chocoDeep : CD.choco,
      color: disabled ? CD.muted : CD.cream,
      border: "none",
    },
    ghost: {
      background: "transparent",
      color: hov ? CD.choco : CD.muted,
      border: `1.5px solid ${hov ? CD.tanLight : CD.creamLine}`,
    },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => !disabled && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "13px 28px", fontFamily: "'DM Sans',sans-serif", fontWeight: 700,
        fontSize: 14, borderRadius: 11, cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.18s", letterSpacing: "0.01em",
        ...variants[variant], ...styleProp,
      }}
    >
      {children}
    </button>
  );
}

function DBackBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, background: "none",
        border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600,
        fontSize: 13, color: hov ? CD.choco : CD.muted, padding: "4px 0", transition: "color 0.15s",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}

function DSidebar({ step }: { step: number }) {
  return (
    <div style={{
      width: 280, flexShrink: 0,
      background: CD.sidebar,
      display: "flex", flexDirection: "column",
      padding: "36px 28px",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative orbs */}
      <div style={{ position: "absolute", bottom: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: "rgba(74,140,63,0.12)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: -40, left: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,0.04)", pointerEvents: "none" }} />

      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 44 }}>
        <div style={{
          width: 36, height: 36, borderRadius: "50%",
          overflow: "hidden", flexShrink: 0,
        }}>
          <img src="/favicon_io/favicon-32x32.png" alt="PolicyLens" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontFamily: "'Lora',serif", fontSize: 14, fontWeight: 700, color: "#FDF8F0", lineHeight: 1.2 }}>PolicyLens</div>
          <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em" }}>AI EXTENSION</div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {D_STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={s.id}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 12px", borderRadius: 9,
                background: active ? "rgba(255,255,255,0.1)" : "transparent",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? CD.green : active ? CD.choco : "rgba(255,255,255,0.08)",
                border: done ? "none" : active ? `2px solid ${CD.tan}` : "2px solid rgba(255,255,255,0.15)",
                fontSize: 12, transition: "all 0.3s",
              }}>
                {done
                  ? <Check size={14} color="#fff" strokeWidth={3} />
                  : <span style={{ color: active ? CD.cream : "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 11 }}>
                    {i + 1}
                  </span>
                }
              </div>
              <div>
                <div style={{
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#FDF8F0" : done ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)",
                  transition: "color 0.2s",
                }}>
                  {s.label}
                </div>
              </div>
              {active && (
                <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: CD.green, flexShrink: 0 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom trust note */}
      <div style={{ marginTop: 32, padding: "14px", background: "rgba(74,140,63,0.12)", borderRadius: 10, border: "1px solid rgba(74,140,63,0.25)" }}>
        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: CD.green, fontWeight: 700, letterSpacing: "0.1em", marginBottom: 5 }}>PRIVACY FIRST</div>
        <div style={{ fontSize: 11, fontFamily: "'DM Sans',sans-serif", color: "rgba(255,255,255,0.45)", lineHeight: 1.6 }}>
          Your data never leaves your browser. No accounts, no tracking, no ads.
        </div>
      </div>
    </div>
  );
}

/* ── Desktop Screens ── */

function DWelcomeScreen({ onNext }: { onNext: () => void }) {
  const [in_, setIn] = useState(false);
  useEffect(() => { setTimeout(() => setIn(true), 60); }, []);
  const f = (d: number): CSSProperties => ({
    opacity: in_ ? 1 : 0,
    transform: in_ ? "translateY(0)" : "translateY(22px)",
    transition: `all 0.55s ease ${d}s`,
  });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "48px 52px", textAlign: "center" }}>
      <div style={{ ...f(0), marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: "0.2em", color: CD.green, fontWeight: 700, marginBottom: 18 }}>
          WELCOME TO POLICYLENS
        </div>
        <h1 style={{ fontFamily: "'Lora',serif", fontSize: 48, fontWeight: 700, color: CD.text, lineHeight: 1.1, margin: "0 0 18px", letterSpacing: "-0.03em" }}>
          Read less.<br />
          <em style={{ color: CD.choco, fontStyle: "italic" }}>Know more.</em>
        </h1>
        <p style={{ fontSize: 16, fontFamily: "'DM Sans',sans-serif", color: CD.sub, lineHeight: 1.7, margin: "0 auto", maxWidth: 480 }}>
          AI that decodes privacy policies, cookie banners, and legal fine print —
          before you ever click <em>"I agree."</em>
        </p>
      </div>

      {/* Feature pills */}
      <div style={{ ...f(0.12), display: "flex", flexWrap: "wrap", gap: 10, margin: "28px 0 36px", justifyContent: "center" }}>
        {[
          { icon: Zap, label: "Instant analysis" },
          { icon: Target, label: "Risk detection" },
          { icon: Eye, label: "Site history" },
          { icon: Shield, label: "100% private" },
        ].map(pill => (
          <div
            key={pill.label}
            style={{
              display: "flex", alignItems: "center", gap: 7,
              background: CD.creamDark, border: `1px solid ${CD.creamLine}`,
              borderRadius: 30, padding: "8px 16px",
            }}
          >
            <pill.icon size={15} color={CD.choco} />
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: CD.sub }}>{pill.label}</span>
          </div>
        ))}
      </div>

      {/* CTA row */}
      <div style={{ ...f(0.22), display: "flex", alignItems: "center", gap: 20 }}>
        <DBtn onClick={onNext} style={{ fontSize: 15, padding: "15px 40px" }}>Get started →</DBtn>
        <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: CD.tanLight, letterSpacing: "0.08em" }}>
          FREE · NO ACCOUNT · NO TRACKING
        </span>
      </div>
    </div>
  );
}

function DHowItWorksScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [active, setActive] = useState(0);
  const items = [
    { icon: Globe, title: "You land on a site", body: "PolicyLens detects legal links and cookie consent banners automatically as you browse — no copy-paste, no action needed from you." },
    { icon: Zap, title: "AI reads it instantly", body: "The full policy document is processed in seconds. Our model identifies clauses that could affect you — even buried in paragraph 47." },
    { icon: FileText, title: "You see what matters", body: "A clean popup shows plain-English summaries, risk level badges, and expandable 'why it matters' explanations for every flagged clause." },
  ];
  useEffect(() => {
    const t = setInterval(() => setActive(a => (a + 1) % items.length), 2800);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "48px 52px" }}>
      <DBackBtn onClick={onBack} />
      <h2 style={{ fontFamily: "'Lora',serif", fontSize: 36, color: CD.text, margin: "16px 0 6px", fontWeight: 700, letterSpacing: "-0.02em" }}>How it works</h2>
      <p style={{ fontSize: 14, color: CD.muted, fontFamily: "'DM Sans',sans-serif", margin: "0 0 32px" }}>Three steps. Zero effort on your part.</p>

      {/* Step selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            style={{
              flex: 1, padding: "14px 12px", borderRadius: 10, border: "none",
              background: active === i ? CD.choco : CD.creamDark,
              color: active === i ? CD.cream : CD.muted,
              fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 700,
              cursor: "pointer", transition: "all 0.2s", textAlign: "left",
            }}
          >
            <div style={{ marginBottom: 6 }}><item.icon size={20} color={active === i ? CD.cream : CD.muted} /></div>
            <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: "0.08em", opacity: 0.7 }}>STEP {i + 1}</div>
          </button>
        ))}
      </div>

      {/* Active step detail */}
      <div style={{ flex: 1, background: CD.creamDark, borderRadius: 14, padding: "28px 30px", border: `1px solid ${CD.creamLine}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -24, bottom: -24, width: 160, height: 160, borderRadius: "50%", background: CD.cream, opacity: 0.4 }} />
        {items.map((item, i) => (
          <div
            key={i}
            style={{
              opacity: i === active ? 1 : 0,
              transform: i === active ? "translateX(0)" : "translateX(20px)",
              transition: "all 0.4s ease",
              position: i === 0 ? "relative" : "absolute",
              top: i === 0 ? "auto" : 28,
              left: i === 0 ? "auto" : 30,
              pointerEvents: "none",
            }}
          >
            <div style={{ marginBottom: 14 }}><item.icon size={44} color={CD.choco} /></div>
            <div style={{ fontFamily: "'Lora',serif", fontSize: 22, color: CD.text, fontWeight: 700, marginBottom: 10 }}>{item.title}</div>
            <div style={{ fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: CD.sub, lineHeight: 1.7, maxWidth: 380 }}>{item.body}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <DBtn onClick={onNext} style={{ flex: "none" }}>See a live example →</DBtn>
      </div>
    </div>
  );
}

function DPreviewScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "48px 52px" }}>
      <DBackBtn onClick={onBack} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "16px 0 24px" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora',serif", fontSize: 36, color: CD.text, margin: "0 0 6px", fontWeight: 700, letterSpacing: "-0.02em" }}>Live example</h2>
          <p style={{ fontSize: 14, color: CD.muted, fontFamily: "'DM Sans',sans-serif", margin: 0 }}>
            This is exactly what PolicyLens shows you. Click any clause.
          </p>
        </div>
        {/* Fake site pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: CD.creamDark, borderRadius: 8, padding: "8px 14px", border: `1px solid ${CD.creamLine}`, flexShrink: 0 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: CD.red }} />
          <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: CD.sub }}>example-social.com</span>
          <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", background: CD.redBg, color: CD.redText, padding: "2px 7px", borderRadius: 4, fontWeight: 700 }}>⚠ 3 HIGH</span>
        </div>
      </div>

      {/* Clause list */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
        {MOCK_CLAUSES.map((item, i) => (
          <div
            key={i}
            style={{
              background: CD.cream,
              border: `1.5px solid ${open === i ? CD.choco : CD.creamLine}`,
              borderRadius: 12, overflow: "hidden",
              boxShadow: open === i ? "0 4px 20px rgba(92,61,46,0.1)" : "0 1px 4px rgba(92,61,46,0.05)",
              transition: "all 0.22s",
            }}
          >
            <div
              onClick={() => setOpen(open === i ? null : i)}
              style={{ padding: "16px 20px", cursor: "pointer", display: "flex", alignItems: "center", gap: 16 }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: item.risk === "high" ? CD.redBg : CD.amberBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.risk === "high" ? <AlertOctagon size={18} color={CD.redText} /> : <AlertTriangle size={18} color="#F59E0B" />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontFamily: "'Lora',serif", color: CD.text, fontWeight: 700, lineHeight: 1.4 }}>{item.clause}</div>
              </div>
              <DRiskBadge level={item.risk} />
              <div style={{ fontSize: 12, color: CD.tanLight, marginLeft: 8, transform: open === i ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>▾</div>
            </div>
            {open === i && (
              <div style={{ padding: "0 20px 18px", borderTop: `1px solid ${CD.creamLine}` }}>
                <div style={{ paddingTop: 14 }}>
                  <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: CD.green, fontWeight: 700, letterSpacing: "0.12em", marginBottom: 7 }}>WHY IT MATTERS</div>
                  <div style={{ fontSize: 13, fontFamily: "'DM Sans',sans-serif", color: CD.sub, lineHeight: 1.75 }}>{item.why}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <DBtn onClick={onNext}>Set my concerns →</DBtn>
      </div>
    </div>
  );
}

function DPreferencesScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => loadConcerns());
  const [tab, setTab] = useState(0);
  const toggle = (cat: string, pill: string) => {
    const key = `${cat}::${pill}`;
    setSelected(s => {
      const next = { ...s, [key]: !s[key] };
      saveConcerns(next);
      return next;
    });
  };
  const totalSelected = Object.values(selected).filter(Boolean).length;
  const cat = PREF_CATEGORIES[tab];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "48px 52px" }}>
      <DBackBtn onClick={onBack} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", margin: "16px 0 20px" }}>
        <div>
          <h2 style={{ fontFamily: "'Lora',serif", fontSize: 36, color: CD.text, margin: "0 0 6px", fontWeight: 700, letterSpacing: "-0.02em" }}>What concerns you?</h2>
          <p style={{ fontSize: 14, color: CD.muted, fontFamily: "'DM Sans',sans-serif", margin: 0 }}>Pick topics — PolicyLens will prioritise alerts around them.</p>
        </div>
        {totalSelected > 0 && (
          <div style={{ background: CD.choco, color: CD.cream, fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 700, padding: "6px 14px", borderRadius: 20, letterSpacing: "0.06em", flexShrink: 0 }}>
            {totalSelected} selected
          </div>
        )}
      </div>

      {/* Category tab bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {PREF_CATEGORIES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setTab(i)}
            style={{
              padding: "8px 16px", borderRadius: 20, border: "none",
              background: tab === i ? CD.choco : CD.creamDark,
              color: tab === i ? CD.cream : CD.sub,
              fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              fontWeight: tab === i ? 700 : 500,
              cursor: "pointer", transition: "all 0.18s",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            {c.emoji === "Lock" && <Lock size={14} />}
            {c.emoji === "Cookie" && <Cookie size={14} />}
            {c.emoji === "FileText" && <FileText size={14} />}
            {c.emoji === "FolderOpen" && <FolderOpen size={14} />}
            {c.emoji === "CreditCard" && <CreditCard size={14} />}
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Pills grid */}
      <div style={{ background: CD.creamDark, borderRadius: 14, padding: "20px", border: `1px solid ${CD.creamLine}`, flex: 1 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, alignContent: "flex-start" }}>
          {cat.pills.map(pill => {
            const key = `${cat.id}::${pill}`;
            const on = !!selected[key];
            return (
              <button
                key={pill}
                onClick={() => toggle(cat.id, pill)}
                style={{
                  padding: "9px 18px", borderRadius: 20,
                  border: `1.5px solid ${on ? cat.color : CD.creamLine}`,
                  background: on ? cat.bg : CD.cream,
                  color: on ? cat.color : CD.sub,
                  fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: on ? 700 : 500,
                  cursor: "pointer", transition: "all 0.18s",
                  display: "flex", alignItems: "center", gap: 6,
                  boxShadow: on ? `0 0 0 3px ${cat.border}` : "none",
                }}
              >
                {on && <Check size={11} />}
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected tags */}
      {totalSelected > 0 && (
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PREF_CATEGORIES.map(c =>
            c.pills.filter(p => selected[`${c.id}::${p}`]).map(p => (
              <span key={`${c.id}::${p}`} style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", background: c.bg, color: c.color, border: `1px solid ${c.border}`, padding: "3px 10px", borderRadius: 12 }}>
                {p}
              </span>
            ))
          )}
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 16 }}>
        <DBtn onClick={onNext} disabled={totalSelected === 0}>
          {totalSelected === 0 ? "Pick at least one topic" : `Continue with ${totalSelected} topic${totalSelected > 1 ? "s" : ""} →`}
        </DBtn>
        <button
          onClick={onNext}
          style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: CD.tanLight, padding: "4px 0" }}
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}

function DPermissionsScreen({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [checked, setChecked] = useState<PermState>(() => loadPermissions());
  const allGranted = checked.tabs && checked.storage;
  const perms = [
    {
      key: "tabs" as const, icon: Folders, title: "Active tab access",
      desc: "Lets PolicyLens detect policy links and cookie banners on the page you're currently visiting.",
      detail: "Read-only. We never modify page content.",
    },
    {
      key: "storage" as const, icon: HardDrive, title: "Local storage",
      desc: "Stores your analysis history and preferences so you can track sites across sessions.",
      detail: "Stays on your device. Never synced externally.",
    },
  ];
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "48px 52px" }}>
      <DBackBtn onClick={onBack} />
      <h2 style={{ fontFamily: "'Lora',serif", fontSize: 36, color: CD.text, margin: "16px 0 6px", fontWeight: 700, letterSpacing: "-0.02em" }}>One quick thing</h2>
      <p style={{ fontSize: 14, color: CD.muted, fontFamily: "'DM Sans',sans-serif", margin: "0 0 28px", lineHeight: 1.6 }}>
        PolicyLens needs two browser permissions to work. Your data never leaves your device.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
        {perms.map(p => {
          const on = checked[p.key];
          return (
            <div
              key={p.key}
              onClick={() => setChecked(c => {
                const next = { ...c, [p.key]: !c[p.key] };
                savePermissions(next);
                return next;
              })}
              style={{
                border: `1.5px solid ${on ? CD.green : CD.creamLine}`,
                background: on ? CD.greenLight : CD.cream,
                borderRadius: 12, padding: "20px 22px", cursor: "pointer",
                display: "flex", alignItems: "flex-start", gap: 16,
                transition: "all 0.22s",
                boxShadow: on ? `0 0 0 3px ${CD.greenLine}` : "none",
              }}
            >
              <p.icon size={24} color={CD.choco} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 16, color: CD.text }}>{p.title}</div>
                  {on && (
                    <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", background: CD.greenLine, color: CD.greenDark, padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                      GRANTED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: CD.sub, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.65, marginBottom: 5 }}>{p.desc}</div>
                <div style={{ fontSize: 11, color: CD.tanLight, fontFamily: "'DM Mono',monospace", letterSpacing: "0.04em" }}>{p.detail}</div>
              </div>
              <div style={{
                width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                border: `2px solid ${on ? CD.green : CD.tanLight}`,
                background: on ? CD.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700, marginTop: 2, transition: "all 0.22s",
              }}>
                {on && <Check size={16} color="#fff" />}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ background: CD.creamDark, borderRadius: 10, padding: "14px 18px", marginTop: 20, marginBottom: 20, display: "flex", gap: 12, alignItems: "flex-start", border: `1px solid ${CD.creamLine}` }}>
        <Lock size={18} color={CD.green} />
        <p style={{ fontSize: 12, fontFamily: "'DM Sans',sans-serif", color: CD.sub, margin: 0, lineHeight: 1.7 }}>
          All analysis runs locally or through encrypted, anonymised requests.
          We have no user accounts and no way to identify you. Permissions can be
          revoked anytime in your browser's extension settings.
        </p>
      </div>

      <DBtn onClick={onNext} disabled={!allGranted} style={{ alignSelf: "flex-start" }}>
        {allGranted ? "All done →" : "Grant both permissions to continue"}
      </DBtn>
    </div>
  );
}

function DDoneScreen({ onFinish }: { onFinish: () => void }) {
  const [checkStart, setCheckStart] = useState(false);
  const [elems, setElems] = useState([false, false, false, false]);

  useEffect(() => {
    const KF_ID = "pl-done-kf-v3";
    if (!document.getElementById(KF_ID)) {
      const el = document.createElement("style");
      el.id = KF_ID;
      el.textContent = `
        @keyframes plOuterCW {
          0%  {transform:rotate(0deg)}
          52% {transform:rotate(560deg)}
          74% {transform:rotate(695deg)}
          84% {transform:rotate(726deg)}
          91% {transform:rotate(714deg)}
          96% {transform:rotate(721deg)}
          100%{transform:rotate(720deg)}
        }
        @keyframes plInnerCCW {
          0%  {transform:rotate(0deg)}
          52% {transform:rotate(-560deg)}
          74% {transform:rotate(-695deg)}
          84% {transform:rotate(-726deg)}
          91% {transform:rotate(-714deg)}
          96% {transform:rotate(-721deg)}
          100%{transform:rotate(-720deg)}
        }
        @keyframes plMidCW {
          0%  {transform:rotate(0deg)}
          56% {transform:rotate(600deg)}
          77% {transform:rotate(708deg)}
          86% {transform:rotate(732deg)}
          93% {transform:rotate(717deg)}
          97% {transform:rotate(722deg)}
          100%{transform:rotate(720deg)}
        }
        @keyframes plCirclePop {
          0%  {transform:scale(0);opacity:0}
          60% {transform:scale(1.14);opacity:1}
          80% {transform:scale(0.95)}
          100%{transform:scale(1)}
        }
        @keyframes plGlow {
          0%,100%{box-shadow:0 0 0 8px #F0FAF0,0 0 0 9px #C3E0BF}
          50%    {box-shadow:0 0 0 16px #F0FAF0,0 0 0 18px #C3E0BF}
        }
        @keyframes plDotPop {
          0%  {transform:translate(-50%,-50%) rotate(var(--pl-deg)) translateY(-62px) scale(0);opacity:0}
          70% {transform:translate(-50%,-50%) rotate(var(--pl-deg)) translateY(-62px) scale(1.4);opacity:1}
          100%{transform:translate(-50%,-50%) rotate(var(--pl-deg)) translateY(-62px) scale(1);opacity:0.5}
        }
      `;
      document.head.appendChild(el);
    }

    const t1 = setTimeout(() => setCheckStart(true), 1350);
    const t2 = setTimeout(() => {
      [0, 1, 2, 3].forEach(i =>
        setTimeout(() =>
          setElems(p => { const n = [...p]; n[i] = true; return n; }),
        i * 240)
      );
    }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const cascade = (i: number): CSSProperties => ({
    opacity: elems[i] ? 1 : 0,
    transform: elems[i] ? "translateY(0px)" : "translateY(22px)",
    transition: "opacity 0.52s ease, transform 0.52s cubic-bezier(0.22,1,0.36,1)",
  });

  const dots = [
    { deg: 0,   color: CD.green, delay: "1.85s" },
    { deg: 90,  color: CD.tan,   delay: "1.90s" },
    { deg: 180, color: CD.green, delay: "1.88s" },
    { deg: 270, color: CD.tan,   delay: "1.93s" },
  ];

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", padding: "36px 52px 40px",
      textAlign: "center",
    }}>
      {/* ── Ring + checkmark system ── */}
      <div style={{ position: "relative", width: 132, height: 132, marginBottom: 32, flexShrink: 0 }}>
        {/* Outer dashed ring — CW */}
        <div style={{
          position: "absolute", inset: 0, borderRadius: "50%",
          border: `2px dashed ${CD.greenLine}`,
          animation: "plOuterCW 2.0s linear forwards",
        }} />
        {/* Outer solid half-arc — CW */}
        <div style={{
          position: "absolute", inset: 2, borderRadius: "50%",
          border: "2.5px solid transparent",
          borderTopColor: CD.green, borderRightColor: CD.green,
          animation: "plOuterCW 2.0s linear forwards",
        }} />
        {/* Mid tracker arc — CW phase-offset */}
        <div style={{
          position: "absolute", inset: 10, borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: CD.tan, borderLeftColor: CD.tan,
          animation: "plMidCW 2.0s linear forwards",
          opacity: 0.65,
        }} />
        {/* Inner arc — CCW */}
        <div style={{
          position: "absolute", inset: 16, borderRadius: "50%",
          border: "2.5px solid transparent",
          borderTopColor: CD.chocoLight, borderLeftColor: CD.chocoLight,
          animation: "plInnerCCW 2.0s linear forwards",
          opacity: 0.45,
        }} />
        {/* Filled green circle — pops in then glows */}
        <div style={{
          position: "absolute", inset: 22, borderRadius: "50%",
          background: CD.green,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "plCirclePop 0.55s cubic-bezier(0.34,1.56,0.64,1) 0.28s both, plGlow 2.6s ease-in-out 2.7s infinite",
        }}>
          {/* SVG checkmark — draws itself via stroke-dashoffset */}
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path
              d="M11 23 L19 31 L33 14"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              style={{
                strokeDasharray: 1,
                strokeDashoffset: checkStart ? 0 : 1,
                transition: checkStart
                  ? "stroke-dashoffset 0.92s cubic-bezier(0.4,0,0.15,1)"
                  : "none",
              }}
            />
          </svg>
        </div>
        {/* Cardinal dot accents */}
        {dots.map(({ deg, color, delay }) => (
          <div key={deg} style={{
            position: "absolute", width: 6, height: 6, borderRadius: "50%",
            background: color,
            top: "50%", left: "50%",
            ["--pl-deg" as string]: `${deg}deg`,
            transform: `translate(-50%,-50%) rotate(${deg}deg) translateY(-62px)`,
            animation: `plDotPop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${delay} both`,
          }} />
        ))}
      </div>

      {/* CASCADE 0 — label */}
      <div style={{
        ...cascade(0),
        fontSize: 9.5, fontFamily: "'DM Mono',monospace",
        letterSpacing: "0.26em", color: CD.green, fontWeight: 700, marginBottom: 14,
      }}>
        YOU'RE ALL SET
      </div>

      {/* CASCADE 1 — headline + sub */}
      <div style={cascade(1)}>
        <h1 style={{ fontFamily: "'Lora',serif", fontSize: 40, fontWeight: 700, color: CD.text, lineHeight: 1.1, margin: "0 0 12px", letterSpacing: "-0.03em" }}>
          PolicyLens is<br />
          <em style={{ color: CD.choco, fontStyle: "italic" }}>ready to go.</em>
        </h1>
        <p style={{ fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: CD.sub, lineHeight: 1.65, margin: "0 auto", maxWidth: 340 }}>
          Browse normally — we'll silently read every policy and surface what actually matters.
        </p>
      </div>

      {/* CASCADE 2 — stats */}
      <div style={{ ...cascade(2), display: "flex", gap: 10, margin: "26px 0" }}>
        {[
          { icon: Globe,         label: "Sites analyzed", n: "0" },
          { icon: AlertTriangle, label: "Risks found",    n: "0" },
          { icon: Clock,         label: "Hours saved",    n: "0" },
        ].map((s, i) => (
          <div key={i} style={{
            background: CD.creamDark, borderRadius: 10, padding: "12px 20px",
            border: `1px solid ${CD.creamLine}`,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
          }}>
            <s.icon size={16} color={CD.green} />
            <div style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, color: CD.choco, lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 10, fontFamily: "'DM Sans',sans-serif", color: CD.muted, whiteSpace: "nowrap" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CASCADE 3 — CTA */}
      <div style={{ ...cascade(3), display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <DBtn onClick={onFinish} style={{ fontSize: 14, padding: "13px 36px", display: "flex", alignItems: "center", gap: 8, boxShadow: "0 4px 20px rgba(92,61,46,0.25)" }}>
          Dashboard <span style={{ fontSize: 16 }}>→</span>
        </DBtn>
        <span style={{ fontSize: 11.5, fontFamily: "'DM Sans',sans-serif", color: CD.tanLight }}>
          or just start browsing
        </span>
      </div>
    </div>
  );
}

function DesktopOnboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);

  const go = (next: number) => {
    if (busy) return;
    setDir(next > step ? 1 : -1);
    setBusy(true);
    setTimeout(() => { setStep(next); setBusy(false); }, 210);
  };
  const next = () => go(Math.min(step + 1, D_STEPS.length - 1));
  const back = () => go(Math.max(step - 1, 0));

  const screens = [
    <DWelcomeScreen     onNext={next} />,
    <DHowItWorksScreen  onNext={next} onBack={back} />,
    <DPreviewScreen     onNext={next} onBack={back} />,
    <DPreferencesScreen onNext={next} onBack={back} />,
    <DPermissionsScreen onNext={next} onBack={back} />,
    <DDoneScreen        onFinish={onComplete} />,
  ];

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,600;0,700;1,600;1,700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 30% 20%, #DEC9A2 0%, #C4A47A 50%, #A8865A 100%)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 32,
      }}>
        <div style={{
          width: "100%", maxWidth: 900, minHeight: 560,
          background: CD.cream, borderRadius: 22, overflow: "hidden",
          display: "flex",
          boxShadow: "0 10px 30px rgba(62,37,24,0.12), 0 40px 100px rgba(62,37,24,0.28), 0 0 0 1px rgba(62,37,24,0.08)",
        }}>
          <DSidebar step={step} />
          <div style={{ flex: 1, position: "relative", minHeight: 560, display: "flex", flexDirection: "column" }}>
            <div style={{
              opacity: busy ? 0 : 1,
              transform: busy ? `translateX(${dir * 24}px)` : "translateX(0)",
              transition: "all 0.21s ease",
              flex: 1, display: "flex", flexDirection: "column",
            }}>
              {screens[step]}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ROOT EXPORT
   ════════════════════════════════════════════════════════════════════════════ */

export default function Onboarding() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleComplete = async () => {
    await completeOnboarding();
    void syncConcernsToProfile(loadConcerns());
    void syncPermissionsToProfile(loadPermissions());
    navigate("/dashboard");
  };

  return isMobile
    ? <MobileOnboarding onComplete={handleComplete} />
    : <DesktopOnboarding onComplete={handleComplete} />;
}
