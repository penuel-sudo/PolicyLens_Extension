import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import {
  Settings2, Target, Palette, Bell, Lock, BookOpen,
  Cookie, FileText, FolderOpen, CreditCard,
  Bot, Calendar, Globe, Bug, Lightbulb, Star,
  Shield, ChevronRight, AlertTriangle, ShieldCheck, Check,
  Folders, HardDrive,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { loadModalPrefsFromDb, saveModalPrefsToDb } from "../lib/modalPrefs";
import {
  loadConcerns, saveConcerns, syncConcernsToProfile, loadConcernsFromProfile,
  loadPermissions, syncPermissionsToProfile, loadPermissionsFromProfile,
  type PermState,
} from "../lib/userPrefs";

// ── COLOR TOKENS ─────────────────────────────────────────────────────────────
const C = {
  cream:        "#FDF8F0",
  creamDark:    "#F5EBD8",
  creamMid:     "#EEE0C8",
  creamLine:    "#E0CEBA",
  choco:        "#5C3D2E",
  chocoDeep:    "#3E2518",
  chocoLight:   "#7A5242",
  tan:          "#B8966A",
  tanLight:     "#D4BFA8",
  tanFaint:     "#EDE0CC",
  muted:        "#9B8B7A",
  text:         "#2C1810",
  sub:          "#6B5744",
  green:        "#4A8C3F",
  greenLight:   "#F0FAF0",
  greenLine:    "#C3E0BF",
  greenDark:    "#366B2E",
  red:          "#EF4444",
  redBg:        "#FEE2E2",
  redText:      "#991B1B",
  amber:        "#F59E0B",
  amberBg:      "#FEF3C7",
  amberText:    "#92400E",
  blue:         "#1D4ED8",
  blueBg:       "#EFF6FF",
  blueBorder:   "#BFDBFE",
  purple:       "#7C3AED",
  purpleBg:     "#F5F3FF",
  purpleBorder: "#DDD6FE",
  // Sidebar: lightened from original #2C1810 (near-black espresso)
  sidebar:      "#6B4A35",
} as const;

// ── SETTINGS NAV ─────────────────────────────────────────────────────────────
type NavSection = {
  id: string;
  label: string;
  Icon: LucideIcon;
  desc: string;
};

const NAV_SECTIONS: NavSection[] = [
  { id: "general",       label: "General",       Icon: Settings2, desc: "Scanning & alerts"  },
  { id: "concerns",      label: "My Concerns",   Icon: Target,    desc: "Topic preferences"  },
  { id: "appearance",    label: "Display",        Icon: Palette,   desc: "Popup & badges"     },
  { id: "notifications", label: "Notifications",  Icon: Bell,      desc: "Alert behaviour"    },
  { id: "privacy",       label: "Privacy",        Icon: Lock,      desc: "Data & storage"     },
  { id: "permissions",   label: "Permissions",    Icon: ShieldCheck, desc: "Browser access"   },
  { id: "about",         label: "About",          Icon: BookOpen,    desc: "Version & support" },
];

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ── PREFERENCE DATA ───────────────────────────────────────────────────────────
type PrefCategory = {
  id: string;
  label: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  pills: string[];
};

const PREF_CATEGORIES: PrefCategory[] = [
  {
    id: "privacy", label: "Privacy", Icon: Lock,
    color: C.green, bg: C.greenLight, border: C.greenLine,
    pills: ["Data collection","Third-party sharing","Profile building","Location tracking","Biometric data","Cross-site tracking","Data retention","Anonymisation"],
  },
  {
    id: "cookies", label: "Cookies", Icon: Cookie,
    color: "#B45309", bg: "#FFFBEB", border: "#FDE68A",
    pills: ["Essential cookies","Analytics tracking","Ad targeting","Session data","Persistent cookies","Third-party cookies"],
  },
  {
    id: "terms", label: "Terms", Icon: FileText,
    color: C.choco, bg: C.cream, border: C.creamLine,
    pills: ["Auto-renewal","Cancellation policy","Arbitration clause","Liability limits","IP ownership","Account termination","Fee changes"],
  },
  {
    id: "data", label: "Data Rights", Icon: FolderOpen,
    color: C.blue, bg: C.blueBg, border: C.blueBorder,
    pills: ["Right to delete","Data portability","Access requests","GDPR","CCPA rights","Breach notice"],
  },
  {
    id: "financial", label: "Financial", Icon: CreditCard,
    color: C.purple, bg: C.purpleBg, border: C.purpleBorder,
    pills: ["Payment sharing","Credit checks","Subscription traps","Hidden fees","Refund policy","Price changes"],
  },
];

// ── SHARED COMPONENTS ─────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!on)}
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? C.green : C.tanLight,
        cursor: "pointer", position: "relative", transition: "background 0.25s", flexShrink: 0,
      }}
    >
      <div style={{
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        position: "absolute", top: 3,
        left: on ? 23 : 3,
        transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
      }} />
    </div>
  );
}

function SelectInput({
  value, options, onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: "8px 12px", borderRadius: 8,
        border: `1.5px solid ${C.creamLine}`,
        background: C.cream, color: C.text,
        fontFamily: "'DM Sans',sans-serif",
        fontSize: 13, fontWeight: 500, cursor: "pointer", outline: "none",
        paddingRight: 32,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%239B8B7A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function SettingRow({
  label, desc, children, last = false,
}: {
  label: string; desc?: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "16px 0",
      borderBottom: last ? "none" : `1px solid ${C.creamLine}`,
      gap: 24,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: C.text, marginBottom: 3 }}>
          {label}
        </div>
        {desc && (
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, lineHeight: 1.5 }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function SectionCard({
  title, subtitle, children,
}: {
  title?: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div style={{
      background: C.cream, border: `1px solid ${C.creamLine}`,
      borderRadius: 14, overflow: "hidden", marginBottom: 20,
    }}>
      {(title || subtitle) && (
        <div style={{ padding: "16px 22px", borderBottom: `1px solid ${C.creamLine}`, background: C.creamDark }}>
          {title && (
            <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 15, color: C.text }}>
              {title}
            </div>
          )}
          {subtitle && (
            <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted, marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
      )}
      <div style={{ padding: "4px 22px 6px" }}>{children}</div>
    </div>
  );
}

function FieldLabel({ children, color = C.green }: { children: React.ReactNode; color?: string }) {
  return (
    <span style={{
      fontSize: 9, fontFamily: "'DM Mono',monospace", fontWeight: 700,
      letterSpacing: "0.12em", color, textTransform: "uppercase",
    }}>
      {children}
    </span>
  );
}

function DangerBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "9px 18px", borderRadius: 9,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 700, fontSize: 13, cursor: "pointer", transition: "all 0.18s",
        background: hov ? C.redBg : "transparent",
        color: hov ? C.redText : C.muted,
        border: `1.5px solid ${hov ? "#FECACA" : C.creamLine}`,
      }}
    >
      {children}
    </button>
  );
}

function SaveBtn({ onClick, saved, disabled }: { onClick: () => void; saved: boolean; disabled?: boolean }) {
  const [hov, setHov] = useState(false);
  const isOff = !!disabled && !saved;
  return (
    <button
      onClick={isOff ? undefined : onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: "10px 24px", borderRadius: 9,
        fontFamily: "'DM Sans',sans-serif",
        fontWeight: 700, fontSize: 13, transition: "all 0.2s",
        cursor: isOff ? "default" : "pointer",
        background: saved ? C.green : isOff ? C.creamMid : hov ? C.chocoDeep : C.choco,
        color: isOff ? C.muted : C.cream,
        border: "none",
        display: "flex", alignItems: "center", gap: 7,
        opacity: isOff ? 0.55 : 1,
      }}
    >
      {saved ? "✓ Saved" : "Save changes"}
    </button>
  );
}

// ── PANEL: GENERAL ────────────────────────────────────────────────────────────
function GeneralPanel() {
  const [settings, setSettings] = useState({
    autoScan: true, scanOnLoad: true, riskLevel: "medium", badgeCount: true,
    autoExpand: false, scanCookieBanners: true, scanPrivacyPolicies: true,
    scanTerms: false, language: "en",
  });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadModalPrefsFromDb().then(prefs => {
      setSettings({
        autoScan: prefs.autoScan,
        scanOnLoad: prefs.scanOnLoad,
        riskLevel: prefs.riskLevel,
        badgeCount: prefs.badgeCount,
        autoExpand: prefs.autoExpand,
        scanCookieBanners: prefs.scanCookieBanners,
        scanPrivacyPolicies: prefs.scanPrivacyPolicies,
        scanTerms: prefs.scanTerms,
        language: prefs.language,
      });
    }).catch(() => {});
  }, []);

  const set = (k: string, v: unknown) => {
    setSettings(s => ({ ...s, [k]: v }));
    setDirty(true);
    setSaved(false);
  };
  const save = () => {
    void saveModalPrefsToDb({
      autoScan: settings.autoScan,
      scanOnLoad: settings.scanOnLoad,
      riskLevel: settings.riskLevel as "low" | "medium" | "high",
      badgeCount: settings.badgeCount,
      autoExpand: settings.autoExpand,
      scanCookieBanners: settings.scanCookieBanners,
      scanPrivacyPolicies: settings.scanPrivacyPolicies,
      scanTerms: settings.scanTerms,
      language: settings.language,
    });
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <FieldLabel>General</FieldLabel>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
          General Settings
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          Control how PolicyLens scans and behaves as you browse.
        </p>
      </div>

      <SectionCard title="Scanning" subtitle="Choose what PolicyLens automatically reads">
        <SettingRow label="Auto-scan on page load" desc="Detect and analyse policies as soon as you visit a site">
          <Toggle on={settings.autoScan} onChange={v => set("autoScan", v)} />
        </SettingRow>
        <SettingRow label="Scan cookie banners" desc="Detect consent and cookie notices on every page">
          <Toggle on={settings.scanCookieBanners} onChange={v => set("scanCookieBanners", v)} />
        </SettingRow>
        <SettingRow label="Scan privacy policies" desc="Automatically find and analyse linked privacy policy pages">
          <Toggle on={settings.scanPrivacyPolicies} onChange={v => set("scanPrivacyPolicies", v)} />
        </SettingRow>
        <SettingRow label="Scan terms of service" desc="Also check Terms & Conditions pages (slightly slower)" last>
          <Toggle on={settings.scanTerms} onChange={v => set("scanTerms", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Risk Threshold" subtitle="How sensitive should flagging be?">
        <SettingRow label="Minimum risk level to flag" desc="Only clauses at or above this level will appear in your summary" last>
          <SelectInput
            value={settings.riskLevel}
            onChange={v => set("riskLevel", v)}
            options={[
              { value: "low",    label: "All clauses (Low+)" },
              { value: "medium", label: "Important only (Medium+)" },
              { value: "high",   label: "Critical only (High)" },
            ]}
          />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Display" subtitle="Popup and extension icon behaviour">
        <SettingRow label="Show badge count on icon" desc="Display the number of detected risks on the extension icon">
          <Toggle on={settings.badgeCount} onChange={v => set("badgeCount", v)} />
        </SettingRow>
        <SettingRow label="Auto-expand first clause" desc="Open the top-ranked clause automatically when popup opens" last>
          <Toggle on={settings.autoExpand} onChange={v => set("autoExpand", v)} />
        </SettingRow>
      </SectionCard>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <SaveBtn onClick={save} saved={saved} disabled={!dirty} />
        <button
          onClick={() => { setSettings({
            autoScan: true, scanOnLoad: true, riskLevel: "medium", badgeCount: true,
            autoExpand: false, scanCookieBanners: true, scanPrivacyPolicies: true,
            scanTerms: false, language: "en",
          }); setDirty(true); setSaved(false); }}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif", fontSize: 12,
            color: C.tanLight, padding: "4px 0",
          }}
        >
          Reset to defaults
        </button>
      </div>
    </div>
  );
}

// ── PANEL: CONCERNS ───────────────────────────────────────────────────────────
function ConcernsPanel() {
  const [selected, setSelected] = useState<Record<string, boolean>>(() => loadConcerns());
  const [tab, setTab] = useState(0);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Hydrate from remote on mount (no flicker: localStorage is already loaded)
  useEffect(() => {
    loadConcernsFromProfile().then(remote => setSelected(remote)).catch(() => {});
  }, []);

  const toggle = (cat: string, pill: string) => {
    const key = `${cat}::${pill}`;
    setSelected(s => ({ ...s, [key]: !s[key] }));
    setDirty(true);
    setSaved(false);
  };

  const totalSelected = Object.values(selected).filter(Boolean).length;
  const cat = PREF_CATEGORIES[tab];
  const save = () => {
    saveConcerns(selected);
    void syncConcernsToProfile(selected);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <FieldLabel>Concerns</FieldLabel>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
          My Concerns
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          PolicyLens prioritises alerts for the topics you care about.
        </p>
      </div>

      {/* Stats bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        {PREF_CATEGORIES.map(c => {
          const count = c.pills.filter(p => selected[`${c.id}::${p}`]).length;
          const { Icon: CatIcon } = c;
          return (
            <div key={c.id} style={{
              flex: 1,
              background: count > 0 ? c.bg : C.creamDark,
              border: `1px solid ${count > 0 ? c.border : C.creamLine}`,
              borderRadius: 10, padding: "12px 14px", transition: "all 0.2s",
            }}>
              <CatIcon size={18} color={count > 0 ? c.color : C.tanLight} />
              <div style={{ fontFamily: "'Lora',serif", fontSize: 20, fontWeight: 700, color: count > 0 ? c.color : C.tanLight, marginTop: 4 }}>
                {count}
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 10.5, color: count > 0 ? c.color : C.muted, marginTop: 2, opacity: 0.8 }}>
                {c.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {PREF_CATEGORIES.map((c, i) => {
          const { Icon: TabIcon } = c;
          return (
            <button key={c.id} onClick={() => setTab(i)} style={{
              padding: "8px 16px", borderRadius: 20, border: "none",
              background: tab === i ? C.choco : C.creamDark,
              color: tab === i ? C.cream : C.sub,
              fontFamily: "'DM Sans',sans-serif", fontSize: 13,
              fontWeight: tab === i ? 700 : 500, cursor: "pointer",
              transition: "all 0.18s", display: "flex", alignItems: "center", gap: 6,
            }}>
              <TabIcon size={13} />
              <span>{c.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pill grid */}
      <div style={{
        background: C.creamDark, borderRadius: 14, padding: "20px",
        border: `1px solid ${C.creamLine}`, minHeight: 160, marginBottom: 16,
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {cat.pills.map(pill => {
            const key = `${cat.id}::${pill}`;
            const on = !!selected[key];
            return (
              <button key={pill} onClick={() => toggle(cat.id, pill)} style={{
                padding: "9px 18px", borderRadius: 20,
                border: `1.5px solid ${on ? cat.color : C.creamLine}`,
                background: on ? cat.bg : C.cream,
                color: on ? cat.color : C.sub,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                fontWeight: on ? 700 : 500, cursor: "pointer",
                transition: "all 0.18s",
                display: "flex", alignItems: "center", gap: 6,
                boxShadow: on ? `0 0 0 3px ${cat.border}` : "none",
              }}>
                {on && <Check size={11} />}
                {pill}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active selections summary */}
      {totalSelected > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontSize: 10, fontFamily: "'DM Mono',monospace", color: C.muted,
            fontWeight: 700, letterSpacing: "0.1em", marginBottom: 8,
          }}>
            ALL SELECTED TOPICS ({totalSelected})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PREF_CATEGORIES.map(c =>
              c.pills.filter(p => selected[`${c.id}::${p}`]).map(p => (
                <span
                  key={`${c.id}::${p}`}
                  onClick={() => toggle(c.id, p)}
                  style={{
                    fontSize: 11, fontFamily: "'DM Mono',monospace",
                    background: c.bg, color: c.color,
                    border: `1px solid ${c.border}`,
                    padding: "3px 10px", borderRadius: 12, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}
                >
                  {p} <span style={{ opacity: 0.5, fontSize: 10 }}>×</span>
                </span>
              ))
            )}
          </div>
        </div>
      )}

      <SaveBtn onClick={save} saved={saved} disabled={!dirty} />
    </div>
  );
}

// ── PANEL: DISPLAY ────────────────────────────────────────────────────────────
function AppearancePanel() {
  const [s, setS] = useState({
    summaryLength: "medium", showRiskBar: true, compactMode: false,
    colorBlind: false, highlightNew: true, fontSize: "medium",
  });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadModalPrefsFromDb().then(prefs => {
      setS({
        summaryLength: prefs.summaryLength,
        showRiskBar: prefs.showRiskBar,
        compactMode: prefs.compactMode,
        colorBlind: prefs.colorBlind,
        highlightNew: prefs.highlightNew,
        fontSize: prefs.fontSize,
      });
    }).catch(() => {});
  }, []);

  const set = (k: string, v: unknown) => { setS(prev => ({ ...prev, [k]: v })); setDirty(true); setSaved(false); };
  const save = () => {
    void saveModalPrefsToDb({
      summaryLength: s.summaryLength as "short" | "medium" | "full",
      showRiskBar:   s.showRiskBar,
      compactMode:   s.compactMode,
      highlightNew:  s.highlightNew,
      fontSize:      s.fontSize as "small" | "medium" | "large",
      colorBlind:    s.colorBlind,
    });
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <FieldLabel>Display</FieldLabel>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
          Display Settings
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          Customise how the popup looks and feels.
        </p>
      </div>

      <SectionCard title="Summary" subtitle="Control what appears in the popup">
        <SettingRow label="Summary length" desc="How much detail each clause explanation shows">
          <SelectInput
            value={s.summaryLength}
            onChange={v => set("summaryLength", v)}
            options={[
              { value: "short",  label: "Brief (1 sentence)" },
              { value: "medium", label: "Standard (2–3 sentences)" },
              { value: "full",   label: "Detailed (full context)" },
            ]}
          />
        </SettingRow>
        <SettingRow label="Show risk progress bar" desc="Display a colour bar at the top of the popup showing overall risk level">
          <Toggle on={s.showRiskBar} onChange={v => set("showRiskBar", v)} />
        </SettingRow>
        <SettingRow label="Highlight newly detected clauses" desc="Mark clauses that have changed since your last visit" last>
          <Toggle on={s.highlightNew} onChange={v => set("highlightNew", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Layout" subtitle="Popup density and size">
        <SettingRow label="Compact mode" desc="Reduce spacing to fit more clauses on screen at once">
          <Toggle on={s.compactMode} onChange={v => set("compactMode", v)} />
        </SettingRow>
        <SettingRow label="Font size" desc="Base text size inside the popup" last>
          <SelectInput
            value={s.fontSize}
            onChange={v => set("fontSize", v)}
            options={[
              { value: "small",  label: "Small" },
              { value: "medium", label: "Medium (default)" },
              { value: "large",  label: "Large" },
            ]}
          />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Accessibility">
        <SettingRow label="Colour-blind friendly mode" desc="Replace red/amber/green with high-contrast shapes and patterns" last>
          <Toggle on={s.colorBlind} onChange={v => set("colorBlind", v)} />
        </SettingRow>
      </SectionCard>

      {/* Live popup preview */}
      <div style={{
        background: C.creamDark, borderRadius: 14, padding: "20px 22px",
        border: `1px solid ${C.creamLine}`, marginBottom: 20,
      }}>
        <div style={{
          fontSize: 10, fontFamily: "'DM Mono',monospace", color: C.muted,
          fontWeight: 700, letterSpacing: "0.1em", marginBottom: 14,
        }}>
          POPUP PREVIEW
        </div>
        <div style={{
          background: C.cream, borderRadius: 10,
          border: `1px solid ${C.creamLine}`, overflow: "hidden", maxWidth: 300,
        }}>
          <div style={{
            background: "#FAF3E4", padding: "9px 12px",
            borderBottom: `1px solid ${C.creamLine}`,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />
            <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: C.sub }}>
              example.com
            </span>
            <span style={{
              marginLeft: "auto", fontSize: 9, background: C.redBg, color: C.redText,
              padding: "1px 6px", borderRadius: 3, fontFamily: "'DM Mono',monospace", fontWeight: 700,
            }}>
              ⚠ 2 HIGH
            </span>
          </div>
          {s.showRiskBar && (
            <div style={{ height: 4, background: C.creamDark }}>
              <div style={{ width: "65%", height: "100%", background: `linear-gradient(90deg, ${C.amber}, ${C.red})` }} />
            </div>
          )}
          {[
            { t: "Data sold to advertisers", r: "high"   },
            { t: "Auto-renewal clause",      r: "medium" },
          ].map((item, i) => (
            <div key={i} style={{
              padding: s.compactMode ? "7px 12px" : "11px 12px",
              borderBottom: i === 0 ? `1px solid ${C.creamLine}` : "none",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{
                flex: 1, fontFamily: "'DM Sans',sans-serif", color: C.text,
                fontSize: s.fontSize === "small" ? 10 : s.fontSize === "large" ? 13 : 11.5,
                fontWeight: 500,
              }}>
                {item.t}
              </div>
              <span style={{
                fontSize: 8, fontFamily: "'DM Mono',monospace", fontWeight: 700,
                background: item.r === "high" ? C.redBg : C.amberBg,
                color: item.r === "high" ? C.redText : C.amberText,
                padding: "2px 6px", borderRadius: 3,
              }}>
                {item.r === "high" ? "HIGH" : "MED"}
              </span>
            </div>
          ))}
        </div>
      </div>

      <SaveBtn onClick={save} saved={saved} disabled={!dirty} />
    </div>
  );
}

// ── PANEL: NOTIFICATIONS ──────────────────────────────────────────────────────
function NotificationsPanel() {
  const [s, setS] = useState({
    browserNotif: true, notifHighOnly: false, notifNewSites: true,
    notifWeekly: false, soundAlert: false, notifThreshold: "high",
  });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadModalPrefsFromDb().then(prefs => {
      setS(prev => ({
        ...prev,
        browserNotif: prefs.browserNotif,
        notifNewSites: prefs.notifNewSites,
        notifWeekly: prefs.notifWeekly,
        soundAlert: prefs.soundAlert,
        notifThreshold: prefs.notifThreshold,
      }));
    }).catch(() => {});
  }, []);

  const set = (k: string, v: unknown) => { setS(prev => ({ ...prev, [k]: v })); setDirty(true); setSaved(false); };
  const save = () => {
    void saveModalPrefsToDb({
      browserNotif: s.browserNotif,
      notifNewSites: s.notifNewSites,
      notifWeekly: s.notifWeekly,
      soundAlert: s.soundAlert,
      notifThreshold: s.notifThreshold as "medium" | "high",
    });
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <FieldLabel>Notifications</FieldLabel>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
          Notifications
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          Control when and how PolicyLens alerts you.
        </p>
      </div>

      <SectionCard title="Browser Alerts" subtitle="Desktop notifications from the extension">
        <SettingRow label="Enable browser notifications" desc="Show a desktop alert when a new high-risk policy is detected">
          <Toggle on={s.browserNotif} onChange={v => set("browserNotif", v)} />
        </SettingRow>
        <SettingRow label="Minimum level to notify" desc="Only notify me when risks are at or above this level">
          <SelectInput
            value={s.notifThreshold}
            onChange={v => set("notifThreshold", v)}
            options={[
              { value: "medium", label: "Medium risk & above" },
              { value: "high",   label: "High risk only"      },
            ]}
          />
        </SettingRow>
        <SettingRow label="Notify on first visit only" desc="Don't repeat alerts for sites you've already seen" last>
          <Toggle on={s.notifNewSites} onChange={v => set("notifNewSites", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Sound & Haptics">
        <SettingRow label="Sound alert" desc="Play a subtle chime when a high-risk clause is found" last>
          <Toggle on={s.soundAlert} onChange={v => set("soundAlert", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Digest">
        <SettingRow label="Weekly summary" desc="Receive a weekly digest of sites analysed and risks found" last>
          <Toggle on={s.notifWeekly} onChange={v => set("notifWeekly", v)} />
        </SettingRow>
      </SectionCard>

      <SaveBtn onClick={save} saved={saved} disabled={!dirty} />
    </div>
  );
}

// ── PANEL: PRIVACY ────────────────────────────────────────────────────────────
function PrivacyPanel() {
  const [s, setS] = useState({ saveHistory: true, anonymousStats: false, cachePages: true });
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [cleared, setCleared] = useState(false);

  useEffect(() => {
    loadModalPrefsFromDb().then(prefs => {
      setS({ saveHistory: prefs.saveHistory, anonymousStats: prefs.anonymousStats, cachePages: prefs.cachePages });
    }).catch(() => {});
  }, []);

  const set = (k: string, v: unknown) => { setS(prev => ({ ...prev, [k]: v })); setDirty(true); setSaved(false); };
  const save = () => {
    void saveModalPrefsToDb({ saveHistory: s.saveHistory, anonymousStats: s.anonymousStats, cachePages: s.cachePages });
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2200);
  };
  const clearHistory = () => { setCleared(true); setTimeout(() => setCleared(false), 2500); };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <FieldLabel>Privacy</FieldLabel>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
          Privacy &amp; Data
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          Everything PolicyLens stores stays on your device — always.
        </p>
      </div>

      {/* Trust statement */}
      <div style={{
        background: C.greenLight, border: `1.5px solid ${C.greenLine}`,
        borderRadius: 12, padding: "16px 20px", marginBottom: 20,
        display: "flex", gap: 14, alignItems: "flex-start",
      }}>
        <Shield size={22} color={C.greenDark} style={{ flexShrink: 0, marginTop: 1 }} />
        <div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: 14, color: C.greenDark, marginBottom: 4 }}>
            Your data never leaves this browser
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.sub, lineHeight: 1.7 }}>
            PolicyLens has no user accounts, no cloud sync, and no analytics server.
            All history is stored locally in your browser's extension storage. You own it.
          </div>
        </div>
      </div>

      <SectionCard title="History & Storage" subtitle="Control what PolicyLens remembers">
        <SettingRow label="Save analysis history" desc="Store results from sites you've visited so you can review them in the dashboard">
          <Toggle on={s.saveHistory} onChange={v => set("saveHistory", v)} />
        </SettingRow>
        <SettingRow label="Cache policy pages" desc="Temporarily store page content to speed up re-analysis on revisits" last>
          <Toggle on={s.cachePages} onChange={v => set("cachePages", v)} />
        </SettingRow>
      </SectionCard>

      <SectionCard title="Usage Data">
        <SettingRow label="Share anonymous usage stats" desc="Help improve PolicyLens by sharing anonymised data on which clause types are most common (no URLs or content ever sent)" last>
          <Toggle on={s.anonymousStats} onChange={v => set("anonymousStats", v)} />
        </SettingRow>
      </SectionCard>

      {/* Danger zone */}
      <div style={{ border: "1.5px solid #FECACA", borderRadius: 12, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "14px 20px", background: "#FFF5F5", borderBottom: "1px solid #FECACA" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            <AlertTriangle size={15} color={C.redText} />
            <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 14, color: C.redText }}>
              Danger zone
            </div>
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: "#BE3A3A" }}>
            These actions cannot be undone.
          </div>
        </div>
        <div style={{ padding: "4px 20px 8px", background: C.cream }}>
          <SettingRow label="Clear analysis history" desc="Delete all stored site summaries, risk scores, and cached results">
            <DangerBtn onClick={clearHistory}>
              {cleared ? "✓ Cleared" : "Clear history"}
            </DangerBtn>
          </SettingRow>
          <SettingRow label="Reset all settings" desc="Restore every setting to its factory default state" last>
            <DangerBtn>Reset settings</DangerBtn>
          </SettingRow>
        </div>
      </div>

      <SaveBtn onClick={save} saved={saved} disabled={!dirty} />
    </div>
  );
}

// ── PANEL: ABOUT ──────────────────────────────────────────────────────────────
function AboutPanel() {
  const links: { Icon: LucideIcon; label: string; sub: string }[] = [
    { Icon: BookOpen,  label: "Documentation",     sub: "How-to guides and FAQs"          },
    { Icon: Bug,       label: "Report a bug",       sub: "Something not working right?"    },
    { Icon: Lightbulb, label: "Request a feature",  sub: "Got an idea? We'd love to hear it" },
    { Icon: Star,      label: "Rate the extension", sub: "Enjoying PolicyLens? Leave a review" },
  ];

  const infoGrid: { Icon: LucideIcon; title: string; val: string }[] = [
    { Icon: Bot,      title: "AI Model",   val: "PolicyLens v1 (local)"  },
    { Icon: Calendar, title: "Build date", val: "March 2026"             },
    { Icon: Globe,    title: "Supports",   val: "Chrome, Edge, Firefox"  },
    { Icon: FileText, title: "License",    val: "MIT Open Source"        },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <FieldLabel>About</FieldLabel>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
          About PolicyLens
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          Version info, support, and what makes PolicyLens tick.
        </p>
      </div>

      {/* Version card */}
      <div style={{
        background: `linear-gradient(135deg, ${C.choco}, ${C.chocoDeep})`,
        borderRadius: 14, padding: "28px", marginBottom: 20,
        display: "flex", alignItems: "center", gap: 20,
        position: "relative", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -30, top: -30,
          width: 140, height: 140, borderRadius: "50%",
          background: "rgba(255,255,255,0.05)", pointerEvents: "none",
        }} />
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          border: `2.5px solid ${C.green}`, background: "rgba(74,140,63,0.2)",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          overflow: "hidden",
        }}>
          <img src="/favicon_io/favicon-32x32.png" alt="PolicyLens" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
        <div>
          <div style={{ fontFamily: "'Lora',serif", fontSize: 22, fontWeight: 700, color: C.cream }}>
            PolicyLens
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, color: "rgba(255,255,255,0.50)", marginTop: 4, letterSpacing: "0.06em" }}>
            VERSION 1.0.0 · AI EXTENSION
          </div>
        </div>
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 10, color: C.green, letterSpacing: "0.1em", fontWeight: 700 }}>
            UP TO DATE
          </div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
            Last checked today
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        {infoGrid.map(item => {
          const { Icon: InfoIcon } = item;
          return (
            <div key={item.title} style={{
              background: C.creamDark, border: `1px solid ${C.creamLine}`,
              borderRadius: 10, padding: "14px 16px",
            }}>
              <InfoIcon size={20} color={C.sub} />
              <div style={{ fontFamily: "'DM Mono',monospace", fontSize: 9.5, color: C.muted, letterSpacing: "0.1em", marginTop: 8, marginBottom: 3 }}>
                {item.title.toUpperCase()}
              </div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: C.text }}>
                {item.val}
              </div>
            </div>
          );
        })}
      </div>

      {/* Resource links */}
      <SectionCard title="Resources">
        {links.map((link, i) => {
          const { Icon: LinkIcon } = link;
          return (
            <div
              key={link.label}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "14px 0", cursor: "pointer",
                borderBottom: i < links.length - 1 ? `1px solid ${C.creamLine}` : "none",
                transition: "opacity 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.opacity = "0.7"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.opacity = "1"; }}
            >
              <LinkIcon size={18} color={C.sub} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: 14, color: C.text }}>
                  {link.label}
                </div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 12, color: C.muted }}>
                  {link.sub}
                </div>
              </div>
              <ChevronRight size={16} color={C.tanLight} />
            </div>
          );
        })}
      </SectionCard>
    </div>
  );
}

// ── PANEL: PERMISSIONS ────────────────────────────────────────────────────────
function PermissionsPanel() {
  const [perms, setPerms] = useState<PermState>(() => loadPermissions());
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    loadPermissionsFromProfile().then(remote => setPerms(remote)).catch(() => {});
  }, []);

  const toggle = (key: keyof PermState) => {
    setPerms(p => ({ ...p, [key]: !p[key] }));
    setDirty(true);
    setSaved(false);
  };

  const save = () => {
    void syncPermissionsToProfile(perms);
    setSaved(true);
    setDirty(false);
    setTimeout(() => setSaved(false), 2200);
  };

  const items: { key: keyof PermState; Icon: LucideIcon; title: string; desc: string }[] = [
    {
      key: "tabs",
      Icon: Folders,
      title: "Active tab access",
      desc: "Lets PolicyLens detect policy links and cookie banners on the page you're currently visiting. Read-only — we never modify page content.",
    },
    {
      key: "storage",
      Icon: HardDrive,
      title: "Local storage",
      desc: "Stores your analysis history and preferences so you can track sites across sessions. Stays on your device — never synced externally.",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <FieldLabel>Permissions</FieldLabel>
        <h2 style={{ fontFamily: "'Lora',serif", fontSize: 28, fontWeight: 700, color: C.text, margin: "6px 0 4px", letterSpacing: "-0.02em" }}>
          Browser Permissions
        </h2>
        <p style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
          The access PolicyLens needs to do its job. Your data never leaves your browser.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        {items.map(item => {
          const on = perms[item.key];
          const { Icon: ItemIcon } = item;
          return (
            <div
              key={item.key}
              onClick={() => toggle(item.key)}
              style={{
                border: `1.5px solid ${on ? C.green : C.creamLine}`,
                background: on ? C.greenLight : C.creamDark,
                borderRadius: 12, padding: "18px 20px", cursor: "pointer",
                display: "flex", alignItems: "flex-start", gap: 16,
                transition: "all 0.2s",
                boxShadow: on ? `0 0 0 3px ${C.greenLine}` : "none",
              }}
            >
              <ItemIcon size={22} color={C.choco} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 5 }}>
                  <div style={{ fontFamily: "'Lora',serif", fontWeight: 700, fontSize: 15, color: C.text }}>{item.title}</div>
                  {on && (
                    <span style={{ fontSize: 9.5, fontFamily: "'DM Mono',monospace", background: C.greenLine, color: C.green, padding: "2px 8px", borderRadius: 10, fontWeight: 700, letterSpacing: "0.08em" }}>
                      GRANTED
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: C.sub, fontFamily: "'DM Sans',sans-serif", lineHeight: 1.65 }}>{item.desc}</div>
              </div>
              <div style={{
                width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                border: `2px solid ${on ? C.green : C.tanLight}`,
                background: on ? C.green : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s",
              }}>
                {on && <Check size={12} color="#fff" strokeWidth={3} />}
              </div>
            </div>
          );
        })}
      </div>

      <SaveBtn onClick={save} saved={saved} disabled={!dirty} />
    </div>
  );
}

// ── ROOT EXPORT ───────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const [active, setActive] = useState("general");
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string } | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { setUser(null); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, email")
        .eq("id", data.session.user.id)
        .single();
      setUser(profile ? { name: profile.name ?? "", email: profile.email ?? data.session.user.email ?? "" } : null);
    }).catch(() => setUser(null));
  }, []);

  // Redirect unauthenticated users once the session check resolves
  if (user === null) {
    navigate("/login", { replace: true });
    return null;
  }

  const panels: Record<string, React.ReactNode> = {
    general:       <GeneralPanel />,
    concerns:      <ConcernsPanel />,
    appearance:    <AppearancePanel />,
    notifications: <NotificationsPanel />,
    privacy:       <PrivacyPanel />,
    permissions:   <PermissionsPanel />,
    about:         <AboutPanel />,
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@600;700&family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; }

        .sp-root {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background: #C4A882;
          font-family: 'DM Sans', sans-serif;
          color: #2C1810;
          overflow: hidden;
        }

        /* ── BODY ── */
        .sp-body {
          flex: 1;
          display: flex;
          overflow: hidden;
        }

        /* ── SIDEBAR ── */
        .sp-sidebar {
          width: 240px;
          min-width: 240px;
          background: #6B4A35;
          display: flex;
          flex-direction: column;
          padding: 28px 16px 24px;
          position: relative;
          overflow: hidden;
          border-right: 1px solid rgba(0,0,0,0.10);
          flex-shrink: 0;
        }
        .sp-sidebar-orb1 {
          position: absolute; bottom: -50px; right: -50px;
          width: 160px; height: 160px; border-radius: 50%;
          background: rgba(74,140,63,0.10); pointer-events: none;
        }
        .sp-sidebar-orb2 {
          position: absolute; top: -40px; left: -40px;
          width: 130px; height: 130px; border-radius: 50%;
          background: rgba(255,255,255,0.03); pointer-events: none;
        }
        .sp-sidebar-header {
          display: flex; align-items: center; gap: 10px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(255,255,255,0.10);
          margin-bottom: 18px;
          position: relative; z-index: 1;
        }
        .sp-sidebar-logo-ring {
          width: 34px; height: 34px; border-radius: 50%;
          border: 2px solid #4A8C3F;
          background: rgba(74,140,63,0.15);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sp-sidebar-nav {
          flex: 1;
          display: flex; flex-direction: column; gap: 2px;
          position: relative; z-index: 1;
          overflow-y: auto;
        }
        .sp-sidebar-nav::-webkit-scrollbar { display: none; }
        .sp-nav-btn {
          display: flex; align-items: center; gap: 12px;
          padding: 11px 12px; border-radius: 9px;
          border: none; cursor: pointer; width: 100%; text-align: left;
          background: transparent;
          transition: background 0.18s;
        }
        .sp-nav-btn:hover { background: rgba(255,255,255,0.08); }
        .sp-nav-btn.active { background: rgba(255,255,255,0.13); }
        .sp-nav-btn-text { flex: 1; min-width: 0; }
        .sp-nav-btn-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.45);
          transition: color 0.18s;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sp-nav-btn.active .sp-nav-btn-label { font-weight: 700; color: #FDF8F0; }
        .sp-nav-btn-desc {
          font-family: 'DM Sans', sans-serif;
          font-size: 10.5px; color: rgba(255,255,255,0.25); margin-top: 1px;
        }
        .sp-nav-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #4A8C3F; flex-shrink: 0; margin-left: auto;
        }
        .sp-sidebar-version {
          margin-top: 20px;
          padding: 11px 13px;
          background: rgba(255,255,255,0.05);
          border-radius: 9px;
          border: 1px solid rgba(255,255,255,0.08);
          position: relative; z-index: 1;
          flex-shrink: 0;
        }

        /* ── CONTENT ── */
        .sp-content {
          flex: 1;
          overflow-y: auto;
          padding: 44px 52px;
          background: #F5EBD8;
        }
        .sp-content::-webkit-scrollbar { width: 6px; }
        .sp-content::-webkit-scrollbar-track { background: transparent; }
        .sp-content::-webkit-scrollbar-thumb { background: rgba(92,61,46,0.22); border-radius: 3px; }
        .sp-content::-webkit-scrollbar-thumb:hover { background: rgba(92,61,46,0.38); }

        @media (max-width: 900px) {
          .sp-sidebar { width: 200px; min-width: 200px; padding: 20px 12px 18px; }
          .sp-content { padding: 28px 24px; }
        }
        @media (max-width: 680px) {
          .sp-sidebar { display: none; }
          .sp-content { padding: 24px 18px; }
        }
      `}</style>

      <div className="sp-root">
        {/* ── BODY ── */}
        <div className="sp-body">

          {/* ── SIDEBAR ── */}
          <div className="sp-sidebar">
            <div className="sp-sidebar-orb1" />
            <div className="sp-sidebar-orb2" />

            <div className="sp-sidebar-header">
              <div className="sp-sidebar-logo-ring" style={{ background: "#4A8C3F", border: "none" }}>
                <span style={{ fontFamily: "'Lora',serif", fontSize: 13, fontWeight: 700, color: "#FDF8F0", letterSpacing: "-0.01em" }}>
                  {user ? getInitials(user.name || user.email) : "—"}
                </span>
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontFamily: "'Lora',serif", fontSize: 14, fontWeight: 700, color: "#FDF8F0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {user ? (user.name || user.email.split("@")[0]) : "…"}
                </div>
                <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.28)", letterSpacing: "0.12em" }}>POLICYLENS</div>
              </div>
            </div>

            <div className="sp-sidebar-nav">
              {NAV_SECTIONS.map(s => {
                const on = active === s.id;
                const { Icon } = s;
                return (
                  <button key={s.id} onClick={() => setActive(s.id)} className={`sp-nav-btn${on ? " active" : ""}`}>
                    <Icon size={16} color={on ? "#FDF8F0" : "rgba(255,255,255,0.40)"} />
                    <div className="sp-nav-btn-text">
                      <div className="sp-nav-btn-label">{s.label}</div>
                      <div className="sp-nav-btn-desc">{s.desc}</div>
                    </div>
                    {on && <div className="sp-nav-dot" />}
                  </button>
                );
              })}
            </div>

            <div className="sp-sidebar-version">
              <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", marginBottom: 2 }}>VERSION</div>
              <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.38)" }}>PolicyLens v1.0.0</div>
            </div>
          </div>

          {/* ── CONTENT ── */}
          <div className="sp-content">
            {panels[active]}
          </div>
        </div>
      </div>
    </>
  );
}
