import { createClient } from "@supabase/supabase-js";

export function getServerSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing SUPABASE_URL (or VITE_SUPABASE_URL) in server environment.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in server environment.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const RAILWAY_BASE_URL =
  process.env.ANALYSIS_API_BASE_URL ||
  process.env.VITE_ANALYSIS_API_BASE_URL ||
  "https://policylens-production.up.railway.app";

export type ClauseRisk = "high" | "med" | "low";

export type AnalyzedClause = {
  id: string;
  category: string;
  risk: ClauseRisk;
  text: string;
  why_it_matters: string;
  is_new: boolean;
  is_updated: boolean;
  hash: string;
};

export type DocumentAnalysis = {
  risk_level: ClauseRisk;
  risk_score: number;
  summary: string;
  clauses: AnalyzedClause[];
};
