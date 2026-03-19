import { useState, useEffect, useRef } from "react";
import {
  Search, Brain, BarChart3, ShieldAlert, FileText, TrendingUp,
  Cookie, ShieldCheck, Lock, AlertTriangle,
} from "lucide-react";

const style = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --brown: #5C3D2E;
    --brown-light: #7A5244;
    --brown-pale: #C4A882;
    --cream: #FAF6F1;
    --cream-dark: #F0E9DF;
    --cream-deeper: #E4D9CC;
    --green: #3D6B4F;
    --green-light: #4E8864;
    --green-pale: #D4E8DC;
    --green-muted: #A8C8B5;
    --espresso: #1E0F0A;
    --text-main: #2C1810;
    --text-muted: #7A6258;
    --text-light: #A8978F;
    --white: #FFFFFF;
    --shadow-sm: 0 1px 3px rgba(92,61,46,0.08), 0 1px 2px rgba(92,61,46,0.06);
    --shadow-md: 0 4px 16px rgba(92,61,46,0.12), 0 2px 6px rgba(92,61,46,0.08);
    --shadow-lg: 0 16px 48px rgba(92,61,46,0.14), 0 4px 16px rgba(92,61,46,0.08);
    --shadow-xl: 0 32px 80px rgba(92,61,46,0.16), 0 8px 24px rgba(92,61,46,0.10);
    --radius-sm: 8px;
    --radius-md: 14px;
    --radius-lg: 20px;
    --radius-xl: 28px;
  }

  html { scroll-behavior: smooth; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--text-main);
    line-height: 1.6;
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 48px;
    background: rgba(250,246,241,0.72);
    backdrop-filter: blur(28px) saturate(160%);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    border: 1px solid rgba(50,35,20,0.22);
    border-top: none;
    border-radius: 0 0 20px 20px;
    box-shadow: 0 4px 24px rgba(92,61,46,0.10), 0 1px 0 rgba(255,255,255,0.6) inset;
    animation: navSlide 0.6s ease forwards;
  }
  @keyframes navSlide { from { opacity:0; transform:translateY(-8px) } to { opacity:1; transform:translateY(0) } }

  .nav-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Playfair Display', serif;
    font-size: 20px; font-weight: 700;
    color: var(--brown);
    text-decoration: none;
  }
  .nav-logo-icon {
    width: 32px; height: 32px; border-radius: 8px;
    overflow: hidden; position: relative; flex-shrink: 0;
  }
  .nav-logo-icon img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .nav-logo-icon::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(110,90,70,0.15);
    border-radius: 8px; pointer-events: none;
  }

  .nav-links { display: flex; gap: 32px; align-items: center; }
  .nav-links a {
    font-size: 14px; font-weight: 500; color: var(--text-muted);
    text-decoration: none; transition: color 0.2s;
    letter-spacing: 0.01em; position: relative; padding-bottom: 2px;
  }
  .nav-links a::after {
    content: ''; position: absolute; bottom: -1px; left: 0;
    width: 0; height: 1.5px;
    background: var(--brown);
    transition: width 0.25s ease;
  }
  .nav-links a:hover { color: var(--brown); }
  .nav-links a:hover::after { width: 100%; }

  .nav-cta {
    display: flex; align-items: center; gap: 12px;
  }
  .btn-ghost {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 500;
    color: var(--brown); background: none; border: none;
    cursor: pointer; padding: 8px 16px; border-radius: 8px;
    transition: background 0.2s;
  }
  .btn-ghost:hover { background: var(--cream-dark); }

  .btn-primary {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 600;
    color: white; background: var(--brown);
    border: none; cursor: pointer;
    padding: 9px 20px; border-radius: 9px;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    box-shadow: 0 2px 8px rgba(92,61,46,0.25);
  }
  .btn-primary:hover { background: var(--brown-light); transform: translateY(-1px); box-shadow: 0 4px 14px rgba(92,61,46,0.3); }

  /* ── HERO ── */
  .hero {
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 24px 80px;
    position: relative; overflow: hidden;
    text-align: center;
  }

  .hero-bg {
    position: absolute; inset: 0; z-index: 0;
    background: 
      radial-gradient(ellipse 70% 50% at 20% 30%, rgba(196,168,130,0.18) 0%, transparent 60%),
      radial-gradient(ellipse 60% 45% at 80% 70%, rgba(77,136,100,0.10) 0%, transparent 60%),
      radial-gradient(ellipse 50% 40% at 50% 100%, rgba(92,61,46,0.06) 0%, transparent 60%),
      var(--cream);
  }
  .hero-grain {
    position: absolute; inset: 0; z-index: 1; opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px 200px;
  }

  .hero-eyebrow {
    position: relative; z-index: 2;
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--green-pale); border: 1px solid var(--green-muted);
    padding: 6px 14px; border-radius: 100px;
    font-size: 12px; font-weight: 600; color: var(--green);
    letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 28px;
    animation: fadeUp 0.7s 0.2s ease both;
  }
  .eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--green); animation: pulse 2s ease infinite;
  }
  @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.3)} }

  .hero-headline {
    position: relative; z-index: 2;
    font-family: 'Playfair Display', serif;
    font-size: clamp(44px, 6vw, 80px);
    font-weight: 700; line-height: 1.08;
    color: var(--text-main); letter-spacing: -0.02em;
    max-width: 820px; margin-bottom: 10px;
    animation: fadeUp 0.7s 0.35s ease both;
  }
  .hero-headline em {
    font-style: italic; color: var(--brown);
  }

  .hero-sub {
    position: relative; z-index: 2;
    font-size: 18px; font-weight: 300; color: var(--text-muted);
    max-width: 520px; line-height: 1.65;
    margin-bottom: 40px;
    animation: fadeUp 0.7s 0.5s ease both;
  }

  .hero-actions {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 14px; margin-bottom: 72px;
    animation: fadeUp 0.7s 0.65s ease both;
  }
  .btn-hero {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 600; color: white;
    background: var(--brown);
    border: none; cursor: pointer;
    padding: 14px 28px; border-radius: 12px;
    transition: all 0.2s;
    box-shadow: 0 4px 16px rgba(92,61,46,0.3);
    display: flex; align-items: center; gap: 8px;
  }
  .btn-hero:hover { background: var(--brown-light); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(92,61,46,0.35); }
  .btn-hero-outline {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 500; color: var(--brown);
    background: white; border: 1.5px solid rgba(92,61,46,0.2);
    cursor: pointer; padding: 14px 28px; border-radius: 12px;
    transition: all 0.2s; box-shadow: var(--shadow-sm);
  }
  .btn-hero-outline:hover { border-color: var(--brown); background: var(--cream-dark); }

  .hero-trust {
    position: relative; z-index: 2;
    display: flex; align-items: center; gap: 24px; flex-wrap: wrap; justify-content: center;
    animation: fadeUp 0.7s 0.8s ease both;
  }
  .trust-item {
    display: flex; align-items: center; gap: 6px;
    font-size: 13px; color: var(--text-light); font-weight: 500;
  }
  .trust-item svg { color: var(--green); }
  .trust-divider { width: 1px; height: 14px; background: var(--cream-deeper); }

  /* ── POPUP MOCKUP ── */
  .hero-visual {
    position: relative; z-index: 2;
    width: 100%; max-width: 860px; margin: 0 auto 40px;
    animation: fadeUp 0.8s 0.75s ease both;
  }

  .browser-chrome {
    background: #F5F0EB;
    border: 1px solid rgba(92,61,46,0.12);
    border-radius: 16px;
    box-shadow: var(--shadow-xl);
    overflow: hidden;
  }
  .browser-bar {
    background: #EDE6DC;
    padding: 12px 16px;
    display: flex; align-items: center; gap: 12px;
    border-bottom: 1px solid rgba(92,61,46,0.1);
  }
  .browser-dots { display: flex; gap: 6px; }
  .browser-dot { width: 11px; height: 11px; border-radius: 50%; }
  .dot-red { background: #FF5F57; }
  .dot-yellow { background: #FFBD2E; }
  .dot-green { background: #28C840; }
  .browser-url {
    flex: 1; background: white; border-radius: 6px;
    padding: 5px 12px; font-size: 12px; color: var(--text-muted);
    font-family: 'DM Mono', monospace; border: 1px solid rgba(92,61,46,0.1);
    display: flex; align-items: center; gap: 6px;
  }
  .browser-url-lock { color: var(--green); font-size: 11px; }

  .browser-content {
    padding: 0; background: #F8F4EF;
    min-height: 420px; position: relative;
    display: flex; overflow: hidden;
  }

  .site-bg {
    flex: 1; padding: 28px;
    background: linear-gradient(135deg, #F9F5F0 0%, #EDE4D8 100%);
    position: relative;
  }
  .site-mock-header {
    display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
  }
  .site-mock-logo { width: 80px; height: 12px; background: var(--brown-pale); border-radius: 3px; opacity: 0.5; }
  .site-mock-nav { display: flex; gap: 10px; margin-left: auto; }
  .site-mock-nav span { width: 40px; height: 8px; background: var(--brown-pale); border-radius: 3px; opacity: 0.35; }
  .site-mock-hero { margin-bottom: 20px; }
  .site-mock-h1 { width: 70%; height: 20px; background: var(--brown-pale); border-radius: 4px; opacity: 0.4; margin-bottom: 10px; }
  .site-mock-h2 { width: 50%; height: 12px; background: var(--brown-pale); border-radius: 4px; opacity: 0.25; margin-bottom: 8px; }
  .site-mock-p { width: 85%; height: 8px; background: var(--brown-pale); border-radius: 3px; opacity: 0.2; margin-bottom: 6px; }
  .site-mock-btn { width: 100px; height: 28px; background: var(--brown); border-radius: 6px; opacity: 0.3; margin-top: 12px; }
  .consent-banner {
    position: absolute; bottom: 0; left: 0; right: 0;
    background: rgba(30,15,10,0.92); backdrop-filter: blur(8px);
    padding: 14px 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .consent-text { font-size: 11px; color: rgba(255,255,255,0.7); max-width: 55%; line-height: 1.4; }
  .consent-text strong { color: white; }
  .consent-btns { display: flex; gap: 8px; }
  .consent-btn {
    font-size: 10px; font-weight: 600; padding: 5px 10px; border-radius: 5px;
    border: none; cursor: pointer;
  }
  .consent-accept { background: var(--green); color: white; }
  .consent-deny { background: rgba(255,255,255,0.15); color: white; }

  /* ── EXTENSION POPUP ── */
  .ext-popup {
    width: 320px; min-width: 320px;
    background: white; border-left: 1px solid rgba(92,61,46,0.1);
    display: flex; flex-direction: column;
    box-shadow: -8px 0 24px rgba(92,61,46,0.08);
    font-size: 13px;
    border-radius: 12px;
    overflow: hidden;
    border-radius: 12px;
    overflow: hidden;
  }
  .ext-header {
    background: var(--cream); border-bottom: 1px solid rgba(92,61,46,0.1);
    padding: 14px 16px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .ext-logo { display: flex; align-items: center; gap: 7px; }
  .ext-logo-icon {
    width: 22px; height: 22px; border-radius: 6px;
    overflow: hidden; position: relative; flex-shrink: 0;
  }
  .ext-logo-icon img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .ext-logo-icon::after {
    content: ''; position: absolute; inset: 0;
    background: rgba(110,90,70,0.15); border-radius: 6px; pointer-events: none;
  }
  .ext-logo-name { font-weight: 700; font-size: 13px; color: var(--brown); font-family: 'Playfair Display', serif; }
  .ext-badge-risk {
    background: #FEF2F2; border: 1px solid #FECACA;
    color: #DC2626; font-size: 10px; font-weight: 700;
    padding: 3px 8px; border-radius: 100px; letter-spacing: 0.04em;
    display: flex; align-items: center; gap: 4px;
  }
  .ext-section-title {
    font-size: 10px; font-weight: 700; color: var(--text-light);
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 12px 16px 6px;
  }
  .ext-items { overflow-y: auto; flex: 1; }
  .ext-item { border-bottom: 1px solid rgba(92,61,46,0.06); }
  .ext-item-header {
    padding: 10px 16px; display: flex; align-items: flex-start;
    justify-content: space-between; gap: 8px; cursor: pointer;
    transition: background 0.15s;
  }
  .ext-item-header:hover { background: var(--cream); }
  .ext-item-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
  }
  .dot-red-sm { background: #EF4444; }
  .dot-amber-sm { background: #F59E0B; }
  .dot-green-sm { background: var(--green); }
  .ext-item-text { flex: 1; font-size: 12px; color: var(--text-main); line-height: 1.4; font-weight: 500; }
  .ext-item-arrow { color: var(--text-light); font-size: 10px; flex-shrink: 0; margin-top: 2px; transition: transform 0.2s; }
  .ext-item-arrow.open { transform: rotate(180deg); }
  .ext-item-expand {
    background: #FAFAF8; border-top: 1px solid rgba(92,61,46,0.06);
    padding: 10px 16px; font-size: 11px; color: var(--text-muted); line-height: 1.5;
  }
  .ext-item-expand-label {
    font-size: 10px; font-weight: 700; color: var(--green); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px;
  }
  .ext-footer {
    border-top: 1px solid rgba(92,61,46,0.1); padding: 12px 16px;
    display: flex; gap: 8px;
  }
  .ext-btn-sm {
    flex: 1; font-size: 11px; font-weight: 600; padding: 7px;
    border-radius: 7px; border: none; cursor: pointer; transition: all 0.15s;
  }
  .ext-btn-primary { background: var(--brown); color: white; }
  .ext-btn-primary:hover { background: var(--brown-light); }
  .ext-btn-secondary { background: var(--cream-dark); color: var(--text-muted); }
  .ext-btn-secondary:hover { background: var(--cream-deeper); }

  @keyframes fadeUp { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:translateY(0) } }

  /* ── SECTION COMMON ── */
  .section { padding: 100px 24px; }
  .section-inner { max-width: 1120px; margin: 0 auto; }

  .section-label {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--green); margin-bottom: 16px;
  }
  .section-label::before { content:''; width:20px; height:1.5px; background:var(--green); }

  .section-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(32px, 4vw, 52px); font-weight: 700;
    line-height: 1.1; letter-spacing: -0.02em; color: var(--text-main);
    margin-bottom: 16px;
  }
  .section-title em { font-style: italic; color: var(--brown); }
  .section-desc { font-size: 17px; color: var(--text-muted); max-width: 500px; line-height: 1.65; font-weight: 300; }

  /* ── HOW IT WORKS ── */
  .how-wrap { background: var(--cream-dark); }

  .steps-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 2px; margin-top: 56px; border-radius: var(--radius-xl);
    overflow: hidden; box-shadow: var(--shadow-lg);
  }
  .step-card {
    background: white; padding: 36px 32px;
    position: relative;
  }
  .step-number {
    font-family: 'Playfair Display', serif;
    font-size: 64px; font-weight: 700;
    color: var(--cream-deeper); line-height: 1;
    margin-bottom: 20px; letter-spacing: -0.03em;
  }
  .step-icon {
    width: 44px; height: 44px; border-radius: 12px;
    background: var(--cream); display: flex; align-items: center;
    justify-content: center; font-size: 20px; margin-bottom: 16px;
    border: 1px solid var(--cream-deeper);
  }
  .step-title { font-size: 17px; font-weight: 700; color: var(--text-main); margin-bottom: 8px; }
  .step-desc { font-size: 14px; color: var(--text-muted); line-height: 1.6; }
  .step-accent { width: 40px; height: 3px; background: var(--brown); border-radius: 2px; margin-bottom: 20px; }

  /* ── FEATURES ── */
  .features-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 24px; margin-top: 56px;
  }
  .feat-card {
    background: white; border: 1px solid rgba(92,61,46,0.08);
    border-radius: var(--radius-xl); padding: 36px;
    transition: box-shadow 0.25s, transform 0.25s;
    position: relative; overflow: hidden;
  }
  .feat-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-3px); }
  .feat-card.wide { grid-column: span 2; display: flex; gap: 48px; align-items: center; }
  .feat-card-bg {
    position: absolute; top: -40px; right: -40px;
    width: 200px; height: 200px; border-radius: 50%;
    opacity: 0.04;
  }
  .bg-brown { background: var(--brown); }
  .bg-green { background: var(--green); }
  .feat-icon {
    width: 52px; height: 52px; border-radius: 14px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: center; font-size: 22px;
  }
  .feat-icon-brown { background: rgba(92,61,46,0.08); }
  .feat-icon-green { background: rgba(61,107,79,0.1); }
  .feat-title { font-size: 20px; font-weight: 700; color: var(--text-main); margin-bottom: 10px; }
  .feat-desc { font-size: 14px; color: var(--text-muted); line-height: 1.65; }
  .feat-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 18px; }
  .feat-tag {
    background: var(--cream); border: 1px solid var(--cream-deeper);
    font-size: 11px; font-weight: 600; color: var(--text-muted);
    padding: 3px 10px; border-radius: 100px; letter-spacing: 0.03em;
  }

  /* mini badge demo inside feature */
  .badge-demo { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 16px; }
  .badge {
    display: flex; align-items: center; gap: 5px;
    padding: 4px 10px; border-radius: 100px;
    font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
  }
  .badge-high { background: #FEF2F2; color: #DC2626; border: 1px solid #FECACA; }
  .badge-med { background: #FFFBEB; color: #D97706; border: 1px solid #FDE68A; }
  .badge-low { background: var(--green-pale); color: var(--green); border: 1px solid var(--green-muted); }

  /* ── DASHBOARD SECTION ── */
  .dash-wrap { background: #4A2D18; color: white; }

  .dash-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; }
  .dash-header .section-title { color: white; }
  .dash-header .section-label { color: var(--green-muted); }
  .dash-header .section-label::before { background: var(--green-muted); }
  .dash-header .section-desc { color: rgba(255,255,255,0.72); }

  .dash-mockup {
    margin-top: 56px;
    background: #5C3821; border-radius: var(--radius-xl);
    border: 1px solid rgba(255,255,255,0.14);
    overflow: hidden; box-shadow: var(--shadow-xl);
  }
  .dash-top-bar {
    background: #4E2F1A; border-bottom: 1px solid rgba(255,255,255,0.14);
    padding: 14px 20px; display: flex; align-items: center; justify-content: space-between;
  }
  .dash-tabs { display: flex; gap: 4px; }
  .dash-tab {
    font-size: 12px; font-weight: 500; padding: 6px 14px;
    border-radius: 7px; cursor: pointer;
    color: rgba(255,255,255,0.58); border: none; background: none; font-family: 'DM Sans', sans-serif;
  }
  .dash-tab.active { background: rgba(255,255,255,0.14); color: white; }
  .dash-search {
    background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.16);
    border-radius: 8px; padding: 6px 12px;
    font-size: 12px; color: rgba(255,255,255,0.60); display: flex; align-items: center; gap: 6px;
    font-family: 'DM Mono', monospace;
  }
  .dash-body { display: flex; min-height: 380px; }
  .dash-sidebar {
    width: 200px; min-width: 200px; background: #4E2F1A;
    border-right: 1px solid rgba(255,255,255,0.14);
    padding: 16px 12px; display: flex; flex-direction: column; gap: 2px;
  }
  .dash-sidebar-item {
    display: flex; align-items: center; gap: 8px;
    padding: 8px 10px; border-radius: 7px; font-size: 12px;
    color: rgba(255,255,255,0.72); cursor: pointer; transition: all 0.15s;
  }
  .dash-sidebar-item:hover, .dash-sidebar-item.active {
    background: rgba(255,255,255,0.12); color: white;
  }
  .dash-sidebar-item.active .dash-sidebar-dot { background: var(--green); }
  .dash-sidebar-dot { width: 6px; height: 6px; border-radius: 50%; background: rgba(255,255,255,0.2); }
  .dash-main { flex: 1; padding: 20px; overflow: auto; }
  .dash-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 20px; }
  .dash-stat {
    background: rgba(255,255,255,0.11); border: 1px solid rgba(255,255,255,0.18);
    border-radius: 12px; padding: 16px;
  }
  .dash-stat-val { font-size: 24px; font-weight: 700; color: white; font-family: 'Playfair Display', serif; }
  .dash-stat-label { font-size: 10px; color: rgba(255,255,255,0.65); font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; margin-top: 4px; }
  .dash-stat-trend { font-size: 11px; color: var(--green-muted); margin-top: 2px; }

  .dash-table { width: 100%; border-collapse: collapse; }
  .dash-table th {
    font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    color: rgba(255,255,255,0.58); text-align: left; padding: 8px 12px; border-bottom: 1px solid rgba(255,255,255,0.15);
  }
  .dash-table td {
    padding: 11px 12px; font-size: 12px; color: rgba(255,255,255,0.88);
    border-bottom: 1px solid rgba(255,255,255,0.10);
  }
  .dash-table tr:hover td { background: rgba(255,255,255,0.06); }
  .dash-site-name { color: white; font-weight: 600; }
  .dash-risk-high { color: #F87171; }
  .dash-risk-med { color: #FCD34D; }
  .dash-risk-low { color: var(--green-muted); }

  /* ── TESTIMONIALS ── */
  .testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; margin-top: 56px; }
  .testi-card {
    background: white; border: 1px solid rgba(92,61,46,0.08);
    border-radius: var(--radius-lg); padding: 28px;
    transition: box-shadow 0.2s; position: relative;
  }
  .testi-card:hover { box-shadow: var(--shadow-md); }
  .testi-quote { font-size: 40px; color: var(--cream-deeper); font-family: 'Playfair Display', serif; line-height: 1; margin-bottom: 12px; }
  .testi-text { font-size: 14px; color: var(--text-muted); line-height: 1.65; font-style: italic; margin-bottom: 20px; }
  .testi-author { display: flex; align-items: center; gap: 10px; }
  .testi-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    overflow: hidden; flex-shrink: 0;
    border: 2px solid var(--cream-deeper);
    box-shadow: 0 2px 8px rgba(92,61,46,0.15);
  }
  .testi-avatar img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
  .testi-name { font-size: 13px; font-weight: 700; color: var(--text-main); }
  .testi-role { font-size: 11px; color: var(--text-light); }

  /* ── CTA ── */
  .cta-wrap {
    background: var(--brown); padding: 100px 24px;
    text-align: center; position: relative; overflow: hidden;
  }
  .cta-bg {
    position: absolute; inset: 0;
    background: 
      radial-gradient(ellipse 60% 80% at 20% 50%, rgba(255,255,255,0.04) 0%, transparent 60%),
      radial-gradient(ellipse 50% 70% at 80% 50%, rgba(61,107,79,0.15) 0%, transparent 60%);
  }
  .cta-title {
    position: relative; z-index: 1;
    font-family: 'Playfair Display', serif;
    font-size: clamp(36px, 4.5vw, 60px); font-weight: 700;
    color: white; line-height: 1.1; letter-spacing: -0.02em; margin-bottom: 16px;
  }
  .cta-title em { font-style: italic; color: rgba(255,255,255,0.7); }
  .cta-sub {
    position: relative; z-index: 1;
    font-size: 17px; color: rgba(255,255,255,0.65); margin-bottom: 40px; font-weight: 300;
  }
  .cta-actions { position: relative; z-index: 1; display: flex; justify-content: center; gap: 14px; }
  .btn-cta-white {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 700; color: var(--brown);
    background: white; border: none; cursor: pointer;
    padding: 14px 32px; border-radius: 12px;
    transition: all 0.2s; box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }
  .btn-cta-white:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(0,0,0,0.25); }
  .btn-cta-outline {
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 500; color: rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.1); border: 1.5px solid rgba(255,255,255,0.2);
    cursor: pointer; padding: 14px 28px; border-radius: 12px;
    transition: all 0.2s;
  }
  .btn-cta-outline:hover { background: rgba(255,255,255,0.18); }

  /* ── FOOTER ── */
  .footer { background: #3D2415; padding: 56px 24px 36px; color: rgba(255,255,255,0.68); }
  .footer-inner { max-width: 1120px; margin: 0 auto; }
  .footer-top { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 48px; flex-wrap: wrap; }
  .footer-brand { max-width: 260px; }
  .footer-brand-name {
    font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700;
    color: white; margin-bottom: 10px; display: flex; align-items: center; gap: 8px;
  }
  .footer-brand-desc { font-size: 13px; line-height: 1.65; }
  .footer-links h4 { font-size: 12px; font-weight: 700; color: white; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 14px; }
  .footer-links ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
  .footer-links a { font-size: 13px; color: rgba(255,255,255,0.65); text-decoration: none; transition: color 0.15s; }
  .footer-links a:hover { color: rgba(255,255,255,0.95); }
  .footer-bottom {
    border-top: 1px solid rgba(255,255,255,0.15); padding-top: 24px;
    display: flex; justify-content: space-between; align-items: center;
    font-size: 12px; flex-wrap: wrap; gap: 12px;
  }
  .footer-green { color: var(--green-muted); }

  /* ── PRICING ── */
  .pricing-wrap {
    background: var(--cream-dark);
    margin: 40px 20px;
    border-radius: 36px;
    border: 1.5px solid rgba(92,61,46,0.16);
    box-shadow: 0 8px 48px rgba(92,61,46,0.12), 0 2px 8px rgba(92,61,46,0.06);
    overflow: hidden;
  }

  .pricing-toggle {
    display: flex; align-items: center; justify-content: center;
    gap: 12px; margin-top: 40px; margin-bottom: 52px;
  }
  .toggle-label { font-size: 14px; font-weight: 500; color: var(--text-muted); }
  .toggle-label.active { color: var(--text-main); font-weight: 600; }
  .toggle-pill {
    width: 46px; height: 26px; border-radius: 100px;
    background: var(--brown); border: none; cursor: pointer;
    position: relative; transition: background 0.2s;
    flex-shrink: 0;
  }
  .toggle-thumb {
    width: 20px; height: 20px; border-radius: 50%; background: white;
    position: absolute; top: 3px; transition: left 0.2s;
    box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  }
  .toggle-thumb.monthly { left: 3px; }
  .toggle-thumb.annual { left: 23px; }
  .toggle-save {
    background: var(--green-pale); color: var(--green);
    border: 1px solid var(--green-muted);
    font-size: 11px; font-weight: 700; letter-spacing: 0.04em;
    padding: 3px 9px; border-radius: 100px;
  }

  .pricing-grid {
    display: grid; grid-template-columns: 1fr 1fr 1fr;
    gap: 20px; align-items: start;
  }

  .price-card {
    background: rgba(255,255,255,0.88);
    backdrop-filter: blur(14px) saturate(150%);
    -webkit-backdrop-filter: blur(14px) saturate(150%);
    border: 1.5px solid rgba(92,61,46,0.13);
    border-radius: var(--radius-xl); padding: 32px;
    position: relative; transition: box-shadow 0.25s, transform 0.25s;
  }
  .price-card:hover { box-shadow: var(--shadow-lg); transform: translateY(-4px); }
  .price-card.featured {
    background: var(--brown);
    border: 1.5px solid rgba(255,255,255,0.18);
    color: white; transform: translateY(-8px);
    box-shadow: var(--shadow-xl), 0 0 0 1px rgba(92,61,46,0.4);
  }
  .price-card.featured:hover { transform: translateY(-12px); }

  .price-popular {
    position: absolute; top: -13px; left: 50%; transform: translateX(-50%);
    background: var(--green); color: white;
    font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 4px 14px; border-radius: 100px;
    white-space: nowrap;
  }

  .price-plan { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-light); margin-bottom: 8px; }
  .price-card.featured .price-plan { color: rgba(255,255,255,0.55); }

  .price-name { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 700; color: var(--text-main); margin-bottom: 6px; }
  .price-card.featured .price-name { color: white; }

  .price-desc { font-size: 13px; color: var(--text-muted); line-height: 1.5; margin-bottom: 24px; min-height: 40px; }
  .price-card.featured .price-desc { color: rgba(255,255,255,0.6); }

  .price-divider { height: 1px; background: rgba(92,61,46,0.08); margin-bottom: 24px; }
  .price-card.featured .price-divider { background: rgba(255,255,255,0.12); }

  .price-amount { display: flex; align-items: flex-end; gap: 4px; margin-bottom: 4px; }
  .price-currency { font-size: 18px; font-weight: 700; color: var(--text-muted); margin-bottom: 6px; }
  .price-card.featured .price-currency { color: rgba(255,255,255,0.7); }
  .price-number { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 700; line-height: 1; color: var(--text-main); letter-spacing: -0.02em; }
  .price-card.featured .price-number { color: white; }
  .price-period { font-size: 13px; color: var(--text-light); margin-bottom: 6px; font-weight: 500; }
  .price-card.featured .price-period { color: rgba(255,255,255,0.5); }
  .price-annual-note { font-size: 11px; color: var(--green); font-weight: 600; margin-bottom: 24px; min-height: 18px; }
  .price-card.featured .price-annual-note { color: var(--green-muted); }

  .price-btn {
    width: 100%; font-family: 'DM Sans', sans-serif;
    font-size: 14px; font-weight: 700; padding: 13px;
    border-radius: 11px; border: none; cursor: pointer;
    transition: all 0.2s; margin-bottom: 28px;
  }
  .price-btn-default { background: var(--cream-dark); color: var(--text-main); }
  .price-btn-default:hover { background: var(--cream-deeper); }
  .price-btn-featured { background: white; color: var(--brown); }
  .price-btn-featured:hover { background: var(--cream); transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
  .price-btn-outline { background: transparent; color: var(--brown); border: 1.5px solid rgba(92,61,46,0.22); }
  .price-btn-outline:hover { border-color: var(--brown); background: rgba(92,61,46,0.04); }

  .price-features { display: flex; flex-direction: column; gap: 10px; }
  .price-feature {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: var(--text-muted); line-height: 1.4;
  }
  .price-card.featured .price-feature { color: rgba(255,255,255,0.7); }
  .price-feature-check {
    width: 18px; height: 18px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 9px;
  }
  .check-green { background: var(--green-pale); color: var(--green); }
  .check-white { background: rgba(255,255,255,0.18); color: rgba(255,255,255,0.95); border: 1px solid rgba(255,255,255,0.22); }
  .check-muted { background: var(--cream-deeper); color: var(--text-light); }
  .price-feature-x { color: var(--text-light); }
  .price-card.featured .price-feature-x { color: rgba(255,255,255,0.3); }

  .pricing-footnote {
    text-align: center; margin-top: 36px;
    font-size: 13px; color: var(--text-light);
  }
  .pricing-footnote a { color: var(--brown); text-decoration: underline; text-underline-offset: 3px; cursor: pointer; }

  /* ── ANIMATIONS ── */
  .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.65s ease, transform 0.65s ease; }
  .reveal.visible { opacity: 1; transform: translateY(0); }
  .reveal-delay-1 { transition-delay: 0.1s; }
  .reveal-delay-2 { transition-delay: 0.2s; }
  .reveal-delay-3 { transition-delay: 0.3s; }
  .reveal-delay-4 { transition-delay: 0.4s; }

  @media (max-width: 900px) {
    .nav { padding: 16px 20px; }
    .nav-links { display: none; }
    .steps-grid { grid-template-columns: 1fr; }
    .features-grid { grid-template-columns: 1fr; }
    .feat-card.wide { grid-column: span 1; flex-direction: column; }
    .dash-stats { grid-template-columns: 1fr 1fr; }
    .dash-sidebar { display: none; }
    .testimonials-grid { grid-template-columns: 1fr; }
    .pricing-wrap { margin: 20px 8px; border-radius: 24px; }
    .pricing-grid { grid-template-columns: 1fr; }
    .price-card.featured { transform: none; }
    .price-card.featured:hover { transform: translateY(-4px); }
    .hero-visual { display: none; }
  }
`;

const CheckIcon = () => (
  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
    <circle cx="6.5" cy="6.5" r="6.5" fill="currentColor" opacity="0.15"/>
    <path d="M4 6.5L5.8 8.3L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const popupItems = [
  { dot: "red", text: "Your data may be sold to third-party advertisers without explicit consent.", why: "This means your browsing habits, purchase history, and personal details can be monetized without you knowing who receives them.", open: true },
  { dot: "amber", text: "Cookies persist for up to 3 years after your last visit to the site.", why: "Long-lived cookies allow extended tracking of your online behavior, even across other websites you visit.", open: false },
  { dot: "green", text: "You can request deletion of your personal data within 30 days.", why: "This is a positive clause — it gives you GDPR-style control over your data and the right to be forgotten.", open: false },
];

const dashRows = [
  { site: "google.com", type: "Privacy Policy", risk: "high", clauses: 12, date: "Today" },
  { site: "shopify.com", type: "Terms of Service", risk: "med", clauses: 8, date: "Yesterday" },
  { site: "notion.so", type: "Cookie Banner", risk: "low", clauses: 4, date: "Feb 17" },
  { site: "reddit.com", type: "Privacy Policy", risk: "high", clauses: 15, date: "Feb 16" },
  { site: "stripe.com", type: "Data Processing", risk: "low", clauses: 6, date: "Feb 15" },
];

import { useNavigate } from 'react-router-dom';

export default function App() {
  const navigate = useNavigate();
  const [openItems, setOpenItems] = useState<Record<number, boolean>>({ 0: true });
  const [activeTab, setActiveTab] = useState("Recent");
  const [annual, setAnnual] = useState(true);
  const revealRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1 }
    );
    revealRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, []);

  const addReveal = (i: number) => (el: HTMLElement | null) => { revealRefs.current[i] = el; };

  return (
    <>
      <style>{style}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="#" className="nav-logo">
          <div className="nav-logo-icon"><img src="/favicon_io/android-chrome-192x192.png" alt="PolicyLens" /></div>
          PolicyLens
        </a>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#dashboard">Dashboard</a>
          <a href="#how">How it works</a>
          <a href="#pricing">Pricing</a>
          <a href="#trust">Reviews</a>
        </div>
        <div className="nav-cta">
          <button className="btn-ghost" onClick={() => navigate('/login')}>Sign up</button>
          <button className="btn-primary">Add to Chrome — Try Free</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg" />
        <div className="hero-grain" />

        <div className="hero-eyebrow">
          <div className="eyebrow-dot" />
          AI-powered legal clarity
        </div>

        <h1 className="hero-headline">
          Privacy policies,<br />
          <em>finally readable.</em>
        </h1>

        <p className="hero-sub">
          PolicyLens scans legal documents, consent banners, and terms of service — then surfaces what actually matters, in plain English.
        </p>

        <div className="hero-actions">
          <button className="btn-hero">
            <Search size={16} /> Get Started — Plans from $0
          </button>
          <button className="btn-hero-outline">See how it works</button>
        </div>

        <div className="hero-visual">
          <div className="browser-chrome">
            <div className="browser-bar">
              <div className="browser-dots">
                <div className="browser-dot dot-red" />
                <div className="browser-dot dot-yellow" />
                <div className="browser-dot dot-green" />
              </div>
              <div className="browser-url">
                <span className="browser-url-lock"><Lock size={11} /></span>
                <span>acmecorp.com/privacy-policy</span>
              </div>
            </div>
            <div className="browser-content">
              <div className="site-bg">
                <div className="site-mock-header">
                  <div className="site-mock-logo" />
                  <div className="site-mock-nav">
                    <span /><span /><span />
                  </div>
                </div>
                <div className="site-mock-hero">
                  <div className="site-mock-h1" />
                  <div className="site-mock-h2" />
                  <div className="site-mock-p" />
                  <div className="site-mock-p" style={{ width: "60%" }} />
                  <div className="site-mock-btn" />
                </div>
                <div className="consent-banner">
                  <div className="consent-text">
                    <strong>We value your privacy.</strong> We use cookies to personalize content and analyze traffic. By clicking accept you agree to our terms.
                  </div>
                  <div className="consent-btns">
                    <button className="consent-btn consent-deny">Manage</button>
                    <button className="consent-btn consent-accept">Accept All</button>
                  </div>
                </div>
              </div>

              {/* POPUP */}
              <div className="ext-popup">
                <div className="ext-header">
                  <div className="ext-logo">
                    <div className="ext-logo-icon"><img src="/favicon_io/android-chrome-192x192.png" alt="PolicyLens" /></div>
                    <span className="ext-logo-name">PolicyLens</span>
                  </div>
                  <div className="ext-badge-risk"><AlertTriangle size={10} /> HIGH RISK</div>
                </div>

                <div className="ext-section-title">Key clauses found (12)</div>

                <div className="ext-items">
                  {popupItems.map((item, i) => (
                    <div key={i} className="ext-item">
                      <div
                        className="ext-item-header"
                        onClick={() => setOpenItems(p => ({ ...p, [i]: !p[i] }))}
                      >
                        <div className={`ext-item-dot ${item.dot === "red" ? "dot-red-sm" : item.dot === "amber" ? "dot-amber-sm" : "dot-green-sm"}`} />
                        <span className="ext-item-text">{item.text}</span>
                        <span className={`ext-item-arrow ${openItems[i] ? "open" : ""}`}>▾</span>
                      </div>
                      {openItems[i] && (
                        <div className="ext-item-expand">
                          <div className="ext-item-expand-label">Why it matters</div>
                          {item.why}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="ext-footer">
                  <button className="ext-btn-sm ext-btn-primary">Full Report</button>
                  <button className="ext-btn-sm ext-btn-secondary">Save to Dashboard</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-trust">
          <div className="trust-item">
            <CheckIcon />
            Starter plan included
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <CheckIcon />
            No account required
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <CheckIcon />
            Works on any website
          </div>
          <div className="trust-divider" />
          <div className="trust-item">
            <CheckIcon />
            Your data stays private
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how-wrap" id="how">
        <div className="section-inner">
          <div ref={addReveal(0)} className="reveal">
            <div className="section-label">How it works</div>
            <h2 className="section-title">Three steps to <em>full clarity</em></h2>
          </div>

          <div className="steps-grid" ref={addReveal(1)}>
            {[
              { n: "01", icon: <Search size={20} />, title: "Detect & scan", desc: "PolicyLens automatically detects privacy policies, terms of service, and cookie consent banners on every page you visit. One click to trigger analysis." },
              { n: "02", icon: <Brain size={20} />, title: "AI reads the fine print", desc: "Our model parses the legal text, identifies the clauses that actually affect you, and categorizes each one by risk level — high, medium, or low." },
              { n: "03", icon: <BarChart3 size={20} />, title: "Results in plain English", desc: "A clean popup shows each clause as a scannable list item. Expand any item to see why it matters and what action, if any, you should take." },
            ].map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-number">{s.n}</div>
                <div className="step-accent" />
                <div className="step-icon">{s.icon}</div>
                <div className="step-title">{s.title}</div>
                <div className="step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="section-inner">
          <div ref={addReveal(2)} className="reveal">
            <div className="section-label">Features</div>
            <h2 className="section-title">Everything you need to<br /><em>browse with confidence</em></h2>
          </div>

          <div className="features-grid" ref={addReveal(3)}>
            <div className="feat-card">
              <div className="feat-card-bg bg-brown" />
              <div className="feat-icon feat-icon-brown"><ShieldAlert size={22} /></div>
              <div className="feat-title">Risk Badge System</div>
              <div className="feat-desc">Every analysis gets an overall risk score — High, Medium, or Low — based on the clauses found. Know the verdict at a glance, before you click "Accept."</div>
              <div className="badge-demo">
                <span className="badge badge-high"><AlertTriangle size={10} /> High Risk</span>
                <span className="badge badge-med">~ Medium Risk</span>
                <span className="badge badge-low">✓ Low Risk</span>
              </div>
            </div>

            <div className="feat-card">
              <div className="feat-card-bg bg-green" />
              <div className="feat-icon feat-icon-green"><FileText size={22} /></div>
              <div className="feat-title">Clause-by-clause Breakdown</div>
              <div className="feat-desc">Each key clause appears as its own list item. Tap any clause to reveal a "Why it matters" explanation — no legal background required.</div>
              <div className="feat-tags">
                <span className="feat-tag">Data selling</span>
                <span className="feat-tag">Cookie duration</span>
                <span className="feat-tag">Deletion rights</span>
                <span className="feat-tag">Third-party sharing</span>
                <span className="feat-tag">Location tracking</span>
              </div>
            </div>

            <div className="feat-card wide">
              <div>
                <div className="feat-icon feat-icon-brown"><TrendingUp size={22} /></div>
                <div className="feat-title">History Dashboard</div>
                <div className="feat-desc">
                  Every site you've analyzed is saved to your personal dashboard. Track your exposure over time, compare policies across sites, and revisit past analyses whenever you need them. Filter by risk level, sort by date, and export reports.
                </div>
                <div className="feat-tags" style={{ marginTop: 18 }}>
                  <span className="feat-tag">Full history</span>
                  <span className="feat-tag">Risk filtering</span>
                  <span className="feat-tag">Export reports</span>
                  <span className="feat-tag">Site comparison</span>
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ background: "var(--cream-dark)", borderRadius: 14, padding: 20, border: "1px solid var(--cream-deeper)" }}>
                  {dashRows.slice(0, 3).map((r, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < 2 ? "1px solid var(--cream-deeper)" : "none" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-main)" }}>{r.site}</div>
                        <div style={{ fontSize: 11, color: "var(--text-light)" }}>{r.type}</div>
                      </div>
                      <span className={`badge ${r.risk === "high" ? "badge-high" : r.risk === "med" ? "badge-med" : "badge-low"}`}>
                        {r.risk === "high" ? "High" : r.risk === "med" ? "Medium" : "Low"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="feat-card">
              <div className="feat-icon feat-icon-green"><Cookie size={22} /></div>
              <div className="feat-title">Consent Banner Detection</div>
              <div className="feat-desc">PolicyLens catches cookie banners before you accept them — so you know exactly what you're agreeing to, not just "Cookies blah blah, Accept All."</div>
            </div>

            <div className="feat-card">
              <div className="feat-icon feat-icon-brown"><ShieldCheck size={22} /></div>
              <div className="feat-title">Your Privacy, Protected</div>
              <div className="feat-desc">PolicyLens never sends your browsing history to our servers. All analysis happens client-side. The extension protects your privacy while protecting yours.</div>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD */}
      <section className="section dash-wrap" id="dashboard">
        <div className="section-inner">
          <div className="dash-header" ref={addReveal(4)}>
            <div>
              <div className="section-label">Dashboard</div>
              <h2 className="section-title">Your privacy<br /><em>command center</em></h2>
              <p className="section-desc">Track every site you've analyzed. Filter by risk. Export full reports. See your data exposure at a glance.</p>
            </div>
          </div>

          <div className="dash-mockup reveal" ref={addReveal(5)}>
            <div className="dash-top-bar">
              <div className="dash-tabs">
                {["Recent", "High Risk", "Saved", "Reports"].map(t => (
                  <button key={t} className={`dash-tab ${activeTab === t ? "active" : ""}`} onClick={() => setActiveTab(t)}>{t}</button>
                ))}
              </div>
              <div className="dash-search"><Search size={12} /> Search sites...</div>
            </div>
            <div className="dash-body">
              <div className="dash-sidebar">
                {["All Sites", "Today", "This Week", "High Risk", "Favorites"].map((item, i) => (
                  <div key={i} className={`dash-sidebar-item ${i === 0 ? "active" : ""}`}>
                    <div className="dash-sidebar-dot" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="dash-main">
                <div className="dash-stats">
                  {[
                    { val: "47", label: "Sites analyzed", trend: "+6 this week" },
                    { val: "12", label: "High risk sites", trend: "↑ 2 new" },
                    { val: "183", label: "Clauses flagged", trend: "across all sites" },
                    { val: "3.2k", label: "Users protected", trend: "globally today" },
                  ].map((s, i) => (
                    <div key={i} className="dash-stat">
                      <div className="dash-stat-val">{s.val}</div>
                      <div className="dash-stat-label">{s.label}</div>
                      <div className="dash-stat-trend">{s.trend}</div>
                    </div>
                  ))}
                </div>

                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Type</th>
                      <th>Risk</th>
                      <th>Clauses</th>
                      <th>Analyzed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashRows.map((r, i) => (
                      <tr key={i}>
                        <td className="dash-site-name">{r.site}</td>
                        <td>{r.type}</td>
                        <td className={r.risk === "high" ? "dash-risk-high" : r.risk === "med" ? "dash-risk-med" : "dash-risk-low"}>
                          {r.risk === "high" ? "⚠ High" : r.risk === "med" ? "~ Medium" : "✓ Low"}
                        </td>
                        <td>{r.clauses}</td>
                        <td>{r.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" id="trust">
        <div className="section-inner">
          <div ref={addReveal(6)} className="reveal">
            <div className="section-label">Reviews</div>
            <h2 className="section-title">People who <em>actually read</em><br />privacy policies now</h2>
          </div>

          <div className="testimonials-grid" ref={addReveal(7)}>
            {[
              { q: "I had no idea half my favorite apps were selling my data. PolicyLens showed me in seconds what would've taken hours to figure out.", name: "Amara O.", role: "Product Designer, Lagos", avatar: "https://i.pravatar.cc/80?img=47" },
              { q: "The 'why it matters' dropdown is brilliant. Now my whole team uses it before signing up for any new SaaS tool.", name: "James K.", role: "Startup Founder", avatar: "https://i.pravatar.cc/80?img=68" },
              { q: "Every time I see a cookie banner, I run it through PolicyLens first. It's become reflex. The risk badge tells me everything instantly.", name: "Sofía R.", role: "Privacy Researcher", avatar: "https://i.pravatar.cc/80?img=32" },
            ].map((t, i) => (
              <div key={i} className="testi-card reveal" ref={addReveal(8 + i)}>
                <div className="testi-quote">"</div>
                <div className="testi-text">{t.q}</div>
                <div className="testi-author">
                  <div className="testi-avatar"><img src={t.avatar} alt={t.name} loading="eager" /></div>
                  <div>
                    <div className="testi-name">{t.name}</div>
                    <div className="testi-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="section pricing-wrap" id="pricing">
        <div className="section-inner">
          <div ref={addReveal(11)} className="reveal" style={{ textAlign: "center" }}>
            <div className="section-label" style={{ justifyContent: "center" }}>Pricing</div>
            <h2 className="section-title">Simple, <em>honest pricing</em></h2>
            <p className="section-desc" style={{ margin: "0 auto" }}>Start free. Upgrade when you need more. No hidden fees, no data selling — we practice what we preach.</p>
          </div>

          {/* Billing toggle */}
          <div className="pricing-toggle">
            <span className={`toggle-label ${!annual ? "active" : ""}`}>Monthly</span>
            <button className="toggle-pill" onClick={() => setAnnual((p: boolean) => !p)} aria-label="Toggle billing">
              <div className={`toggle-thumb ${annual ? "annual" : "monthly"}`} />
            </button>
            <span className={`toggle-label ${annual ? "active" : ""}`}>Annual</span>
            {annual && <span className="toggle-save">Save 40%</span>}
          </div>

          <div className="pricing-grid" ref={addReveal(12)}>
            {/* STARTER */}
            <div className="price-card">
              <div className="price-plan">Free</div>
              <div className="price-name">Starter</div>
              <div className="price-desc">For curious individuals who want to browse smarter.</div>
              <div className="price-divider" />
              <div className="price-amount">
                <span className="price-currency">$</span>
                <span className="price-number">0</span>
              </div>
              <div className="price-period">forever free</div>
              <div className="price-annual-note">&nbsp;</div>
              <button className="price-btn price-btn-outline">Add to Chrome — Free</button>
              <div className="price-features">
                {([
                  ["✓", "check-green", "10 analyses per month"],
                  ["✓", "check-green", "Risk badge (High / Med / Low)"],
                  ["✓", "check-green", "Clause-by-clause breakdown"],
                  ["✓", "check-green", "Why it matters explanations"],
                  ["✓", "check-green", "Last 7 days history"],
                  ["✗", "check-muted", "Full dashboard history"],
                  ["✗", "check-muted", "Export reports"],
                  ["✗", "check-muted", "API access"],
                ] as [string, string, string][]).map(([icon, cls, text], i) => (
                  <div key={i} className="price-feature">
                    <div className={`price-feature-check ${cls}`}>{icon}</div>
                    <span className={icon === "✗" ? "price-feature-x" : ""}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PRO — FEATURED */}
            <div className="price-card featured">
              <div className="price-popular">Most Popular</div>
              <div className="price-plan">Pro</div>
              <div className="price-name">Professional</div>
              <div className="price-desc">For privacy-conscious users who browse a lot.</div>
              <div className="price-divider" />
              <div className="price-amount">
                <span className="price-currency">$</span>
                <span className="price-number">{annual ? "5" : "9"}</span>
              </div>
              <div className="price-period">per month</div>
              <div className="price-annual-note">{annual ? "Billed $60/year — save $48" : "\u00a0"}</div>
              <button className="price-btn price-btn-featured">Get Pro</button>
              <div className="price-features">
                {([
                  ["✓", "check-white", "Unlimited analyses"],
                  ["✓", "check-white", "Risk badge + detailed score"],
                  ["✓", "check-white", "Clause-by-clause breakdown"],
                  ["✓", "check-white", "Why it matters explanations"],
                  ["✓", "check-white", "Full dashboard history"],
                  ["✓", "check-white", "Export PDF & CSV reports"],
                  ["✓", "check-white", "Cross-site risk comparison"],
                  ["✗", "check-white", "API access"],
                ] as [string, string, string][]).map(([icon, cls, text], i) => (
                  <div key={i} className="price-feature">
                    <div className={`price-feature-check ${cls}`}>{icon === "✗" ? "–" : "✓"}</div>
                    <span style={icon === "✗" ? { opacity: 0.35 } : {}}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* TEAM */}
            <div className="price-card">
              <div className="price-plan">Team</div>
              <div className="price-name">Business</div>
              <div className="price-desc">For teams and organizations managing vendor compliance.</div>
              <div className="price-divider" />
              <div className="price-amount">
                <span className="price-currency">$</span>
                <span className="price-number">{annual ? "12" : "19"}</span>
              </div>
              <div className="price-period">per seat / month</div>
              <div className="price-annual-note">{annual ? "Billed annually per seat" : "\u00a0"}</div>
              <button className="price-btn price-btn-default">Start Free Trial</button>
              <div className="price-features">
                {([
                  ["✓", "check-green", "Everything in Pro"],
                  ["✓", "check-green", "Up to 25 seats"],
                  ["✓", "check-green", "Shared team dashboard"],
                  ["✓", "check-green", "Bulk site analysis"],
                  ["✓", "check-green", "API access (1k req/day)"],
                  ["✓", "check-green", "Admin controls & roles"],
                  ["✓", "check-green", "Priority email support"],
                  ["✓", "check-green", "Custom report branding"],
                ] as [string, string, string][]).map(([icon, cls, text], i) => (
                  <div key={i} className="price-feature">
                    <div className={`price-feature-check ${cls}`}>{icon}</div>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pricing-footnote">
            All plans include a 14-day free trial. No credit card required. &nbsp;
            <a>Compare all features →</a>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-wrap">
        <div className="cta-bg" />
        <h2 className="cta-title">
          Stop accepting without<br /><em>understanding.</em>
        </h2>
        <p className="cta-sub">Plans start at $0. No credit card needed. Cancel anytime.</p>
        <div className="cta-actions">
          <button className="btn-cta-white"><Search size={16} style={{display:'inline',verticalAlign:'middle',marginRight:6}} /> Get Started Today</button>
          <button className="btn-cta-outline">View on Chrome Web Store</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <div className="footer-brand-name">
                <div className="nav-logo-icon"><img src="/favicon_io/android-chrome-192x192.png" alt="PolicyLens" /></div>
                PolicyLens
              </div>
              <p className="footer-brand-desc">AI-powered privacy policy analysis for everyday browsing. Built to help real people understand what they're agreeing to.</p>
            </div>
            {[
              { title: "Product", links: ["Features", "Dashboard", "Chrome Extension", "Changelog", "Roadmap"] },
              { title: "Company", links: ["About", "Blog", "Privacy Policy", "Terms", "Contact"] },
              { title: "Support", links: ["Documentation", "FAQ", "Report a Bug", "Community", "Status"] },
            ].map((col, i) => (
              <div key={i} className="footer-links">
                <h4>{col.title}</h4>
                <ul>{col.links.map(l => <li key={l}><a href="#">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} PolicyLens. All rights reserved.</span>
            <span className="footer-green">Built for people who value their privacy.</span>
          </div>
        </div>
      </footer>
    </>
  );
}