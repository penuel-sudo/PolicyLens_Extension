import { createHash } from "crypto";
import { analyzePolicyText, markClauseChanges } from "./_analysis.js";
import { RAILWAY_BASE_URL, serverSupabase, type ClauseRisk } from "./_db.js";

type PolicyType = "privacy" | "terms";

type ScrapeRequestBody = {
  hostname?: string;
  forceRefresh?: boolean;
  provider?: "gemini" | "anthropic";
};

type FoundPolicy = {
  type: PolicyType;
  url: string;
};

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.send(JSON.stringify(body));
}

function normalizeHostname(raw: string): string {
  const cleaned = String(raw || "").trim();
  if (!cleaned) return "";
  try {
    const maybe = cleaned.includes("://") ? cleaned : `https://${cleaned}`;
    return new URL(maybe).hostname.toLowerCase().replace(/\.$/, "");
  } catch {
    return cleaned.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function baseDomain(host: string): string {
  return host.replace(/^www\./, "");
}

function decodeHtml(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function extractDuckResultUrls(html: string): string[] {
  const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>/gsi)];
  return matches
    .map((m) => decodeHtml(m[1] || ""))
    .filter((url) => /^https?:\/\//i.test(url));
}

function scorePolicyCandidate(url: string, domain: string, policyType: PolicyType): number {
  try {
    const parsed = new URL(url);
    const host = baseDomain(parsed.hostname.toLowerCase());
    const root = baseDomain(domain);
    const path = `${parsed.pathname}${parsed.search}`.toLowerCase();

    let score = 0;
    if (host === root) score += 60;
    if (host.endsWith(`.${root}`)) score += 35;

    if (policyType === "privacy") {
      if (/privacy/.test(path)) score += 35;
      if (/policy/.test(path)) score += 15;
      if (/legal/.test(path)) score += 6;
    }

    if (policyType === "terms") {
      if (/terms/.test(path)) score += 35;
      if (/service/.test(path)) score += 15;
      if (/legal/.test(path)) score += 6;
    }

    return score;
  } catch {
    return -1000;
  }
}

async function duckSearch(domain: string, policyType: PolicyType): Promise<string | null> {
  const query =
    policyType === "privacy"
      ? `${domain} privacy policy`
      : `${domain} terms of service`;

  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "PolicyLens/1.0" },
  });
  if (!resp.ok) throw new Error(`DuckDuckGo failed (${resp.status})`);

  const html = await resp.text();
  const urls = extractDuckResultUrls(html);
  if (!urls.length) return null;

  const ranked = urls
    .map((candidate) => ({ candidate, score: scorePolicyCandidate(candidate, domain, policyType) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.score > -100 ? ranked[0].candidate : null;
}

async function scrapeUrl(url: string): Promise<string> {
  const endpoint = `${RAILWAY_BASE_URL.replace(/\/$/, "")}/scrape/simple`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, preset: "llm" }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    throw new Error(`Railway scrape failed (${resp.status}): ${detail.slice(0, 220)}`);
  }

  const data = await resp.json();
  const text = String(data?.text || "").trim();
  if (!text) throw new Error("Scraper returned empty text");
  return text;
}

function toHash(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

function riskPriority(level: ClauseRisk): number {
  if (level === "high") return 3;
  if (level === "med") return 2;
  return 1;
}

export default async function handler(req: any, res: any) {
  if (req.method === "OPTIONS") return json(res, 204, {});
  if (req.method !== "POST") return json(res, 405, { error: "Method not allowed" });

  try {
    const body = (req.body || {}) as ScrapeRequestBody;
    const hostname = normalizeHostname(body.hostname || "");

    if (!hostname) {
      return json(res, 400, { error: "Missing hostname" });
    }

    const found: FoundPolicy[] = [];

    const privacyUrl = await duckSearch(hostname, "privacy").catch(() => null);
    if (privacyUrl) found.push({ type: "privacy", url: privacyUrl });

    const termsUrl = await duckSearch(hostname, "terms").catch(() => null);
    if (termsUrl) found.push({ type: "terms", url: termsUrl });

    if (!found.length) {
      return json(res, 404, { error: "No privacy or terms policy URLs found", hostname });
    }

    const nowIso = new Date().toISOString();

    const analyzedDocuments: any[] = [];

    for (const policy of found) {
      const text = await scrapeUrl(policy.url);
      const contentHash = toHash(text);

      const { data: previousDoc, error: previousDocError } = await serverSupabase
        .from("policy_documents")
        .select("id, content_hash, clauses")
        .eq("domain", hostname)
        .eq("doc_type", policy.type)
        .maybeSingle();

      if (previousDocError) {
        throw new Error(`DB read error: ${previousDocError.message}`);
      }

      const shouldAnalyze = body.forceRefresh || !previousDoc || previousDoc.content_hash !== contentHash;

      let risk_level: ClauseRisk = "low";
      let risk_score = 0;
      let summary = "Policy analyzed.";
      let clauses: any[] = Array.isArray(previousDoc?.clauses) ? previousDoc.clauses : [];

      if (shouldAnalyze) {
        const analysis = await analyzePolicyText(text, body.provider);
        clauses = markClauseChanges(analysis.clauses, previousDoc?.clauses);
        risk_level = analysis.risk_level;
        risk_score = analysis.risk_score;
        summary = analysis.summary;
      } else if (previousDoc) {
        const prevClauses = Array.isArray(previousDoc.clauses) ? previousDoc.clauses : [];
        clauses = prevClauses.map((c: any) => ({ ...c, is_new: false, is_updated: false }));
        const high = clauses.some((c: any) => c.risk === "high");
        const med = clauses.some((c: any) => c.risk === "med");
        risk_level = high ? "high" : med ? "med" : "low";
        risk_score = high ? 80 : med ? 55 : 20;
        summary = "No policy changes detected since last analysis.";
      }

      const docPayload = {
        domain: hostname,
        doc_type: policy.type,
        policy_url: policy.url,
        source_engine: "duckduckgo",
        scraped_text: text,
        content_hash: contentHash,
        risk_level,
        risk_score,
        summary,
        clauses,
        last_checked_at: nowIso,
        last_analyzed_at: shouldAnalyze ? nowIso : previousDoc ? nowIso : null,
        updated_at: nowIso,
      };

      const { data: upsertedDoc, error: upsertError } = await serverSupabase
        .from("policy_documents")
        .upsert(docPayload, { onConflict: "domain,doc_type" })
        .select("*")
        .single();

      if (upsertError) {
        throw new Error(`DB upsert error: ${upsertError.message}`);
      }

      analyzedDocuments.push(upsertedDoc);
    }

    const allClauses = analyzedDocuments.flatMap((d) => (Array.isArray(d.clauses) ? d.clauses : []));
    const topFindings = [...allClauses]
      .sort((a: any, b: any) => {
        const freshnessA = a?.is_new || a?.is_updated ? 1 : 0;
        const freshnessB = b?.is_new || b?.is_updated ? 1 : 0;
        const freshnessDiff = freshnessB - freshnessA;
        if (freshnessDiff !== 0) return freshnessDiff;

        const riskDiff = riskPriority((b?.risk || "low") as ClauseRisk) - riskPriority((a?.risk || "low") as ClauseRisk);
        if (riskDiff !== 0) return riskDiff;
        return String(a?.text || "").localeCompare(String(b?.text || ""));
      })
      .slice(0, 3)
      .map((clause: any) => ({
        category: clause.category,
        risk: clause.risk,
        text: clause.text,
        why_it_matters: clause.why_it_matters,
        is_new: !!clause.is_new,
        is_updated: !!clause.is_updated,
      }));

    const overallRisk = analyzedDocuments.some((d) => d.risk_level === "high")
      ? "high"
      : analyzedDocuments.some((d) => d.risk_level === "med")
      ? "med"
      : "low";

    const overallRiskScore =
      analyzedDocuments.length > 0
        ? Math.round(
            analyzedDocuments.reduce((sum, d) => sum + (Number(d.risk_score) || 0), 0) / analyzedDocuments.length,
          )
        : 0;

    const docsFound = analyzedDocuments.map((d) => d.doc_type);
    const totalClauses = allClauses.length;
    const overallSummary = analyzedDocuments
      .map((d) => `${d.doc_type === "privacy" ? "Privacy" : "Terms"}: ${d.summary}`)
      .join(" ");

    const { data: domainRow, error: domainUpsertError } = await serverSupabase
      .from("policy_domains")
      .upsert(
        {
          domain: hostname,
          docs_found: docsFound,
          overall_risk_level: overallRisk,
          overall_risk_score: overallRiskScore,
          total_clauses: totalClauses,
          overall_summary: overallSummary,
          top_findings: topFindings,
          last_checked_at: nowIso,
          last_analyzed_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "domain" },
      )
      .select("*")
      .single();

    if (domainUpsertError) {
      throw new Error(`DB domain upsert error: ${domainUpsertError.message}`);
    }

    return json(res, 200, {
      ok: true,
      domain: hostname,
      domain_summary: domainRow,
      documents: analyzedDocuments,
    });
  } catch (error: any) {
    return json(res, 500, {
      error: "Pipeline failed",
      details: error?.message || "Unknown error",
    });
  }
}
