(() => {
  "use strict";

  const style = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --brown:       #5C3D2E;
      --brown-lt:    #7A5244;
      --brown-pale:  #C4A882;
      --cream:       #FAF6F1;
      --cream-d:     #F0E9DF;
      --cream-dd:    #E4D9CC;
      --green:       #3D6B4F;
      --green-pale:  #D4E8DC;
      --green-muted: #A8C8B5;
      --text:        #2C1810;
      --muted:       #7A6258;
      --light:       #B09A90;
      --border:      rgba(92,61,46,.14);
      --border-md:   rgba(92,61,46,.22);
    }

    html, body {
      width: 340px;
      background: transparent;
      overflow: hidden;
      scrollbar-width: none;
    }

    html::-webkit-scrollbar, body::-webkit-scrollbar {
      display: none;
      width: 0;
      height: 0;
    }

    #root {
      width: 340px;
      background: transparent;
      overflow: hidden;
    }

    .popup {
      width: 340px;
      height: auto;
      border-radius: 20px;
      display: flex;
      flex-direction: column;

      background: rgba(255,255,255,.62);
      backdrop-filter: blur(28px) saturate(170%);
      -webkit-backdrop-filter: blur(28px) saturate(170%);

      box-shadow:
        inset 0 0 0 2px rgba(255,255,255,.92),
        0 2px 0 rgba(255,255,255,.9) inset,
        0 24px 56px rgba(92,61,46,.18),
        0 6px 18px rgba(92,61,46,.12);
    }

    .popup-header {
      background: rgba(250,246,241,.82);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid rgba(92,61,46,.10);
      padding: 13px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-radius: 18px 18px 0 0;
      flex-shrink: 0;
    }

    .popup-logo { display: flex; align-items: center; gap: 8px; }

    .popup-logo-icon {
      width: 24px;
      height: 24px;
      border-radius: 7px;
      background: var(--brown);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(92,61,46,.30);
      flex-shrink: 0;
    }

    .popup-logo-name {
      font-family: 'Playfair Display', serif;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--brown);
      letter-spacing: -.01em;
    }

    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border-radius: 999px;
      border: 1px solid #f7b2ab;
      background: #fff2f0;
      color: #b42318;
      padding: 4px 9px;
      font-family: 'DM Sans', sans-serif;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: .03em;
      text-transform: uppercase;
    }

    .risk-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 1px;
    }

    .risk-dot.high { background: #ef4444; }
    .risk-dot.med { background: #f59e0b; }
    .risk-dot.low { background: #22c55e; }

    .popup-url {
      padding: 7px 16px;
      border-bottom: 1px solid rgba(92,61,46,.07);
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,.45);
      flex-shrink: 0;
    }

    .popup-url-lock { color: var(--green); flex-shrink: 0; display: inline-flex; }

    .popup-url-text {
      font-family: 'DM Mono', monospace;
      font-size: 10.5px;
      color: var(--light);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .popup-section-title {
      padding: 11px 16px 5px;
      font-size: 9.5px;
      font-weight: 800;
      color: var(--light);
      letter-spacing: .09em;
      text-transform: uppercase;
      flex-shrink: 0;
    }

    .popup-items { flex-shrink: 0; }

    .popup-item { border-bottom: 1px solid rgba(92,61,46,.07); }
    .popup-item:last-of-type { border-bottom: none; }

    .popup-item-header {
      padding: 10px 16px;
      display: flex;
      align-items: flex-start;
      gap: 9px;
      cursor: pointer;
      transition: background .15s;
    }

    .popup-item-header:hover { background: rgba(250,246,241,.7); }

    .popup-item-text {
      flex: 1;
      font-size: 12px;
      font-weight: 500;
      color: var(--text);
      line-height: 1.45;
    }

    .popup-arrow {
      color: var(--light);
      flex-shrink: 0;
      margin-top: 1px;
      transition: transform .22s ease, color .15s;
      display: inline-flex;
      align-items: center;
    }

    .popup-arrow.open { transform: rotate(180deg); color: var(--brown); }

    .popup-expand {
      background: rgba(250,246,241,.65);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border-top: 1px solid rgba(92,61,46,.07);
      padding: 10px 16px 12px 31px;
      animation: expandIn .22s ease both;
    }

    @keyframes expandIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .popup-expand-label {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: var(--green);
      margin-bottom: 4px;
    }

    .popup-expand-body {
      font-size: 11px;
      color: var(--muted);
      line-height: 1.55;
      border-left: 2px solid var(--green-muted);
      padding: 5px 9px;
      border-radius: 0 6px 6px 0;
      background: rgba(61,107,79,.05);
    }

    .popup-footer {
      border-top: 1px solid rgba(92,61,46,.09);
      padding: 11px 14px;
      display: flex;
      gap: 8px;
      flex-shrink: 0;
      background: rgba(250,246,241,.60);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 0 0 18px 18px;
    }

    .popup-btn {
      flex: 1;
      padding: 8px;
      border-radius: 9px;
      border: none;
      font-family: 'DM Sans', sans-serif;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      transition: all .15s;
      letter-spacing: .01em;
    }

    .popup-btn-primary {
      background: var(--brown);
      color: white;
      box-shadow: 0 2px 10px rgba(92,61,46,.28), 0 1px 0 rgba(255,255,255,.12) inset;
    }

    .popup-btn-primary:hover {
      background: var(--brown-lt);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(92,61,46,.32);
    }

    .popup-btn-secondary {
      background: rgba(92,61,46,.08);
      color: var(--muted);
      border: 1.5px solid var(--border);
      backdrop-filter: blur(6px);
    }

    .popup-btn-secondary:hover { background: rgba(92,61,46,.14); color: var(--text); }
  `;

  const ITEMS = [
    {
      dot: "high",
      text: "Your data may be sold to third-party advertisers without explicit consent.",
      why: "Your browsing habits, purchase history, and personal details can be monetized without you knowing who receives them.",
    },
    {
      dot: "med",
      text: "Cookies persist for up to 3 years after your last visit to the site.",
      why: "Long-lived cookies allow extended tracking of your online behaviour, even across other websites you visit.",
    },
    {
      dot: "low",
      text: "You can request deletion of your personal data within 30 days.",
      why: "A positive clause - it gives you GDPR-style control over your data and the right to be forgotten.",
    },
  ];

  const root = document.getElementById("root");
  if (!root) return;

  const styleEl = document.createElement("style");
  styleEl.textContent = style;
  document.head.appendChild(styleEl);

  const popup = document.createElement("div");
  popup.className = "popup";

  const currentUrl = (() => {
    try {
      return new URL(document.referrer).hostname + "/privacy-policy";
    } catch {
      return "acmecorp.com/privacy-policy";
    }
  })();

  popup.innerHTML = `
    <div class="popup-header">
      <div class="popup-logo">
        <div class="popup-logo-icon" aria-hidden="true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3L5 6V11C5 16 8.4 20.7 12 22C15.6 20.7 19 16 19 11V6L12 3Z" stroke="white" stroke-width="2.2" stroke-linejoin="round"/>
          </svg>
        </div>
        <span class="popup-logo-name">PolicyLens</span>
      </div>
      <span class="risk-badge"><span class="risk-dot high"></span>HIGH RISK</span>
    </div>

    <div class="popup-url">
      <span class="popup-url-lock" aria-hidden="true">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 11V8.5A5 5 0 0117 8.5V11" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
        </svg>
      </span>
      <span class="popup-url-text"></span>
    </div>

    <div class="popup-section-title">Key clauses found (12)</div>
    <div class="popup-items"></div>

    <div class="popup-footer">
      <button class="popup-btn popup-btn-primary" type="button">Full Report</button>
      <button class="popup-btn popup-btn-secondary" type="button">Save to Dashboard</button>
    </div>
  `;

  root.appendChild(popup);

  const urlText = popup.querySelector(".popup-url-text");
  if (urlText) {
    urlText.textContent = currentUrl;
  }

  const itemsEl = popup.querySelector(".popup-items");
  let openIndex = 0;

  function renderItems() {
    if (!itemsEl) return;

    itemsEl.innerHTML = "";

    ITEMS.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = "popup-item";

      const header = document.createElement("div");
      header.className = "popup-item-header";

      const dot = document.createElement("span");
      dot.className = `risk-dot ${item.dot}`;
      dot.style.width = "7px";
      dot.style.height = "7px";
      dot.style.marginTop = "4px";

      const text = document.createElement("span");
      text.className = "popup-item-text";
      text.textContent = item.text;

      const arrow = document.createElement("span");
      arrow.className = "popup-arrow" + (openIndex === idx ? " open" : "");
      arrow.innerHTML = `
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;

      header.appendChild(dot);
      header.appendChild(text);
      header.appendChild(arrow);

      header.addEventListener("click", () => {
        openIndex = openIndex === idx ? -1 : idx;
        renderItems();
        reportHeight();
      });

      row.appendChild(header);

      if (openIndex === idx) {
        const expand = document.createElement("div");
        expand.className = "popup-expand";
        expand.innerHTML = `
          <div class="popup-expand-label">Why it matters</div>
          <div class="popup-expand-body"></div>
        `;
        const body = expand.querySelector(".popup-expand-body");
        if (body) body.textContent = item.why;
        row.appendChild(expand);
      }

      itemsEl.appendChild(row);
    });
  }

  function reportHeight() {
    const height = popup.scrollHeight;
    window.parent.postMessage({ type: "PL_RESIZE", height }, "*");
  }

  const ro = new ResizeObserver(reportHeight);
  ro.observe(popup);

  renderItems();
  requestAnimationFrame(reportHeight);
  setTimeout(reportHeight, 40);
})();
