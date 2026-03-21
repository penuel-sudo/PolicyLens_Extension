import { analyzePolicyText, markClauseChanges } from "./_analysis";
import { serverSupabase, type ClauseRisk } from "./_db";

type AnalyzeRequestBody = {
  domain?: string;
  provider?: "gemini" | "anthropic";
  force?: boolean;
};

function json(res: any, status: number, body: unknown) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.send(JSON.stringify(body));
}

function normalizeDomain(input: string): string {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
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
    const body = (req.body || {}) as AnalyzeRequestBody;
    const domain = normalizeDomain(body.domain || "");

    if (!domain) {
      return json(res, 400, { error: "Missing domain" });
    }

    const { data: docs, error: docsError } = await serverSupabase
      .from("policy_documents")
      .select("*")
      .eq("domain", domain)
      .in("doc_type", ["privacy", "terms"]);

    if (docsError) {
      throw new Error(docsError.message);
    }

    if (!docs || docs.length === 0) {
      return json(res, 404, { error: "No cached policy documents for this domain" });
    }

    const nowIso = new Date().toISOString();
    const updatedDocs: any[] = [];

    for (const doc of docs) {
      const analysis = await analyzePolicyText(String(doc.scraped_text || ""), body.provider);
      const clauses = markClauseChanges(analysis.clauses, doc.clauses);

      const { data: savedDoc, error: saveError } = await serverSupabase
        .from("policy_documents")
        .update({
          risk_level: analysis.risk_level,
          risk_score: analysis.risk_score,
          summary: analysis.summary,
          clauses,
          last_analyzed_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", doc.id)
        .select("*")
        .single();

      if (saveError) throw new Error(saveError.message);
      updatedDocs.push(savedDoc);
    }

    const allClauses = updatedDocs.flatMap((d) => (Array.isArray(d.clauses) ? d.clauses : []));

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

    const overallRisk = updatedDocs.some((d) => d.risk_level === "high")
      ? "high"
      : updatedDocs.some((d) => d.risk_level === "med")
      ? "med"
      : "low";

    const overallRiskScore = Math.round(
      updatedDocs.reduce((sum, d) => sum + (Number(d.risk_score) || 0), 0) / Math.max(1, updatedDocs.length),
    );

    const docsFound = updatedDocs.map((d) => d.doc_type);
    const totalClauses = allClauses.length;
    const overallSummary = updatedDocs
      .map((d) => `${d.doc_type === "privacy" ? "Privacy" : "Terms"}: ${d.summary}`)
      .join(" ");

    const { data: domainRow, error: domainError } = await serverSupabase
      .from("policy_domains")
      .upsert(
        {
          domain,
          docs_found: docsFound,
          overall_risk_level: overallRisk,
          overall_risk_score: overallRiskScore,
          total_clauses: totalClauses,
          overall_summary: overallSummary,
          top_findings: topFindings,
          last_analyzed_at: nowIso,
          updated_at: nowIso,
        },
        { onConflict: "domain" },
      )
      .select("*")
      .single();

    if (domainError) throw new Error(domainError.message);

    return json(res, 200, {
      ok: true,
      domain,
      domain_summary: domainRow,
      documents: updatedDocs,
    });
  } catch (error: any) {
    return json(res, 500, {
      error: "Analysis failed",
      details: error?.message || "Unknown error",
    });
  }
}
