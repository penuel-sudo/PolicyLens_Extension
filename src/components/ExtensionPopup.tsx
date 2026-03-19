import { useState, useEffect, useRef } from "react";
import { Lock, Shield, ChevronDown } from "lucide-react";
import { RiskBadge, RiskDot } from "./RiskUI";
import type { Risk } from "./RiskUI";

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

  /*
   * TRANSPARENT - do not add background, flex, or height here.
   * The iframe + floating-popup.html are the outer shell.
   * This component is the only thing that should be visible.
   */
  html, body {
    width: 340px;
    background: transparent;
    overflow: visible;
  }

  #root {
    width: 340px;
    background: transparent;
  }

  /* ── POPUP SHELL ──────────────────────────────────────────────────────────────
   * This is the ONLY visual layer. Everything - background, border,
   * border-radius, shadow - lives here. The iframe is a transparent window
   * that shows exactly this div and nothing else.
   * ─────────────────────────────────────────────────────────────────────────── */
  .popup {
    width: 340px;
    height: auto;
    border-radius: 20px;
    display: flex;
    flex-direction: column;

    background: rgba(255,255,255,.62);
    backdrop-filter: blur(28px) saturate(170%);
    -webkit-backdrop-filter: blur(28px) saturate(170%);
    /*
     * IMPORTANT: border is expressed as an inset box-shadow, NOT as
     * border: 2px. A real border adds to the element's rendered width,
     * making the popup 344px inside a 340px iframe -> horizontal scrollbar.
     * An inset box-shadow draws inside the existing width - zero overflow.
     */
    box-shadow:
      inset 0 0 0 2px rgba(255,255,255,.92),
      0 2px 0 rgba(255,255,255,.9) inset,
      0 24px 56px rgba(92,61,46,.18),
      0 6px 18px rgba(92,61,46,.12);
  }

  /* ── HEADER ── */
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
    width: 24px; height: 24px; border-radius: 7px;
    background: var(--brown);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 8px rgba(92,61,46,.30);
    flex-shrink: 0;
  }
  .popup-logo-name {
    font-family: 'Playfair Display', serif;
    font-size: 13.5px; font-weight: 700;
    color: var(--brown); letter-spacing: -.01em;
  }

  /* ── URL BAR ── */
  .popup-url {
    padding: 7px 16px;
    border-bottom: 1px solid rgba(92,61,46,.07);
    display: flex; align-items: center; gap: 6px;
    background: rgba(255,255,255,.45);
    flex-shrink: 0;
  }
  .popup-url-lock { color: var(--green); flex-shrink: 0; }
  .popup-url-text {
    font-family: 'DM Mono', monospace;
    font-size: 10.5px; color: var(--light);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  /* ── SECTION TITLE ── */
  .popup-section-title {
    padding: 11px 16px 5px;
    font-size: 9.5px; font-weight: 800;
    color: var(--light);
    letter-spacing: .09em; text-transform: uppercase;
    flex-shrink: 0;
  }

  /* ── ITEMS — no scroll, no fixed height ── */
  .popup-items { flex-shrink: 0; }

  .popup-item { border-bottom: 1px solid rgba(92,61,46,.07); }
  .popup-item:last-of-type { border-bottom: none; }

  .popup-item-header {
    padding: 10px 16px;
    display: flex; align-items: flex-start; gap: 9px;
    cursor: pointer; transition: background .15s;
  }
  .popup-item-header:hover { background: rgba(250,246,241,.7); }

  .popup-item-text {
    flex: 1; font-size: 12px; font-weight: 500;
    color: var(--text); line-height: 1.45;
  }

  .popup-arrow {
    color: var(--light); flex-shrink: 0; margin-top: 1px;
    transition: transform .22s ease, color .15s;
    display: flex; align-items: center;
  }
  .popup-arrow.open { transform: rotate(180deg); color: var(--brown); }

  /* ── EXPANDABLE DRAWER ── */
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
    font-size: 9px; font-weight: 800;
    letter-spacing: .08em; text-transform: uppercase;
    color: var(--green); margin-bottom: 4px;
  }
  .popup-expand-body {
    font-size: 11px; color: var(--muted); line-height: 1.55;
    border-left: 2px solid var(--green-muted);
    padding: 5px 9px;
    border-radius: 0 6px 6px 0;
    background: rgba(61,107,79,.05);
  }

  /* ── FOOTER ── */
  .popup-footer {
    border-top: 1px solid rgba(92,61,46,.09);
    padding: 11px 14px;
    display: flex; gap: 8px;
    flex-shrink: 0;
    background: rgba(250,246,241,.60);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border-radius: 0 0 18px 18px;
  }

  .popup-btn {
    flex: 1; padding: 8px; border-radius: 9px; border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 700;
    cursor: pointer; transition: all .15s; letter-spacing: .01em;
  }
  .popup-btn-primary {
    background: var(--brown); color: white;
    box-shadow: 0 2px 10px rgba(92,61,46,.28), 0 1px 0 rgba(255,255,255,.12) inset;
  }
  .popup-btn-primary:hover {
    background: var(--brown-lt); transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(92,61,46,.32);
  }
  .popup-btn-secondary {
    background: rgba(92,61,46,.08); color: var(--muted);
    border: 1.5px solid var(--border); backdrop-filter: blur(6px);
  }
  .popup-btn-secondary:hover { background: rgba(92,61,46,.14); color: var(--text); }
`;

interface PopupItem {
  dot: Risk;
  text: string;
  why: string;
}

const ITEMS: PopupItem[] = [
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
    why: "A positive clause — it gives you GDPR-style control over your data and the right to be forgotten.",
  },
];

export default function PolicyLensPopup() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = popupRef.current;
    if (!el) return;

    const report = () => {
      /*
       * USE scrollHeight, NOT getBoundingClientRect().height
       *
       * getBoundingClientRect reads the element's height as the browser
       * currently *renders* it - which is constrained by the iframe's own
       * height. On first paint the iframe is 0px tall, so
       * getBoundingClientRect returns 0 and the popup never opens.
       *
       * scrollHeight always returns the full content height regardless of
       * the iframe's current size. This is the value we need to tell
       * content.js how tall to make the iframe.
       */
      const height = el.scrollHeight;
      window.parent.postMessage({ type: "PL_RESIZE", height }, "*");
    };

    const ro = new ResizeObserver(report);
    ro.observe(el);
    // Fire immediately on mount so content.js gets the height as fast as
    // possible - before the ResizeObserver has time to fire on its own.
    report();

    return () => ro.disconnect();
  }, []);

  // Re-report height whenever an item is toggled open/closed,
  // because the drawer changes the popup's total height.
  useEffect(() => {
    const el = popupRef.current;
    if (!el) return;
    window.parent.postMessage({ type: "PL_RESIZE", height: el.scrollHeight }, "*");
  }, [openIndex]);

  const toggle = (i: number) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <>
      <style>{style}</style>
      <div className="popup" ref={popupRef}>

        <div className="popup-header">
          <div className="popup-logo">
            <div className="popup-logo-icon">
              <Shield size={13} color="white" strokeWidth={2.5} />
            </div>
            <span className="popup-logo-name">PolicyLens</span>
          </div>
          <RiskBadge risk="high" />
        </div>

        <div className="popup-url">
          <span className="popup-url-lock"><Lock size={10} strokeWidth={2.5} /></span>
          <span className="popup-url-text">acmecorp.com/privacy-policy</span>
        </div>

        <div className="popup-section-title">Key clauses found (12)</div>

        <div className="popup-items">
          {ITEMS.map((item, i) => (
            <div key={i} className="popup-item">
              <div className="popup-item-header" onClick={() => toggle(i)}>
                <RiskDot level={item.dot} size={7} marginTop={4} />
                <span className="popup-item-text">{item.text}</span>
                <span className={`popup-arrow ${openIndex === i ? "open" : ""}`}>
                  <ChevronDown size={13} strokeWidth={2.5} />
                </span>
              </div>
              {openIndex === i && (
                <div className="popup-expand">
                  <div className="popup-expand-label">Why it matters</div>
                  <div className="popup-expand-body">{item.why}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="popup-footer">
          <button className="popup-btn popup-btn-primary">Full Report</button>
          <button className="popup-btn popup-btn-secondary">Save to Dashboard</button>
        </div>

      </div>
    </>
  );
}