// ─── modalPrefs.ts ────────────────────────────────────────────────────────────
// Bridge between Settings and SiteDetailModal.
//   • localStorage  — synchronous, used as immediate read cache
//   • Supabase DB   — persistent per-user, synced async on load and save
// All localStorage values serialised as JSON under a single key.

import { supabase } from "./supabase";

const KEY = "pl_modal_display_prefs";

export interface ModalDisplayPrefs {
  // Display / Appearance panel
  summaryLength: "short" | "medium" | "full";
  showRiskBar:   boolean;
  compactMode:   boolean;
  highlightNew:  boolean;
  fontSize:      "small" | "medium" | "large";
  colorBlind:    boolean;
  // General panel
  autoExpand:    boolean;
  riskLevel:     "low" | "medium" | "high";
  autoScan:      boolean;
  scanOnLoad:    boolean;
  badgeCount:    boolean;
  scanCookieBanners:   boolean;
  scanPrivacyPolicies: boolean;
  scanTerms:     boolean;
  language:      string;
  // Notifications panel
  browserNotif:   boolean;
  notifThreshold: "medium" | "high";
  notifNewSites:  boolean;
  notifWeekly:    boolean;
  soundAlert:     boolean;
  // Privacy panel
  saveHistory:    boolean;
  anonymousStats: boolean;
  cachePages:     boolean;
}

export const MODAL_PREFS_DEFAULTS: ModalDisplayPrefs = {
  summaryLength: "medium",
  showRiskBar:   true,
  compactMode:   false,
  highlightNew:  true,
  fontSize:      "medium",
  colorBlind:    false,
  autoExpand:    false,
  riskLevel:     "medium",
  autoScan:      true,
  scanOnLoad:    true,
  badgeCount:    true,
  scanCookieBanners:   true,
  scanPrivacyPolicies: true,
  scanTerms:     false,
  language:      "en",
  browserNotif:   true,
  notifThreshold: "high",
  notifNewSites:  true,
  notifWeekly:    false,
  soundAlert:     false,
  saveHistory:    true,
  anonymousStats: false,
  cachePages:     true,
};

export function loadModalPrefs(): ModalDisplayPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...MODAL_PREFS_DEFAULTS };
    return { ...MODAL_PREFS_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...MODAL_PREFS_DEFAULTS };
  }
}

export function saveModalPrefs(prefs: Partial<ModalDisplayPrefs>): void {
  const current = loadModalPrefs();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...prefs }));
}

// ─── Supabase DB helpers ──────────────────────────────────────────────────────

/** Load prefs from Supabase, sync back to localStorage, return merged result. */
export async function loadModalPrefsFromDb(): Promise<ModalDisplayPrefs> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return loadModalPrefs();

  const { data, error } = await supabase
    .from("modal_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !data) return loadModalPrefs();

  const prefs: ModalDisplayPrefs = {
    summaryLength: data.summary_length as ModalDisplayPrefs["summaryLength"],
    showRiskBar:   data.show_risk_bar,
    compactMode:   data.compact_mode,
    highlightNew:  data.highlight_new,
    fontSize:      data.font_size as ModalDisplayPrefs["fontSize"],
    colorBlind:    data.color_blind ?? false,
    autoExpand:    data.auto_expand,
    riskLevel:     data.risk_level as ModalDisplayPrefs["riskLevel"],
    autoScan:      data.auto_scan ?? true,
    scanOnLoad:    data.scan_on_load ?? true,
    badgeCount:    data.badge_count ?? true,
    scanCookieBanners:   data.scan_cookie_banners ?? true,
    scanPrivacyPolicies: data.scan_privacy_policies ?? true,
    scanTerms:     data.scan_terms ?? false,
    language:      data.language ?? "en",
    browserNotif:   data.browser_notif ?? true,
    notifThreshold: (data.notif_threshold ?? "high") as "medium" | "high",
    notifNewSites:  data.notif_new_sites ?? true,
    notifWeekly:    data.notif_weekly ?? false,
    soundAlert:     data.sound_alert ?? false,
    saveHistory:    data.save_history ?? true,
    anonymousStats: data.anonymous_stats ?? false,
    cachePages:     data.cache_pages ?? true,
  };

  // Keep localStorage in sync so next synchronous loadModalPrefs() is fresh
  localStorage.setItem(KEY, JSON.stringify(prefs));
  return prefs;
}

/** Save prefs to localStorage immediately; persist to Supabase async. */
export async function saveModalPrefsToDb(prefs: Partial<ModalDisplayPrefs>): Promise<void> {
  // Synchronous local save — modal reads this instantly
  saveModalPrefs(prefs);
  const merged = loadModalPrefs();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("modal_preferences").upsert(
    {
      user_id:               user.id,
      summary_length:        merged.summaryLength,
      show_risk_bar:         merged.showRiskBar,
      compact_mode:          merged.compactMode,
      highlight_new:         merged.highlightNew,
      font_size:             merged.fontSize,
      color_blind:           merged.colorBlind,
      auto_expand:           merged.autoExpand,
      risk_level:            merged.riskLevel,
      auto_scan:             merged.autoScan,
      scan_on_load:          merged.scanOnLoad,
      badge_count:           merged.badgeCount,
      scan_cookie_banners:   merged.scanCookieBanners,
      scan_privacy_policies: merged.scanPrivacyPolicies,
      scan_terms:            merged.scanTerms,
      language:              merged.language,
      browser_notif:         merged.browserNotif,
      notif_threshold:       merged.notifThreshold,
      notif_new_sites:       merged.notifNewSites,
      notif_weekly:          merged.notifWeekly,
      sound_alert:           merged.soundAlert,
      save_history:          merged.saveHistory,
      anonymous_stats:       merged.anonymousStats,
      cache_pages:           merged.cachePages,
      updated_at:            new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );
}
