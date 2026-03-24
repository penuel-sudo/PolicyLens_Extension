// PolicyLens — Content Script
// Injects a floating badge (Grammarly-style) with a risk-level glow indicator.
// Uses Shadow DOM so host-page styles never bleed in.

(function () {
  "use strict";

  // ─── prevent double-injection ───────────────────────────────────────────────
  if (document.getElementById("policylens-host")) return;

  // ─── state ──────────────────────────────────────────────────────────────────
  let currentRisk  = "scanning";
  let isDragging   = false;
  let dragStartX   = 0;
  let dragStartY   = 0;
  let badgeStartX  = 0;
  let badgeStartY  = 0;
  let popupIframe  = null;   // the floating popup iframe, or null when closed
  let popupHeight  = 0;

  const BADGE_SIZE = 52;
  const BADGE_PAD = 8;
  const POPUP_GAP = 10;
  const POPUP_WIDTH = 340;
  const POPUP_PAD = 8;

  // ─── risk → visual mapping ───────────────────────────────────────────────────
  const RISK_MAP = {
    high:     { label: "High Risk" },
    med:      { label: "Medium Risk" },
    low:      { label: "Low Risk" },
    scanning: { label: "Analyzing…" },
    idle:     { label: "PolicyLens" },
  };

  function isRuntimeAvailable() {
    try { return !!(chrome?.runtime?.id); } catch { return false; }
  }

  function getRuntimeURLSafe(path) {
    if (!isRuntimeAvailable()) return null;
    try { return chrome.runtime.getURL(path); } catch { return null; }
  }

  const LOGO_URL = getRuntimeURLSafe("favicon_io/favicon-32x32.png");

  // ─── CSS ─────────────────────────────────────────────────────────────────────
  const CSS = `
    :host {
      all: initial;
      position: fixed;
      right: 18px;
      bottom: 88px;
      z-index: 2147483647;
      width: 52px;
      height: 52px;
      display: block;
    }
    .pl-badge {
      position: relative;
      width: 52px; height: 52px;
      border-radius: 50%;
      background: rgba(250,246,241,0.96);
      backdrop-filter: blur(14px) saturate(160%);
      -webkit-backdrop-filter: blur(14px) saturate(160%);
      border: 2px solid rgba(92,61,46,0.22);
      box-shadow: 0 4px 20px rgba(92,61,46,0.18), 0 1px 4px rgba(92,61,46,0.12);
      cursor: pointer; user-select: none;
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1),
                  box-shadow 0.18s ease, border-color 0.18s ease;
      will-change: transform;
    }
    .pl-badge:hover {
      transform: scale(1.10);
      border-color: rgba(92,61,46,0.38);
      box-shadow: 0 8px 28px rgba(92,61,46,0.24), 0 2px 8px rgba(92,61,46,0.14);
    }
    .pl-badge:active { transform: scale(0.96); }
    .pl-logo {
      width: 28px; height: 28px; border-radius: 6px;
      object-fit: cover; display: block; pointer-events: none;
    }
    .pl-dot {
      position: absolute; top: 1px; right: 1px;
      width: 14px; height: 14px; border-radius: 50%;
      border: 2.5px solid rgba(250,246,241,0.95);
      background: #94A3B8;
      transition: background 0.3s ease, box-shadow 0.3s ease;
    }
    .pl-dot.risk-high    { background: #EF4444; animation: pl-pulse-red   2s   ease-in-out infinite; }
    .pl-dot.risk-med     { background: #F59E0B; animation: pl-pulse-amber 2s   ease-in-out infinite; }
    .pl-dot.risk-low     { background: #22C55E; animation: pl-pulse-green 2.5s ease-in-out infinite; }
    .pl-dot.risk-scanning{ background: #94A3B8; animation: pl-pulse-gray  1.2s ease-in-out infinite; }
    @keyframes pl-pulse-red    { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.55)}  50%{box-shadow:0 0 0 6px rgba(239,68,68,0)} }
    @keyframes pl-pulse-amber  { 0%,100%{box-shadow:0 0 0 0 rgba(245,158,11,0.55)} 50%{box-shadow:0 0 0 6px rgba(245,158,11,0)} }
    @keyframes pl-pulse-green  { 0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.45)}  50%{box-shadow:0 0 0 5px rgba(34,197,94,0)} }
    @keyframes pl-pulse-gray   { 0%,100%{opacity:1} 50%{opacity:0.45} }
    .pl-tooltip {
      position: absolute; right: 58px; top: 50%; transform: translateY(-50%);
      background: rgba(30,15,10,0.88); backdrop-filter: blur(8px);
      color: #FAF6F1; font-size: 11px; font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      letter-spacing: 0.02em; padding: 5px 10px; border-radius: 6px;
      white-space: nowrap; pointer-events: none; opacity: 0;
      transition: opacity 0.15s ease;
      box-shadow: 0 2px 10px rgba(0,0,0,0.22);
    }
    .pl-tooltip::after {
      content: ''; position: absolute; left: 100%; top: 50%;
      transform: translateY(-50%); border: 5px solid transparent;
      border-left-color: rgba(30,15,10,0.88);
    }
    .pl-badge:hover .pl-tooltip { opacity: 1; }
    .pl-badge.dragging { transition: none; cursor: grabbing; transform: scale(1.06); }
  `;

  // ─── build badge DOM ─────────────────────────────────────────────────────────
  const host = document.createElement("div");
  host.id = "policylens-host";
  document.body.appendChild(host);

  const shadow  = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  shadow.appendChild(styleEl);

  const badge   = document.createElement("div"); badge.className   = "pl-badge";
  const logo    = document.createElement("img"); logo.className    = "pl-logo";
  const dot     = document.createElement("div"); dot.className     = "pl-dot risk-scanning";
  const tooltip = document.createElement("div"); tooltip.className = "pl-tooltip";

  if (LOGO_URL) logo.src = LOGO_URL;
  logo.alt      = "PolicyLens";
  logo.draggable = false;
  tooltip.textContent = "Analyzing…";

  badge.appendChild(logo);
  badge.appendChild(dot);
  badge.appendChild(tooltip);
  shadow.appendChild(badge);

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function setBadgePosition(x, y) {
    const maxX = Math.max(BADGE_PAD, window.innerWidth - BADGE_SIZE - BADGE_PAD);
    const maxY = Math.max(BADGE_PAD, window.innerHeight - BADGE_SIZE - BADGE_PAD);
    const nx = clamp(x, BADGE_PAD, maxX);
    const ny = clamp(y, BADGE_PAD, maxY);
    host.style.left = nx + "px";
    host.style.top = ny + "px";
  }

  function getBadgePosition() {
    return {
      x: parseInt(host.style.left || "0", 10),
      y: parseInt(host.style.top || "0", 10),
    };
  }

  Object.assign(host.style, {
    position:  "fixed",
    zIndex:    "2147483647",
    width:     BADGE_SIZE + "px",
    height:    BADGE_SIZE + "px",
    display:   "block",
    userSelect:"none",
  });

  // Start near bottom-right, while still keeping the badge fully in view.
  setBadgePosition(window.innerWidth - BADGE_SIZE - 18, window.innerHeight - BADGE_SIZE - 88);

  // ─── risk display ────────────────────────────────────────────────────────────
  function setRisk(risk) {
    currentRisk = risk;
    const entry = RISK_MAP[risk] ?? RISK_MAP.idle;
    dot.className = `pl-dot risk-${risk}`;
    tooltip.textContent = entry.label;
    badge.style.borderColor =
      risk === "high" ? "rgba(239,68,68,0.40)" :
      risk === "med"  ? "rgba(245,158,11,0.40)" : "";
  }

  // ─── iframe popup ────────────────────────────────────────────────────────────

  /**
   * WHY THIS APPROACH WORKS
   * ────────────────────────
   * 1. iframe starts at height:0  → no flash, no empty space visible
   * 2. allowtransparency + transparent background → iframe is a see-through
   *    window; the .popup component draws its own bg/border/shadow
   * 3. overflow:hidden on the iframe element → kills the horizontal scrollbar
   *    that appears when the page's default styles add margin/padding inside
   * 4. PL_RESIZE message arrives from ResizeObserver inside the popup →
   *    we snap the iframe to the exact content height, zero empty space
   * 5. We listen for outside clicks on the *document*, not inside the iframe
   *    (you cannot detect clicks inside an iframe from the parent page) —
   *    so we close on any click outside the iframe's bounding rect
   */
  function createPopup() {
    // ── toggle: click again to close ────────────────────────────────────────
    if (popupIframe) { destroyPopup(); return; }

    const iframeURL = getRuntimeURLSafe("floating-popup.html");
    if (!iframeURL) return;

    popupIframe = document.createElement("iframe");
    popupIframe.id  = "policylens-popup-frame";
    popupIframe.src = iframeURL;
    popupIframe.setAttribute("scrolling", "no");

    // allowtransparency is the HTML attribute that tells the browser to honour
    // a transparent background inside the iframe. Without it Chrome ignores it.
    popupIframe.setAttribute("allowtransparency", "true");

    Object.assign(popupIframe.style, {
      position:        "fixed",
      top:             "0px",
      left:            "0px",
      width:           "340px",

      // ── THE KEY: start at 0 height ───────────────────────────────────────
      // PL_RESIZE will set the real height once React has rendered.
      // Starting at 0 means there is never a flash of empty space.
      height:          "0px",

      border:          "none",          // no iframe border ever
      background:      "transparent",   // see-through; popup draws itself
      overflow:        "hidden",        // kills horizontal scrollbar
      scrollbarWidth:  "none",          // Firefox fallback if browser exposes iframe scrollbars
      borderRadius:    "20px",          // clips the iframe to popup's shape
      zIndex:          "2147483646",    // just below the badge
      display:         "block",
      pointerEvents:   "auto",
      colorScheme:     "light",
    });

    document.body.appendChild(popupIframe);
    updatePopupPosition();

    // ── close on outside click ───────────────────────────────────────────────
    // Small delay so this click (that opened it) doesn't immediately close it
    setTimeout(() => {
      document.addEventListener("click", handleOutsideClick, { capture: true });
    }, 80);
  }

  function destroyPopup() {
    if (popupIframe) {
      popupIframe.remove();
      popupIframe = null;
    }
    document.removeEventListener("click", handleOutsideClick, { capture: true });
  }

  function handleOutsideClick(e) {
    if (!popupIframe) return;
    const rect = popupIframe.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left  &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top   &&
      e.clientY <= rect.bottom;
    // Also don't close when clicking the badge itself
    const badgeRect = host.getBoundingClientRect();
    const onBadge =
      e.clientX >= badgeRect.left  &&
      e.clientX <= badgeRect.right &&
      e.clientY >= badgeRect.top   &&
      e.clientY <= badgeRect.bottom;
    if (!inside && !onBadge) destroyPopup();
  }

  function updatePopupPosition() {
    if (!popupIframe) return;

    const { x, y } = getBadgePosition();
    const measuredHeight = popupHeight > 0 ? popupHeight : 360;

    const spaceAbove = y - POPUP_GAP;
    const spaceBelow = window.innerHeight - (y + BADGE_SIZE) - POPUP_GAP;
    const showBelow = spaceAbove < measuredHeight && spaceBelow > spaceAbove;

    let popupTop = showBelow
      ? y + BADGE_SIZE + POPUP_GAP
      : y - measuredHeight - POPUP_GAP;

    const maxTop = Math.max(POPUP_PAD, window.innerHeight - measuredHeight - POPUP_PAD);
    popupTop = clamp(popupTop, POPUP_PAD, maxTop);

    let popupLeft = x + BADGE_SIZE - POPUP_WIDTH;
    const maxLeft = Math.max(POPUP_PAD, window.innerWidth - POPUP_WIDTH - POPUP_PAD);
    popupLeft = clamp(popupLeft, POPUP_PAD, maxLeft);

    popupIframe.style.top = popupTop + "px";
    popupIframe.style.left = popupLeft + "px";
    popupIframe.style.right = "auto";
    popupIframe.style.bottom = "auto";
  }

  // ── receive height from popup's ResizeObserver ───────────────────────────────
  window.addEventListener("message", (e) => {
    if (e.data?.type === "PL_RESIZE" && popupIframe) {
      const h = Math.ceil(e.data.height);
      popupHeight = h;
      popupIframe.style.height = h + "px";
      updatePopupPosition();
    }
  });

  // ─── drag ────────────────────────────────────────────────────────────────────
  badge.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    isDragging  = false;
    dragStartX  = e.clientX;
    dragStartY  = e.clientY;
    const pos = getBadgePosition();
    badgeStartX = pos.x;
    badgeStartY = pos.y;

    const onMove = (ev) => {
      const deltaX = ev.clientX - dragStartX;
      const deltaY = ev.clientY - dragStartY;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) isDragging = true;
      if (isDragging) {
        badge.classList.add("dragging");
        setBadgePosition(badgeStartX + deltaX, badgeStartY + deltaY);
        updatePopupPosition();
      }
    };
    const onUp = () => {
      badge.classList.remove("dragging");
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup",   onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup",   onUp);
  });

  window.addEventListener("resize", () => {
    const { x, y } = getBadgePosition();
    setBadgePosition(x, y);
    updatePopupPosition();
  });

  // ─── badge click → open / close popup ───────────────────────────────────────
  badge.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isDragging) return;
    createPopup();
  });

  // ─── listen for risk updates from background ─────────────────────────────────
  if (isRuntimeAvailable()) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.type === "RISK_UPDATE") setRisk(msg.risk);
      if (msg.type === "POLICY_RESULT") {
        if (msg.ok) {
          setRisk("low");
          console.log("[PolicyLens] Policy scraped:", msg.policyUrl);
        } else {
          setRisk("idle");
          console.warn("[PolicyLens] Policy pipeline failed:", msg.error);
        }
      }
    });
  }

  function triggerPolicyFetch() {
    if (!isRuntimeAvailable()) return;

    let hostname = "";
    try {
      hostname = new URL(window.location.href).hostname;
    } catch {
      return;
    }

    if (!hostname) return;

    chrome.runtime.sendMessage({ type: "FETCH_POLICY", hostname }, () => {
      const err = chrome.runtime.lastError;
      if (err) {
        console.warn("[PolicyLens] Failed to request policy:", err.message);
      }
    });
  }

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(() => triggerPolicyFetch(), { timeout: 2200 });
  } else {
    setTimeout(triggerPolicyFetch, 800);
  }

  setRisk("scanning");
})();