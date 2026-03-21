import { createHash } from "crypto";
import type { AnalyzedClause, ClauseRisk, DocumentAnalysis } from "./_db";

const CLAUSE_CATEGORIES = [
  "Data collection",
  "Third-party sharing",
  "Data retention",
  "Location tracking",
  "Analytics tracking",
  "Cookie usage",
  "Arbitration clause",
  "Liability limits",
  "Cancellation policy",
  "Refund policy",
  "User rights",
  "Security",
];

function toHash(input: string) {
  return createHash("sha256").update(input).digest("hex");
}

function toRiskScore(level: ClauseRisk): number {
  if (level === "high") return 85;
  if (level === "med") return 55;
  return 25;
}

function normalizeClauseText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (/third party|advertis|partner share|sell data/.test(t)) return "Third-party sharing";
  if (/retain|retention|store for/.test(t)) return "Data retention";
  if (/location|gps|geolocation/.test(t)) return "Location tracking";
  if (/cookie/.test(t)) return "Cookie usage";
  if (/analytics|telemetry|tracking/.test(t)) return "Analytics tracking";
  if (/arbitration|dispute resolution|class action/.test(t)) return "Arbitration clause";
  if (/liability|liable|damages/.test(t)) return "Liability limits";
  if (/cancel|termination/.test(t)) return "Cancellation policy";
  if (/refund/.test(t)) return "Refund policy";
  if (/right|access|delete|portability|gdpr|ccpa/.test(t)) return "User rights";
  if (/security|encrypt|breach/.test(t)) return "Security";
  return "Data collection";
}

function detectRisk(text: string): ClauseRisk {
  const t = text.toLowerCase();
  if (
    /sell data|without consent|indefinite retention|waive rights|private message access|background location/.test(t)
  ) {
    return "high";
  }
  if (/third party|partner|tracking|cookies persist|change terms|arbitration|liability/.test(t)) {
    return "med";
  }
  return "low";
}

function splitIntoCandidateClauses(rawText: string): string[] {
  const cleaned = rawText
    .replace(/\r/g, " ")
    .replace(/\t/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleaned) return [];

  const parts = cleaned
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 80 && s.length <= 420);

  return parts.slice(0, 25);
}

function buildHeuristicAnalysis(text: string): DocumentAnalysis {
  const candidates = splitIntoCandidateClauses(text);

  const clauses: AnalyzedClause[] = candidates.slice(0, 12).map((entry) => {
    const clauseText = normalizeClauseText(entry);
    const risk = detectRisk(clauseText);
    const category = detectCategory(clauseText);
    return {
      id: toHash(`clause:${clauseText}`).slice(0, 16),
      category,
      risk,
      text: clauseText,
      why_it_matters:
        risk === "high"
          ? "This can significantly impact user privacy or control and needs immediate attention."
          : risk === "med"
          ? "This could affect user rights or transparency and should be reviewed carefully."
          : "This appears lower-risk but is still relevant for informed consent.",
      is_new: false,
      is_updated: false,
      hash: toHash(clauseText),
    };
  });

  const highCount = clauses.filter((c) => c.risk === "high").length;
  const medCount = clauses.filter((c) => c.risk === "med").length;
  const lowCount = clauses.filter((c) => c.risk === "low").length;

  const risk_level: ClauseRisk = highCount > 0 ? "high" : medCount > 0 ? "med" : "low";
  const risk_score = Math.min(100, highCount * 20 + medCount * 10 + lowCount * 4);

  const summary =
    `Policy analysis found ${clauses.length} notable clauses ` +
    `(${highCount} high, ${medCount} medium, ${lowCount} low). ` +
    `The overall risk level is ${risk_level}.`;

  return {
    risk_level,
    risk_score,
    summary,
    clauses,
  };
}

function extractJsonFromModelText(text: string): any | null {
  const direct = text.trim();
  try {
    return JSON.parse(direct);
  } catch {
    // ignore
  }

  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function analyzeWithGemini(text: string): Promise<DocumentAnalysis | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "Analyze this policy text and return strict JSON only.",
    "JSON schema:",
    "{",
    '  "risk_level": "high|med|low",',
    '  "risk_score": 0-100,',
    '  "summary": "string",',
    '  "clauses": [',
    "    {",
    '      "category": "string",',
    '      "risk": "high|med|low",',
    '      "text": "string",',
    '      "why_it_matters": "string"',
    "    }",
    "  ]",
    "}",
    `Allowed categories: ${CLAUSE_CATEGORIES.join(", ")}`,
    "Keep max 12 clauses.",
    "Policy text:",
    text.slice(0, 22000),
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    }),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  const output =
    data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("\n") || "";
  const parsed = extractJsonFromModelText(output);
  if (!parsed) return null;

  const clauses: AnalyzedClause[] = Array.isArray(parsed.clauses)
    ? parsed.clauses.slice(0, 12).map((c: any) => {
        const textValue = normalizeClauseText(String(c?.text || "")).slice(0, 800);
        return {
          id: toHash(`clause:${textValue}`).slice(0, 16),
          category: String(c?.category || "Data collection"),
          risk: (c?.risk === "high" || c?.risk === "med" || c?.risk === "low" ? c.risk : "med") as ClauseRisk,
          text: textValue,
          why_it_matters: String(c?.why_it_matters || "Important policy point for user awareness."),
          is_new: false,
          is_updated: false,
          hash: toHash(textValue),
        } as AnalyzedClause;
      })
    : [];

  const risk_level: ClauseRisk =
    parsed?.risk_level === "high" || parsed?.risk_level === "med" || parsed?.risk_level === "low"
      ? parsed.risk_level
      : clauses.some((c: AnalyzedClause) => c.risk === "high")
      ? "high"
      : clauses.some((c: AnalyzedClause) => c.risk === "med")
      ? "med"
      : "low";

  const risk_score =
    typeof parsed?.risk_score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.risk_score))) : toRiskScore(risk_level);

  return {
    risk_level,
    risk_score,
    summary: String(parsed?.summary || "Policy analyzed."),
    clauses,
  };
}

async function analyzeWithAnthropic(text: string): Promise<DocumentAnalysis | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const prompt = [
    "Return strict JSON only using schema:",
    "{",
    '  "risk_level": "high|med|low",',
    '  "risk_score": 0-100,',
    '  "summary": "string",',
    '  "clauses": [',
    "    {",
    '      "category": "string",',
    '      "risk": "high|med|low",',
    '      "text": "string",',
    '      "why_it_matters": "string"',
    "    }",
    "  ]",
    "}",
    `Allowed categories: ${CLAUSE_CATEGORIES.join(", ")}`,
    "Max 12 clauses.",
    "Policy text:",
    text.slice(0, 22000),
  ].join("\n");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1400,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  const output =
    data?.content?.map((entry: any) => (entry?.type === "text" ? entry.text : "")).join("\n") || "";
  const parsed = extractJsonFromModelText(output);
  if (!parsed) return null;

  const clauses: AnalyzedClause[] = Array.isArray(parsed.clauses)
    ? parsed.clauses.slice(0, 12).map((c: any) => {
        const textValue = normalizeClauseText(String(c?.text || "")).slice(0, 800);
        return {
          id: toHash(`clause:${textValue}`).slice(0, 16),
          category: String(c?.category || "Data collection"),
          risk: (c?.risk === "high" || c?.risk === "med" || c?.risk === "low" ? c.risk : "med") as ClauseRisk,
          text: textValue,
          why_it_matters: String(c?.why_it_matters || "Important policy point for user awareness."),
          is_new: false,
          is_updated: false,
          hash: toHash(textValue),
        } as AnalyzedClause;
      })
    : [];

  const risk_level: ClauseRisk =
    parsed?.risk_level === "high" || parsed?.risk_level === "med" || parsed?.risk_level === "low"
      ? parsed.risk_level
      : clauses.some((c: AnalyzedClause) => c.risk === "high")
      ? "high"
      : clauses.some((c: AnalyzedClause) => c.risk === "med")
      ? "med"
      : "low";

  const risk_score =
    typeof parsed?.risk_score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.risk_score))) : toRiskScore(risk_level);

  return {
    risk_level,
    risk_score,
    summary: String(parsed?.summary || "Policy analyzed."),
    clauses,
  };
}

export async function analyzePolicyText(text: string, providerHint?: "gemini" | "anthropic"): Promise<DocumentAnalysis> {
  const provider = providerHint || (process.env.ANALYSIS_PROVIDER as "gemini" | "anthropic" | undefined) || "gemini";

  let modelResult: DocumentAnalysis | null = null;
  if (provider === "anthropic") {
    modelResult = await analyzeWithAnthropic(text);
    if (!modelResult) modelResult = await analyzeWithGemini(text);
  } else {
    modelResult = await analyzeWithGemini(text);
    if (!modelResult) modelResult = await analyzeWithAnthropic(text);
  }

  if (modelResult) return modelResult;
  return buildHeuristicAnalysis(text);
}

export function markClauseChanges(newClauses: AnalyzedClause[], previousClausesRaw: unknown): AnalyzedClause[] {
  const previousClauses = Array.isArray(previousClausesRaw) ? (previousClausesRaw as any[]) : [];
  const previousById = new Map<string, any>();
  previousClauses.forEach((c) => {
    if (c && typeof c.id === "string") previousById.set(c.id, c);
  });

  return newClauses.map((clause): AnalyzedClause => {
    const prev = previousById.get(clause.id);
    if (!prev) {
      return { ...clause, is_new: true, is_updated: false };
    }

    const prevHash = String(prev.hash || "");
    const changed: boolean = Boolean(prevHash) && prevHash !== clause.hash;
    return {
      ...clause,
      is_new: false,
      is_updated: changed,
    };
  });
}
