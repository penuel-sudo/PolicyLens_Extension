type ScrapeRequest = {
	hostname?: string;
	url?: string;
};

type DuckResult = {
	title: string;
	url: string;
};

const DEFAULT_RAILWAY_BASE = "https://policylens-production.up.railway.app";

function json(res: any, status: number, body: unknown) {
	res.status(status).setHeader("Content-Type", "application/json");
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
	res.setHeader("Access-Control-Allow-Headers", "Content-Type");
	res.send(JSON.stringify(body));
}

function normalizeHostname(raw: string): string {
	const cleaned = raw.trim();
	if (!cleaned) return "";

	try {
		const maybeUrl = cleaned.includes("://") ? cleaned : `https://${cleaned}`;
		const host = new URL(maybeUrl).hostname.toLowerCase();
		return host.replace(/\.$/, "");
	} catch {
		return cleaned.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
	}
}

function baseDomain(host: string): string {
	return host.replace(/^www\./, "");
}

function extractDuckResults(html: string): DuckResult[] {
	const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gsi)];
	return matches
		.map((m) => {
			const url = decodeHtml(m[1] || "");
			const title = stripTags(decodeHtml(m[2] || "")).trim();
			return { title, url };
		})
		.filter((r) => /^https?:\/\//i.test(r.url));
}

function decodeHtml(input: string): string {
	return input
		.replace(/&amp;/g, "&")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">");
}

function stripTags(input: string): string {
	return input.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

function scorePolicyUrl(candidate: string, host: string): number {
	let score = 0;
	const hostRoot = baseDomain(host);

	try {
		const u = new URL(candidate);
		const candidateHost = baseDomain(u.hostname.toLowerCase());
		const path = `${u.pathname}${u.search}`.toLowerCase();

		if (candidateHost === hostRoot) score += 50;
		if (candidateHost.endsWith(`.${hostRoot}`)) score += 35;

		if (/privacy/.test(path)) score += 30;
		if (/policy/.test(path)) score += 20;
		if (/legal/.test(path)) score += 8;
		if (/terms/.test(path)) score += 5;
	} catch {
		return -1000;
	}

	return score;
}

async function findPolicyUrl(hostname: string): Promise<string | null> {
	const q = encodeURIComponent(`${hostname} privacy policy`);
	const url = `https://duckduckgo.com/html/?q=${q}`;

	const resp = await fetch(url, {
		headers: {
			"User-Agent": "PolicyLens/1.0 (+https://policylens)",
		},
	});

	if (!resp.ok) {
		throw new Error(`DuckDuckGo search failed with ${resp.status}`);
	}

	const html = await resp.text();
	const results = extractDuckResults(html);
	if (!results.length) return null;

	const ranked = results
		.map((r) => ({ ...r, score: scorePolicyUrl(r.url, hostname) }))
		.sort((a, b) => b.score - a.score);

	const best = ranked[0];
	return best && best.score > -100 ? best.url : null;
}

async function scrapePolicy(policyUrl: string): Promise<unknown> {
	const railwayBase = process.env.VITE_ANALYSIS_API_BASE_URL || DEFAULT_RAILWAY_BASE;
	const scrapeUrl = `${railwayBase.replace(/\/$/, "")}/scrape/simple`;

	const resp = await fetch(scrapeUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ url: policyUrl }),
	});

	if (!resp.ok) {
		const text = await resp.text();
		throw new Error(`Railway scrape failed with ${resp.status}: ${text.slice(0, 240)}`);
	}

	return resp.json();
}

export default async function handler(req: any, res: any) {
	if (req.method === "OPTIONS") {
		return json(res, 204, {});
	}

	if (req.method !== "POST") {
		return json(res, 405, { error: "Method not allowed" });
	}

	try {
		const body = (req.body || {}) as ScrapeRequest;
		const rawHost = body.hostname || body.url || "";
		const hostname = normalizeHostname(rawHost);

		if (!hostname) {
			return json(res, 400, { error: "Missing hostname or url" });
		}

		const policyUrl = await findPolicyUrl(hostname);
		if (!policyUrl) {
			return json(res, 404, { error: "No policy URL found", hostname });
		}

		const scraped = await scrapePolicy(policyUrl);
		return json(res, 200, {
			ok: true,
			hostname,
			policyUrl,
			scraped,
		});
	} catch (error: any) {
		return json(res, 500, {
			error: "Pipeline failed",
			details: error?.message || "Unknown error",
		});
	}
}
