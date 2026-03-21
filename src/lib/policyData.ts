import { supabase } from "./supabase";

export type RiskLevel = "high" | "med" | "low";

export type TopFinding = {
  category: string;
  risk: RiskLevel;
  text: string;
  why_it_matters: string;
  is_new?: boolean;
  is_updated?: boolean;
};

export type PolicyDomainRow = {
  id: string;
  domain: string;
  docs_found: string[];
  overall_risk_level: RiskLevel;
  overall_risk_score: number;
  total_clauses: number;
  overall_summary: string | null;
  top_findings: TopFinding[];
  saved: boolean;
  last_checked_at: string | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PolicyClause = {
  id: string;
  category: string;
  risk: RiskLevel;
  text: string;
  why_it_matters: string;
  is_new?: boolean;
  is_updated?: boolean;
  hash?: string;
};

export type PolicyDocumentRow = {
  id: string;
  domain: string;
  doc_type: "privacy" | "terms";
  policy_url: string;
  scraped_text: string;
  risk_level: RiskLevel;
  risk_score: number;
  summary: string | null;
  clauses: PolicyClause[];
  last_checked_at: string | null;
  last_analyzed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DomainWithDocuments = {
  domain: PolicyDomainRow;
  documents: PolicyDocumentRow[];
};

function mapDomainRow(row: any): PolicyDomainRow {
  return {
    id: row.id,
    domain: row.domain,
    docs_found: Array.isArray(row.docs_found) ? row.docs_found : [],
    overall_risk_level: row.overall_risk_level || "low",
    overall_risk_score: Number(row.overall_risk_score || 0),
    total_clauses: Number(row.total_clauses || 0),
    overall_summary: row.overall_summary || null,
    top_findings: Array.isArray(row.top_findings) ? row.top_findings : [],
    saved: !!row.saved,
    last_checked_at: row.last_checked_at || null,
    last_analyzed_at: row.last_analyzed_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapDocumentRow(row: any): PolicyDocumentRow {
  return {
    id: row.id,
    domain: row.domain,
    doc_type: row.doc_type,
    policy_url: row.policy_url,
    scraped_text: row.scraped_text,
    risk_level: row.risk_level || "low",
    risk_score: Number(row.risk_score || 0),
    summary: row.summary || null,
    clauses: Array.isArray(row.clauses) ? row.clauses : [],
    last_checked_at: row.last_checked_at || null,
    last_analyzed_at: row.last_analyzed_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listPolicyDomains(): Promise<PolicyDomainRow[]> {
  const { data, error } = await supabase
    .from("policy_domains")
    .select("*")
    .order("last_analyzed_at", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(mapDomainRow);
}

export async function getDomainWithDocuments(domain: string): Promise<DomainWithDocuments | null> {
  const { data: domainRow, error: domainError } = await supabase
    .from("policy_domains")
    .select("*")
    .eq("domain", domain)
    .maybeSingle();

  if (domainError) throw new Error(domainError.message);
  if (!domainRow) return null;

  const { data: docs, error: docsError } = await supabase
    .from("policy_documents")
    .select("*")
    .eq("domain", domain)
    .order("doc_type", { ascending: true });

  if (docsError) throw new Error(docsError.message);

  return {
    domain: mapDomainRow(domainRow),
    documents: (docs || []).map(mapDocumentRow),
  };
}

export async function toggleSavedDomain(domain: string, saved: boolean): Promise<void> {
  const { error } = await supabase
    .from("policy_domains")
    .update({ saved, updated_at: new Date().toISOString() })
    .eq("domain", domain);

  if (error) throw new Error(error.message);
}

export async function runPolicyPipeline(hostname: string, provider?: "gemini" | "anthropic") {
  const endpoint = `${window.location.origin}/api/scrape`;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostname, provider }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data?.error || data?.details || `Pipeline failed (${resp.status})`);
  }

  return data;
}
