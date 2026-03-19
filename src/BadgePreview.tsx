import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InjectionBadge from "./components/InjectionBadge";
import type { Risk } from "./components/InjectionBadge";

const STATES: { risk: Risk; label: string; desc: string }[] = [
  {
    risk: "scanning",
    label: "Scanning",
    desc: "Badge appears as soon as the page loads. Pulsing grey dot signals analysis in progress.",
  },
  {
    risk: "high",
    label: "High Risk",
    desc: "Red dot with glowing pulse — policy contains serious data-sharing or consent issues.",
  },
  {
    risk: "med",
    label: "Medium Risk",
    desc: "Amber dot — notable clauses worth reviewing but no critical violations found.",
  },
  {
    risk: "low",
    label: "Low Risk",
    desc: "Green dot with soft pulse — policy is largely user-friendly, low concern.",
  },
];

const css = `
  .bp-root {
    min-height: 100vh;
    background: #FAF6F1;
    font-family: 'DM Sans', sans-serif;
    color: #2C1810;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 48px 24px 80px;
  }
  .bp-back {
    align-self: flex-start;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(92,61,46,0.65);
    background: none;
    border: none;
    cursor: pointer;
    padding: 6px 0;
    margin-bottom: 32px;
    transition: color 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .bp-back:hover { color: #5C3D2E; }

  .bp-title {
    font-family: 'Playfair Display', serif;
    font-size: 32px;
    font-weight: 700;
    text-align: center;
    letter-spacing: -0.02em;
    color: #2C1810;
    margin-bottom: 10px;
  }
  .bp-subtitle {
    font-size: 15px;
    color: rgba(44,24,16,0.55);
    text-align: center;
    max-width: 480px;
    line-height: 1.6;
    margin-bottom: 56px;
  }

  .bp-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
    width: 100%;
    max-width: 840px;
    margin-bottom: 72px;
  }
  @media (max-width: 680px) {
    .bp-grid { grid-template-columns: 1fr 1fr; }
  }

  .bp-card {
    background: #F0E9DF;
    border: 1px solid rgba(92,61,46,0.14);
    border-radius: 20px;
    padding: 28px 20px 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    cursor: pointer;
    transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
  }
  .bp-card:hover {
    border-color: rgba(92,61,46,0.28);
    box-shadow: 0 8px 28px rgba(92,61,46,0.10);
    transform: translateY(-2px);
  }
  .bp-card.selected {
    background: #FAF6F1;
    border-color: rgba(92,61,46,0.38);
    box-shadow: 0 8px 28px rgba(92,61,46,0.12);
  }

  .bp-card-label {
    font-size: 13px;
    font-weight: 700;
    color: #2C1810;
    letter-spacing: 0.01em;
  }
  .bp-card-desc {
    font-size: 11px;
    text-align: center;
    line-height: 1.55;
    color: rgba(44,24,16,0.55);
  }

  .bp-live-area {
    width: 100%;
    max-width: 840px;
    background: #E4D9CC;
    border-radius: 24px;
    border: 1px solid rgba(92,61,46,0.16);
    padding: 40px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    position: relative;
  }
  .bp-live-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    color: rgba(44,24,16,0.42);
  }
  .bp-live-browser {
    width: 100%;
    max-width: 560px;
    background: white;
    border-radius: 14px;
    border: 1px solid rgba(92,61,46,0.12);
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(92,61,46,0.10);
  }
  .bp-browser-bar {
    background: #F5F0EB;
    border-bottom: 1px solid rgba(92,61,46,0.10);
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .bp-browser-dot {
    width: 9px; height: 9px;
    border-radius: 50%;
  }
  .bp-browser-url {
    flex: 1;
    background: white;
    border: 1px solid rgba(92,61,46,0.14);
    border-radius: 5px;
    padding: 4px 10px;
    font-size: 11px;
    font-family: 'DM Mono', monospace;
    color: rgba(44,24,16,0.55);
    margin-left: 6px;
  }
  .bp-browser-body {
    padding: 28px 24px;
    min-height: 140px;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .bp-fake-line {
    height: 10px;
    border-radius: 4px;
    background: #F0EBE5;
  }
  .bp-badge-corner {
    position: absolute;
    bottom: 14px;
    right: 14px;
  }
  .bp-size-row {
    display: flex;
    align-items: flex-end;
    gap: 20px;
    margin-top: 8px;
  }
  .bp-size-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .bp-size-caption {
    font-size: 10px;
    color: rgba(44,24,16,0.42);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
`;

export default function BadgePreview() {
  const navigate = useNavigate();
  const [selected,   setSelected]   = useState<Risk>("high");
  const entry = STATES.find(s => s.risk === selected)!;

  return (
    <>
      <style>{css}</style>
      <div className="bp-root">
        <button className="bp-back" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h1 className="bp-title">Injection Badge Preview</h1>
        <p className="bp-subtitle">
          The PolicyLens badge floats on every page you visit — just like Grammarly.
          The glowing dot updates automatically with the risk level of the current site's privacy policy.
        </p>

        {/* ── state cards ── */}
        <div className="bp-grid">
          {STATES.map(s => (
            <div
              key={s.risk}
              className={`bp-card ${selected === s.risk ? "selected" : ""}`}
              onClick={() => setSelected(s.risk)}
            >
              <InjectionBadge risk={s.risk} size={56} />
              <div className="bp-card-label">{s.label}</div>
              <div className="bp-card-desc">{s.desc}</div>
            </div>
          ))}
        </div>

        {/* ── live browser mockup ── */}
        <div className="bp-live-area">
          <div className="bp-live-label">Live preview — {entry.label}</div>

          <div className="bp-live-browser">
            <div className="bp-browser-bar">
              <div className="bp-browser-dot" style={{ background: "#EF4444" }} />
              <div className="bp-browser-dot" style={{ background: "#F59E0B" }} />
              <div className="bp-browser-dot" style={{ background: "#22C55E" }} />
              <div className="bp-browser-url">acmecorp.com/privacy-policy</div>
            </div>
            <div className="bp-browser-body">
              {[90, 70, 85, 55, 78, 40].map((w, i) => (
                <div key={i} className="bp-fake-line" style={{ width: `${w}%` }} />
              ))}
              <div className="bp-badge-corner">
                <InjectionBadge risk={selected} size={52} />
              </div>
            </div>
          </div>

          {/* ── size scale ── */}
          <div className="bp-size-row">
            {[36, 44, 52, 64].map(sz => (
              <div key={sz} className="bp-size-item">
                <InjectionBadge risk={selected} size={sz} />
                <div className="bp-size-caption">{sz}px</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
