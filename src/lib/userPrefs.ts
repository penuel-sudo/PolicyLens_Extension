import { supabase } from "./supabase";

const CONCERNS_KEY    = "pl_concerns";
const PERMISSIONS_KEY = "pl_permissions";

export type PermState = { tabs: boolean; storage: boolean };

// ── CONCERNS ──────────────────────────────────────────────────────────────────

export function saveConcerns(selected: Record<string, boolean>): void {
  const active = Object.entries(selected)
    .filter(([, v]) => v)
    .map(([k]) => k);
  localStorage.setItem(CONCERNS_KEY, JSON.stringify(active));
}

export function loadConcerns(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(CONCERNS_KEY);
    if (!raw) return {};
    const keys: string[] = JSON.parse(raw);
    return Object.fromEntries(keys.map(k => [k, true]));
  } catch {
    return {};
  }
}

export async function syncConcernsToProfile(
  selected: Record<string, boolean>,
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  const active = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
  await supabase
    .from("profiles")
    .update({ concerns: active })
    .eq("id", data.session.user.id);
}

export async function loadConcernsFromProfile(): Promise<Record<string, boolean>> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return loadConcerns();
  const { data: profile } = await supabase
    .from("profiles")
    .select("concerns")
    .eq("id", data.session.user.id)
    .single();
  if (!profile?.concerns) return loadConcerns();
  const dict = Object.fromEntries(
    (profile.concerns as string[]).map((k: string) => [k, true]),
  );
  saveConcerns(dict);
  return dict;
}

// ── PERMISSIONS ───────────────────────────────────────────────────────────────

export function savePermissions(perms: PermState): void {
  localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(perms));
}

export function loadPermissions(): PermState {
  try {
    const raw = localStorage.getItem(PERMISSIONS_KEY);
    if (!raw) return { tabs: false, storage: false };
    return JSON.parse(raw) as PermState;
  } catch {
    return { tabs: false, storage: false };
  }
}

export async function syncPermissionsToProfile(perms: PermState): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase
    .from("profiles")
    .update({ permission_tabs: perms.tabs, permission_storage: perms.storage })
    .eq("id", data.session.user.id);
}

export async function loadPermissionsFromProfile(): Promise<PermState> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return loadPermissions();
  const { data: profile } = await supabase
    .from("profiles")
    .select("permission_tabs, permission_storage")
    .eq("id", data.session.user.id)
    .single();
  if (!profile) return loadPermissions();
  const perms: PermState = {
    tabs:    profile.permission_tabs    ?? false,
    storage: profile.permission_storage ?? false,
  };
  savePermissions(perms);
  return perms;
}

// ── ONBOARDING ────────────────────────────────────────────────────────────────

export async function completeOnboarding(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return;
  await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("id", data.session.user.id);
}

export async function isOnboardingComplete(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return false;
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_complete")
    .eq("id", data.session.user.id)
    .single();
  return profile?.onboarding_complete === true;
}
