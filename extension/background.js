// PolicyLens — Background Service Worker
// Manages risk state per tab and relays messages to/from content scripts.

const tabRisk = {}; // tabId -> "high" | "med" | "low" | "scanning" | null
const PIPELINE_API_URL = "https://your-vercel-domain.vercel.app/api/scrape";
const RAILWAY_SCRAPE_SIMPLE_URL = "https://policylens-production.up.railway.app/scrape/simple";

chrome.runtime.onInstalled.addListener(() => {
  console.log("[PolicyLens] Extension installed.");
});

// When a tab finishes loading, reset the badge state and notify content script
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && !tab.url.startsWith("chrome://")) {
    tabRisk[tabId] = "scanning";
    updateBadge(tabId, "scanning");
    // Tell content script to show scanning state
    chrome.tabs.sendMessage(tabId, { type: "RISK_UPDATE", risk: "scanning" }).catch(() => {});
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  delete tabRisk[tabId];
});

// Listen for risk results from content scripts or popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "RISK_RESULT" && sender.tab) {
    const { risk } = msg; // "high" | "med" | "low"
    tabRisk[sender.tab.id] = risk;
    updateBadge(sender.tab.id, risk);
    sendResponse({ ok: true });
  }

  if (msg.type === "GET_RISK") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const risk = tabs[0] ? (tabRisk[tabs[0].id] ?? null) : null;
      sendResponse({ risk });
    });
    return true; // async
  }

  if (msg.type === "FETCH_POLICY" && sender.tab) {
    const hostname = normalizeHostname(msg.hostname || sender.tab.url || "");
    if (!hostname) {
      sendResponse({ ok: false, error: "Missing hostname" });
      return false;
    }

    tabRisk[sender.tab.id] = "scanning";
    updateBadge(sender.tab.id, "scanning");

    fetchPolicyPipeline(hostname)
      .then((result) => {
        tabRisk[sender.tab.id] = "low";
        updateBadge(sender.tab.id, "low");

        chrome.tabs.sendMessage(sender.tab.id, {
          type: "POLICY_RESULT",
          ok: true,
          hostname,
          policyUrl: result.policyUrl,
          scraped: result.scraped,
        }).catch(() => {});

        sendResponse({
          ok: true,
          hostname,
          policyUrl: result.policyUrl,
          scraped: result.scraped,
        });
      })
      .catch((error) => {
        tabRisk[sender.tab.id] = "idle";
        updateBadge(sender.tab.id, "idle");

        chrome.tabs.sendMessage(sender.tab.id, {
          type: "POLICY_RESULT",
          ok: false,
          hostname,
          error: error?.message || "Pipeline failed",
        }).catch(() => {});

        sendResponse({ ok: false, error: error?.message || "Pipeline failed" });
      });

    return true;
  }
});

function normalizeHostname(raw) {
  const input = String(raw || "").trim();
  if (!input) return "";

  try {
    const maybeUrl = input.includes("://") ? input : `https://${input}`;
    const hostname = new URL(maybeUrl).hostname.toLowerCase();
    return hostname.replace(/\.$/, "");
  } catch {
    return input.toLowerCase().replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function fetchPolicyPipeline(hostname) {
  if (/your-vercel-domain/.test(PIPELINE_API_URL)) {
    return runFallbackPipeline(hostname);
  }

  return fetch(PIPELINE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostname }),
  })
    .then(async (resp) => {
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Pipeline request failed (${resp.status})`);
      }
      return data;
    });
}

async function runFallbackPipeline(hostname) {
  const policyUrl = await findPolicyUrlViaDuckDuckGo(hostname);
  if (!policyUrl) {
    throw new Error("No privacy policy URL found from DuckDuckGo");
  }

  const scrapeResp = await fetch(RAILWAY_SCRAPE_SIMPLE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: policyUrl }),
  });

  const scraped = await scrapeResp.json().catch(() => ({}));
  if (!scrapeResp.ok) {
    throw new Error(scraped.error || `Scrape request failed (${scrapeResp.status})`);
  }

  return { policyUrl, scraped };
}

async function findPolicyUrlViaDuckDuckGo(hostname) {
  const q = encodeURIComponent(`${hostname} privacy policy`);
  const url = `https://duckduckgo.com/html/?q=${q}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`DuckDuckGo request failed (${resp.status})`);
  }

  const html = await resp.text();
  const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>/gsi)];
  const urls = matches
    .map((m) => decodeHtml(m[1] || ""))
    .filter((u) => /^https?:\/\//i.test(u));

  return urls[0] || null;
}

function decodeHtml(input) {
  return String(input || "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function updateBadge(tabId, risk) {
  const map = {
    high:     { text: "!",  color: "#EF4444" },
    med:      { text: "~",  color: "#F59E0B" },
    low:      { text: "✓",  color: "#22C55E" },
    scanning: { text: "…",  color: "#6B7280" },
    idle:     { text: "",   color: "#6B7280" },
  };
  const entry = map[risk] || { text: "", color: "#6B7280" };
  chrome.action.setBadgeText({ tabId, text: entry.text });
  chrome.action.setBadgeBackgroundColor({ tabId, color: entry.color });
}
