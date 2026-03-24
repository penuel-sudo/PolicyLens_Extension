import { useState, useEffect, useRef } from "react";
import {
  Search, AlertTriangle, LogOut, TrendingUp,
  Star, ExternalLink, BarChart3, Bell, User,
} from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { signOut } from "./lib/auth";
import { supabase } from "./lib/supabase";
import { isOnboardingComplete } from "./lib/userPrefs";
import SiteDetailModal from "./components/SiteDetailModal";

// ─── types ───────────────────────────────────────────────────────────────────
type Risk = "high" | "med" | "low";
interface SiteRow {
  site: string;
  type: string;
  risk: Risk;
  clauses: number;
  date: string;
  saved?: boolean;
}

// ─── mock data ────────────────────────────────────────────────────────────────
const ALL_ROWS: SiteRow[] = [
  { site: "google.com",    type: "Privacy Policy",   risk: "high", clauses: 12, date: "Today",     saved: true  },
  { site: "shopify.com",   type: "Terms of Service", risk: "med",  clauses: 8,  date: "Yesterday", saved: false },
  { site: "notion.so",     type: "Cookie Banner",    risk: "low",  clauses: 4,  date: "Feb 17",    saved: false },
  { site: "reddit.com",    type: "Privacy Policy",   risk: "high", clauses: 15, date: "Feb 16",    saved: true  },
  { site: "stripe.com",    type: "Data Processing",  risk: "low",  clauses: 6,  date: "Feb 15",    saved: false },
  { site: "twitter.com",   type: "Privacy Policy",   risk: "high", clauses: 18, date: "Feb 14",    saved: false },
  { site: "linkedin.com",  type: "Terms of Service", risk: "med",  clauses: 11, date: "Feb 13",    saved: true  },
  { site: "amazon.com",    type: "Privacy Policy",   risk: "high", clauses: 21, date: "Feb 12",    saved: false },
  { site: "dropbox.com",   type: "Data Processing",  risk: "low",  clauses: 5,  date: "Feb 11",    saved: false },
  { site: "figma.com",     type: "Cookie Banner",    risk: "med",  clauses: 7,  date: "Feb 10",    saved: true  },
];

const STATS = [
  { val: "47",   label: "Sites Analyzed",  trend: "+6 this week"     },
  { val: "12",   label: "High Risk Sites", trend: "↑ 2 new"          },
  { val: "183",  label: "Clauses Flagged", trend: "across all sites" },
  { val: "3.2k", label: "Users Protected", trend: "globally today"   },
];

const SIDEBAR_FILTERS = ["All Sites", "Today", "This Week", "High Risk", "Favorites"] as const;
type SidebarFilter = typeof SIDEBAR_FILTERS[number];

const TOP_TABS = ["Recent", "High Risk", "Saved", "Reports", "Settings"] as const;
type TopTab = typeof TOP_TABS[number];

// ─── style ────────────────────────────────────────────────────────────────────
const style = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,700;1,700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --brown:        #5C3D2E;
    --brown-light:  #7A5244;
    --brown-pale:   #C4A882;
    --cream:        #FAF6F1;
    --cream-dark:   #F0E9DF;
    --cream-deeper: #E4D9CC;
    --green:        #3D6B4F;
    --green-light:  #4E8864;
    --green-pale:   #D4E8DC;
    --green-muted:  #A8C8B5;
    --espresso:     #1E0F0A;
    --text-main:    #2C1810;
    --text-muted:   #7A6258;
    --text-light:   #A8978F;
    --dash-bg:      #C4A882; /* warm caramel — visible page base */
    --dash-card:    #D9C4A8; /* mid tan — nav / sidebar bg */
    --dash-card2:   #F0E9DF; /* cream-dark — card / table surface */
    --dash-border:  rgba(92,61,46,0.28);
    --shadow-xl:    0 32px 80px rgba(92,61,46,0.16), 0 8px 24px rgba(92,61,46,0.10);
    --radius-xl:    28px;
    --radius-lg:    20px;
    --radius-md:    14px;
    --radius-sm:    8px;
  }

  html, body, #root { height: 100%; }

  .db-root {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--dash-bg);
    color: #2C1810;
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
  }

  /* ── NAV BAR ── */
  .db-nav {
    height: 56px;
    min-height: 56px;
    background: rgba(217,196,168,0.90); /* mid-tan glass */
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--dash-border);
    display: flex;
    align-items: center;
    padding: 0 20px;
    gap: 16px;
    z-index: 10;
  }

  .db-nav-divider { width: 1px; height: 20px; background: var(--dash-border); flex-shrink: 0; }

  .db-nav-brand {
    font-family: 'Playfair Display', serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: #2C1810;
    white-space: nowrap;
    flex-shrink: 0;
    user-select: none;
    margin-right: 24px; /* breathing room for tabs */
  }
  .db-nav-brand em {
    font-style: italic;
    color: #ffffff;
    text-shadow: 0 1px 4px rgba(92,61,46,0.30);
  }

  .db-nav-divider {
    width: 1px; height: 20px; background: var(--dash-border); flex-shrink: 0;
    margin-right: 24px; /* keep divider from hugging tabs */
  }

  .db-nav-tabs { display: flex; gap: 2px; flex: 1; }
  .db-nav-tab {
    font-size: 13px;
    font-weight: 500;
    padding: 7px 16px;
    border-radius: 7px;
    border: none;
    background: none;
    color: rgba(44,24,16,0.60);
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }
  .db-nav-tab:hover { background: rgba(92,61,46,0.12); color: rgba(44,24,16,0.90); }
  .db-nav-tab.active { background: rgba(92,61,46,0.20); color: #2C1810; }

  .db-nav-search {
    display: flex;
    align-items: center;
    gap: 7px;
    background: rgba(255,255,255,0.30);
    border: 1px solid rgba(92,61,46,0.25);
    border-radius: 8px;
    padding: 7px 12px;
    font-size: 12px;
    color: rgba(44,24,16,0.50);
    font-family: 'DM Mono', monospace;
    width: 200px;
    transition: all 0.15s;
  }
  .db-nav-search input {
    background: none;
    border: none;
    outline: none;
    color: #2C1810;
    font-size: 12px;
    font-family: 'DM Mono', monospace;
    width: 100%;
  }
  .db-nav-search input::placeholder { color: rgba(44,24,16,0.38); }
  .db-nav-search:focus-within {
    border-color: rgba(92,61,46,0.45);
    background: rgba(255,255,255,0.45);
  }

  .db-nav-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
  .db-nav-icon-btn {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: rgba(255,255,255,0.30);
    border: 1px solid var(--dash-border);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(44,24,16,0.65);
    cursor: pointer;
    transition: all 0.15s;
  }
  .db-nav-icon-btn:hover { background: rgba(255,255,255,0.55); color: #2C1810; }

  .db-nav-user {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 12px 5px 5px;
    border-radius: 9px;
    background: rgba(255,255,255,0.30);
    border: 1px solid var(--dash-border);
    cursor: pointer;
    transition: all 0.15s;
  }
  .db-nav-user:hover { background: rgba(255,255,255,0.55); }
  .db-nav-avatar {
    width: 26px;
    height: 26px;
    border-radius: 6px;
    background: var(--brown);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: rgba(255,255,255,0.92);
  }
  .db-nav-username { font-size: 12px; font-weight: 600; color: rgba(44,24,16,0.80); }

  .db-nav-logout {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    background: rgba(255,255,255,0.25);
    border: 1px solid var(--dash-border);
    color: rgba(44,24,16,0.62);
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }
  .db-nav-logout:hover { background: rgba(239,68,68,0.10); border-color: rgba(239,68,68,0.25); color: #DC2626; }

  /* ── BODY ── */
  .db-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* ── SIDEBAR ── */
  .db-sidebar {
    width: 200px;
    min-width: 200px;
    background: rgba(217,196,168,0.90);
    backdrop-filter: blur(16px);
    border-right: 1px solid var(--dash-border);
    padding: 20px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow-y: auto;
  }
  .db-sidebar-section-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(44,24,16,0.52);
    padding: 0 10px;
    margin-bottom: 6px;
    margin-top: 16px;
  }
  .db-sidebar-section-label:first-child { margin-top: 0; }

  /* space between groups: when one section label follows another */
  .db-sidebar-section-label + .db-sidebar-section-label {
    margin-top: 80px;
  }
  .db-sidebar-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: 7px;
    font-size: 12px;
    font-weight: 500;
    color: rgba(44,24,16,0.78); /* clear when idle */
    cursor: pointer;
    transition: all 0.15s;
    user-select: none;
  }
  .db-sidebar-item:hover { background: rgba(255,255,255,0.35); color: rgba(44,24,16,0.95); }
  .db-sidebar-item.active { background: rgba(255,255,255,0.52); color: #2C1810; }
  .db-sidebar-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: rgba(92,61,46,0.35);
    flex-shrink: 0;
    transition: background 0.15s;
  }
  .db-sidebar-item.active .db-sidebar-dot { background: var(--green-muted); }
  .db-sidebar-count {
    margin-left: auto;
    font-size: 10px;
    font-weight: 700;
    background: rgba(92,61,46,0.14);
    padding: 2px 7px;
    border-radius: 100px;
    color: rgba(44,24,16,0.70);
  }
  .db-sidebar-item.active .db-sidebar-count { background: rgba(92,61,46,0.25); color: #2C1810; }
  .db-sidebar-count.high { background: rgba(248,113,113,0.18); color: #F87171; }

  /* ── MAIN ── */
  .db-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .db-main-header {
    padding: 20px 24px 0;
    flex-shrink: 0;
  }
  .db-main-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .db-main-title {
    font-family: 'Playfair Display', serif;
    font-size: 22px;
    font-weight: 700;
    color: #2C1810;
    letter-spacing: -0.01em;
  }
  .db-main-title em { font-style: italic; color: rgba(44,24,16,0.50); }
  .db-main-actions { display: flex; align-items: center; gap: 8px; }
  .db-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    transition: all 0.15s;
  }
  .db-action-btn-outline {
    background: rgba(255,255,255,0.40);
    border: 1px solid var(--dash-border);
    color: rgba(44,24,16,0.75);
  }
  .db-action-btn-outline:hover { background: rgba(255,255,255,0.65); color: #2C1810; }
  .db-action-btn-primary {
    background: var(--green);
    color: white;
    border: 1px solid rgba(255,255,255,0.12);
  }
  .db-action-btn-primary:hover { background: var(--green-light); }

  /* ── STATS ── */
  .db-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 20px;
  }
  .db-stat {
    background: rgba(255,255,255,0.78);
    border: 1px solid rgba(92,61,46,0.30);
    backdrop-filter: blur(12px);
    border-radius: 12px;
    padding: 16px 18px;
    box-shadow: 0 2px 12px rgba(92,61,46,0.12);
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .db-stat:hover { border-color: rgba(92,61,46,0.48); box-shadow: 0 4px 20px rgba(92,61,46,0.16); }
  .db-stat-val {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 700;
    color: #2C1810;
    line-height: 1;
    margin-bottom: 5px;
  }
  .db-stat-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgba(44,24,16,0.50);
    margin-bottom: 3px;
  }
  .db-stat-trend { font-size: 11px; color: var(--green); font-weight: 600; }

  /* ── TABLE AREA ── */
  .db-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 24px;
  }
  .db-scroll::-webkit-scrollbar { width: 6px; }
  .db-scroll::-webkit-scrollbar-track { background: transparent; }
  .db-scroll::-webkit-scrollbar-thumb { background: rgba(92,61,46,0.18); border-radius: 3px; }

  .db-table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .db-table-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(44,24,16,0.45);
  }
  .db-table-meta {
    font-size: 11px;
    color: rgba(44,24,16,0.35);
    font-family: 'DM Mono', monospace;
  }

  .db-table-wrap {
    background: rgba(255,255,255,0.88);
    border-radius: var(--radius-lg);
    border: 1px solid rgba(92,61,46,0.28);
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(92,61,46,0.14), 0 2px 8px rgba(92,61,46,0.10);
  }

  .dash-table { width: 100%; border-collapse: collapse; }
  .dash-table th {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(44,24,16,0.45);
    text-align: left;
    padding: 12px 16px;
    border-bottom: 1px solid rgba(92,61,46,0.18);
    background: rgba(92,61,46,0.06);
    cursor: pointer;
    user-select: none;
    transition: color 0.15s;
  }
  .dash-table th:hover { color: rgba(44,24,16,0.75); }
  .dash-table td {
    padding: 13px 16px;
    font-size: 13px;
    color: rgba(44,24,16,0.78);
    border-bottom: 1px solid rgba(92,61,46,0.10);
  }
  .dash-table tbody tr:last-child td { border-bottom: none; }
  .dash-table tbody tr {
    transition: background 0.12s;
    cursor: pointer;
  }
  .dash-table tbody tr:hover td { background: rgba(92,61,46,0.06); }

  .dash-site-name {
    color: #2C1810;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .dash-site-icon {
    width: 20px;
    height: 20px;
    border-radius: 5px;
    background: rgba(92,61,46,0.10);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 9px;
    font-weight: 700;
    color: rgba(44,24,16,0.55);
    flex-shrink: 0;
    font-family: 'DM Mono', monospace;
  }
  .dash-risk-high { color: #F87171; font-weight: 600; }
  .dash-risk-med  { color: #FCD34D; font-weight: 600; }
  .dash-risk-low  { color: var(--green-muted); font-weight: 600; }

  .db-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .db-badge-high { background: rgba(248,113,113,0.15); color: #F87171; border: 1px solid rgba(248,113,113,0.25); }
  .db-badge-med  { background: rgba(252,211,77,0.15);  color: #FCD34D; border: 1px solid rgba(252,211,77,0.25); }
  .db-badge-low  { background: rgba(61,107,79,0.10); color: var(--green); border: 1px solid rgba(61,107,79,0.25); }

  .db-row-action {
    opacity: 0;
    color: rgba(44,24,16,0.40);
    transition: opacity 0.15s;
  }
  .dash-table tbody tr:hover .db-row-action { opacity: 1; }

  .db-star { cursor: pointer; transition: color 0.15s; }
  .db-star.saved { color: #FCD34D; }
  .db-star:not(.saved) { color: rgba(92,61,46,0.35); }
  .db-star:not(.saved):hover { color: rgba(252,211,77,0.6); }

  /* ── EMPTY STATE ── */
  .db-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 72px 24px;
    color: rgba(44,24,16,0.32);
    gap: 12px;
  }
  .db-empty-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    background: rgba(255,255,255,0.50);
    border: 1px solid rgba(92,61,46,0.22);
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(44,24,16,0.28);
    margin-bottom: 4px;
  }
  .db-empty-title { font-size: 15px; font-weight: 600; color: rgba(44,24,16,0.45); }
  .db-empty-desc  { font-size: 13px; text-align: center; max-width: 280px; line-height: 1.55; }

  @media (max-width: 900px) {
    .db-sidebar { display: none; }
    .db-stats { grid-template-columns: 1fr 1fr; }
    .db-nav-tabs { display: none; }
    .db-nav-search { display: none; }
  }
`;

// ─── helpers ──────────────────────────────────────────────────────────────────
function siteInitials(site: string) {
  return site.replace("www.", "").substring(0, 2).toUpperCase();
}

function filterRows(rows: SiteRow[], tab: TopTab, sidebar: SidebarFilter, query: string): SiteRow[] {
  let r = [...rows];
  if (tab === "High Risk") r = r.filter(x => x.risk === "high");
  if (tab === "Saved")     r = r.filter(x => x.saved);
  if (tab === "Reports")   r = [];
  if (sidebar === "Today")      r = r.filter(x => x.date === "Today");
  if (sidebar === "This Week")  r = r.filter(x => ["Today", "Yesterday", "Feb 17", "Feb 16", "Feb 15"].includes(x.date));
  if (sidebar === "High Risk")  r = r.filter(x => x.risk === "high");
  if (sidebar === "Favorites")  r = r.filter(x => x.saved);
  if (query.trim()) r = r.filter(x => x.site.toLowerCase().includes(query.trim().toLowerCase()));
  return r;
}

// ─── component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate    = useNavigate();
  const [tab,  setTab]    = useState<TopTab>("Recent");
  const [side, setSide]   = useState<SidebarFilter>("All Sites");
  const [query, setQuery] = useState("");
  const [rows, setRows]   = useState<SiteRow[]>(ALL_ROWS);
  const [selectedSite, setSelectedSite] = useState<SiteRow | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState<{name:string,email:string} | null>(null);
  // refs for outside-click detection
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  // "loading" | "login" | "onboarding" | "ready"
  const [status, setStatus] = useState<"loading" | "login" | "onboarding" | "ready">("loading");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { setStatus("login"); return; }
      const done = await isOnboardingComplete();
      setStatus(done ? "ready" : "onboarding");
      // load user profile for sidebar dropdown
      const { data: profile } = await supabase
        .from("profiles")
        .select("name,email")
        .eq("id", data.session.user.id)
        .single();
      if (profile) setUser({ name: profile.name || "", email: profile.email || data.session.user.email || "" });
    })().catch(() => setStatus("login"));
  }, []);

  // close dropdowns when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      const target = e.target as Node;
      if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [notifOpen, profileOpen]);

  if (status === "loading")    return null;
  if (status === "login")      return <Navigate to="/login"      replace />;
  if (status === "onboarding") return <Navigate to="/onboarding" replace />;

  const visible = filterRows(rows, tab, side, query);

  function toggleSaved(site: string) {
    setRows(prev => prev.map(r => r.site === site ? { ...r, saved: !r.saved } : r));
  }

  return (
    <>
      <style>{style}</style>
      <div className="db-root">

        {/* ── NAV BAR ── */}
        <nav className="db-nav">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="db-nav-brand" style={{ fontSize: "22px", color: "#5C3D2E" }}>Policy<em>Lens</em></span>
          </div>
          <div className="db-nav-divider" />

          <div className="db-nav-tabs">
            {TOP_TABS.map(t => (
              <button
                key={t}
                className={`db-nav-tab ${tab === t ? "active" : ""}`}
                onClick={() => t === "Settings" ? navigate("/settings") : setTab(t)}
              >{t}</button>
            ))}
          </div>

          <div className="db-nav-search">
            <Search size={12} />
            <input
              placeholder="Search sites..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>

          {/* topbar actions — bell + profile */}
          <div className="db-nav-actions">

            {/* Bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                className="db-nav-icon-btn"
                onClick={() => { setNotifOpen(p => !p); setProfileOpen(false); }}
              >
                <Bell size={16} />
              </button>
              {notifOpen && (
                <div style={{
                  position: 'absolute', top: 44, right: 0, width: 300,
                  background: 'rgba(217,196,168,0.97)',
                  border: '1px solid rgba(92,61,46,0.28)',
                  borderRadius: 14, padding: '16px 18px',
                  boxShadow: '0 8px 28px rgba(92,61,46,0.18)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 100,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(44,24,16,0.45)', marginBottom: 10 }}>Notifications</div>
                  <div style={{ fontSize: 12, color: 'rgba(44,24,16,0.50)', lineHeight: 1.5 }}>No new notifications</div>
                </div>
              )}
            </div>

            {/* Profile */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                className="db-nav-icon-btn"
                onClick={() => { setProfileOpen(p => !p); setNotifOpen(false); }}
              >
                <User size={16} />
              </button>
              {profileOpen && (
                <div style={{
                  position: 'absolute', top: 44, right: 0, width: 300,
                  background: 'rgba(217,196,168,0.97)',
                  border: '1px solid rgba(92,61,46,0.28)',
                  borderRadius: 14, padding: '16px 18px',
                  boxShadow: '0 8px 28px rgba(92,61,46,0.18)',
                  backdropFilter: 'blur(16px)',
                  zIndex: 100,
                }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#2C1810', fontFamily: "'Playfair Display', serif" }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(44,24,16,0.52)', fontFamily: "'DM Mono', monospace", marginTop: 3 }}>
                    {user?.email || ''}
                  </div>
                  <div style={{ borderTop: '1px solid rgba(92,61,46,0.20)', marginTop: 12, paddingTop: 10 }}>
                    <button
                      onClick={async () => { await signOut(); navigate('/login'); }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 12, color: 'rgba(44,24,16,0.68)',
                        fontFamily: "'DM Sans', sans-serif",
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: 0,
                      }}
                    >
                      <LogOut size={12} /> Log out
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </nav>

        {/* ── BODY ── */}
        <div className="db-body">

          {/* ── SIDEBAR ── */}
          <aside className="db-sidebar" style={{position: 'relative', display:'flex', flexDirection:'column'}}>
            <div className="db-sidebar-section-label">Filter</div>
            {SIDEBAR_FILTERS.map(item => {
              const count =
                item === "All Sites"  ? ALL_ROWS.length :
                item === "Today"      ? ALL_ROWS.filter(r => r.date === "Today").length :
                item === "This Week"  ? ALL_ROWS.filter(r => ["Today","Yesterday","Feb 17","Feb 16","Feb 15"].includes(r.date)).length :
                item === "High Risk"  ? ALL_ROWS.filter(r => r.risk === "high").length :
                item === "Favorites"  ? ALL_ROWS.filter(r => r.saved).length : 0;

              return (
                <div
                  key={item}
                  className={`db-sidebar-item ${side === item ? "active" : ""}`}
                  onClick={() => setSide(item)}
                >
                  <div className="db-sidebar-dot" />
                  {item}
                  <span className={`db-sidebar-count ${item === "High Risk" ? "high" : ""}`}>{count}</span>
                </div>
              );
            })}

            {/* explicit spacer for vertical separation */}
            <div style={{ height: 40 }} />
            <div className="db-sidebar-section-label">Recent Sites</div>
            {ALL_ROWS.slice(0, 5).map((r, i) => (
              <div key={i} className="db-sidebar-item" style={{ fontSize: 11 }}>
                <div className="db-sidebar-dot" style={{ background: r.risk === "high" ? "#F87171" : r.risk === "med" ? "#FCD34D" : "var(--green-muted)" }} />
                {r.site}
              </div>
            ))}

            {/* sidebar bottom — logout */}
            <div style={{ marginTop: 'auto', padding: '16px 12px 20px' }}>
              <button
                className="db-nav-logout"
                onClick={async () => { await signOut(); navigate('/login'); }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <LogOut size={13} /> Log out
              </button>
            </div>
          </aside>

          {/* ── MAIN PANEL ── */}
          <main className="db-main">
            <div className="db-main-header">
              

              {/* stats */}
              <div className="db-stats">
                {STATS.map((s, i) => (
                  <div key={i} className="db-stat">
                    <div className="db-stat-val">{s.val}</div>
                    <div className="db-stat-label">{s.label}</div>
                    <div className="db-stat-trend">{s.trend}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* scrollable table */}
            <div className="db-scroll">
              <div className="db-table-header">
                <span className="db-table-label">
                  {tab === "Reports" ? "Reports" : `${visible.length} site${visible.length !== 1 ? "s" : ""}`}
                </span>
                <span className="db-table-meta">
                  {query ? `matching "${query}"` : side !== "All Sites" ? side : "all time"}
                </span>
              </div>

              <div className="db-table-wrap">
                {tab === "Reports" ? (
                  <div className="db-empty">
                    <div className="db-empty-icon"><BarChart3 size={24} /></div>
                    <div className="db-empty-title">No reports yet</div>
                    <div className="db-empty-desc">Analyze a site and save it to generate an exportable report.</div>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="db-empty">
                    <div className="db-empty-icon"><TrendingUp size={24} /></div>
                    <div className="db-empty-title">No results</div>
                    <div className="db-empty-desc">
                      {query ? `No sites match "${query}".` : "No sites match this filter."}
                    </div>
                  </div>
                ) : (
                  <table className="dash-table">
                    <thead>
                      <tr>
                        <th>Site</th>
                        <th>Type</th>
                        <th>Risk</th>
                        <th>Clauses</th>
                        <th>Analyzed</th>
                        <th style={{ width: 60 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((r, i) => (
                        <tr key={i} onClick={() => setSelectedSite(r)}>
                          <td>
                            <span className="dash-site-name">
                              <span className="dash-site-icon">{siteInitials(r.site)}</span>
                              {r.site}
                            </span>
                          </td>
                          <td style={{ color: "rgba(44,24,16,0.52)" }}>{r.type}</td>
                          <td>
                            <span className={`db-badge ${r.risk === "high" ? "db-badge-high" : r.risk === "med" ? "db-badge-med" : "db-badge-low"}`}>
                              {r.risk === "high" ? <><AlertTriangle size={9} /> High</> : r.risk === "med" ? "~ Medium" : "✓ Low"}
                            </span>
                          </td>
                          <td style={{ fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.clauses}</td>
                          <td style={{ color: "rgba(44,24,16,0.42)", fontSize: 12 }}>{r.date}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <Star
                                size={13}
                                fill={r.saved ? "#FCD34D" : "none"}
                                className={`db-star ${r.saved ? "saved" : ""}`}
                                onClick={e => { e.stopPropagation(); toggleSaved(r.site); }}
                              />
                              <ExternalLink size={13} className="db-row-action"
                                onClick={e => { e.stopPropagation(); window.open(`https://${r.site}`, "_blank", "noopener,noreferrer"); }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── site detail modal ── */}
      {selectedSite && (
        <SiteDetailModal
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
          onSaveToggle={(site: string) => {
            toggleSaved(site);
            // keep selectedSite.saved in sync so the modal star reflects the new state
            setSelectedSite(prev => prev ? { ...prev, saved: !prev.saved } : null);
          }}
        />
      )}
    </>
  );
}
