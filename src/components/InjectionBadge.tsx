// InjectionBadge — React preview of the floating content-script badge

// ─── types ────────────────────────────────────────────────────────────────────
export type Risk = "high" | "med" | "low" | "scanning" | "idle";

interface Props {
  risk: Risk;
  size?: number; // badge diameter px, default 52
  onClick?: () => void;
}

// ─── risk config ──────────────────────────────────────────────────────────────
const RISK_MAP: Record<Risk, { color: string; glow: string; label: string }> = {
  high:     { color: "#EF4444", glow: "rgba(239,68,68,0.55)",   label: "High Risk"   },
  med:      { color: "#F59E0B", glow: "rgba(245,158,11,0.55)",  label: "Medium Risk" },
  low:      { color: "#22C55E", glow: "rgba(34,197,94,0.50)",   label: "Low Risk"    },
  scanning: { color: "#94A3B8", glow: "rgba(148,163,184,0.40)", label: "Analyzing…"  },
  idle:     { color: "#94A3B8", glow: "rgba(148,163,184,0.25)", label: "PolicyLens"  },
};

// ─── CSS (injected once) ──────────────────────────────────────────────────────
const css = `
  @keyframes plPulseRed {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.58); }
    50%       { box-shadow: 0 0 0 7px rgba(239,68,68,0); }
  }
  @keyframes plPulseAmber {
    0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.58); }
    50%       { box-shadow: 0 0 0 7px rgba(245,158,11,0); }
  }
  @keyframes plPulseGreen {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.48); }
    50%       { box-shadow: 0 0 0 6px rgba(34,197,94,0); }
  }
  @keyframes plPulseScan {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.40; }
  }

  .ib-wrap {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background: rgba(250,246,241,0.96);
    backdrop-filter: blur(14px) saturate(160%);
    border: 2px solid rgba(92,61,46,0.22);
    box-shadow:
      0 4px 20px rgba(92,61,46,0.18),
      0 1px 4px rgba(92,61,46,0.10);
    cursor: pointer;
    transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease;
    user-select: none;
  }
  .ib-wrap:hover {
    transform: scale(1.10);
    box-shadow:
      0 8px 28px rgba(92,61,46,0.22),
      0 2px 8px rgba(92,61,46,0.14);
  }
  .ib-wrap:active { transform: scale(0.95); }

  .ib-logo {
    border-radius: 6px;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .ib-dot {
    position: absolute;
    top: 1px;
    right: 1px;
    border-radius: 50%;
    border: 2.5px solid rgba(250,246,241,0.95);
    transition: background 0.3s ease;
  }

  .ib-dot-high    { animation: plPulseRed   2s ease-in-out infinite; }
  .ib-dot-med     { animation: plPulseAmber 2s ease-in-out infinite; }
  .ib-dot-low     { animation: plPulseGreen 2.5s ease-in-out infinite; }
  .ib-dot-scanning{ animation: plPulseScan  1.2s ease-in-out infinite; }

  .ib-tooltip {
    position: absolute;
    right: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(30,15,10,0.88);
    backdrop-filter: blur(8px);
    color: #FAF6F1;
    font-size: 11px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, 'DM Sans', sans-serif;
    letter-spacing: 0.02em;
    padding: 5px 10px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    box-shadow: 0 2px 10px rgba(0,0,0,0.20);
  }
  .ib-tooltip::after {
    content: '';
    position: absolute;
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-left-color: rgba(30,15,10,0.88);
  }
  .ib-wrap:hover .ib-tooltip { opacity: 1; }
`;

let cssInjected = false;
function injectCss() {
  if (cssInjected) return;
  const el = document.createElement("style");
  el.textContent = css;
  document.head.appendChild(el);
  cssInjected = true;
}

// ─── component ────────────────────────────────────────────────────────────────
export default function InjectionBadge({ risk, size = 52, onClick }: Props) {
  injectCss();

  const entry = RISK_MAP[risk];
  const dotSize = Math.round(size * 0.27); // ~14px at default 52px
  const logoSize = Math.round(size * 0.54); // ~28px at default 52px

  const borderColor =
    risk === "high" ? "rgba(239,68,68,0.36)" :
    risk === "med"  ? "rgba(245,158,11,0.36)" :
    undefined;

  return (
    <div
      className="ib-wrap"
      style={{ width: size, height: size, borderColor }}
      onClick={onClick}
    >
      <img
        className="ib-logo"
        src="/favicon_io/favicon-32x32.png"
        alt="PolicyLens"
        width={logoSize}
        height={logoSize}
        draggable={false}
      />

      <div
        className={`ib-dot ib-dot-${risk}`}
        style={{
          width:      dotSize,
          height:     dotSize,
          background: entry.color,
        }}
      />

      <div className="ib-tooltip">{entry.label}</div>
    </div>
  );
}
