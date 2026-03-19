import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import BackgroundFlow from "./components/BackgroundFlow";
import {
  signUp,
  signIn,
  getCurrentSession,
  requestPasswordReset,
  updatePassword,
} from "./lib/auth";
import { supabase } from "./lib/supabase";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --brown:       #5C3D2E;
    --brown-lt:    #7A5244;
    --brown-pale:  #C4A882;
    --brown-faint: rgba(92,61,46,.08);
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

  html, body { height: 100%; }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--cream);
    color: var(--text);
    min-height: 100vh;
    overflow-x: hidden;
  }

  /* subtle page grain */
  body::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    opacity: .018;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
    background-size: 200px;
  }

  /* ambient colour blobs on the page itself */
  body::after {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse 55% 50% at 18% 25%, rgba(196,168,130,.13) 0%, transparent 60%),
      radial-gradient(ellipse 50% 45% at 82% 78%, rgba(61,107,79,.09)  0%, transparent 60%);
  }

  /* ── LAYOUT ── */
  .auth-wrap {
    position: relative; z-index: 1;
    display: flex; min-height: 100vh;
  }

  /* ─────────── LEFT ─────────── */
  .auth-left {
    flex: 1;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 60px 56px;
    position: relative;
    overflow: hidden;
  }

  /* Ensure left-panel content layers above BackgroundFlow (z-index 1) */
  .auth-left-copy   { position: relative; z-index: 10; }
  .auth-glass-popup { position: relative; z-index: 10; }
  .auth-left-pills  { position: relative; z-index: 10; }

  /* thin divider between panels */
  .auth-left::after {
    content: '';
    position: absolute; top: 10%; right: 0; bottom: 10%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--border) 30%, var(--border) 70%, transparent);
  }


  .auth-left-copy {
    display: flex; flex-direction: column;
    align-items: center; text-align: center;
    gap: 44px;
    animation: fadeUp .65s .18s both;
  }

  .auth-left-headline {
    font-family: 'Playfair Display', serif;
    font-size: clamp(34px, 3.4vw, 54px);
    font-weight: 700; line-height: 1.08;
    letter-spacing: -.03em; color: var(--text);
    max-width: 360px;
  }
  .auth-left-headline em {
    font-style: italic; color: var(--brown-pale);
  }

  /* ── GLASS POPUP ── */
  .auth-glass-popup {
    width: 292px;
    border-radius: 18px; overflow: hidden;
    background: rgba(255,255,255,.62);
    backdrop-filter: blur(28px) saturate(170%);
    -webkit-backdrop-filter: blur(28px) saturate(170%);
    border: 2px solid rgb(255, 255, 255);
    box-shadow:
      0 2px 0 rgba(255,255,255,.9) inset,
      0 24px 56px rgba(92,61,46,.16),
      0 6px 18px rgba(92,61,46,.10);
    animation: authFloat 4.4s ease-in-out infinite;
  }
  @keyframes authFloat {
    0%,100% { transform: translateY(0px) rotate(-.35deg); }
    50%      { transform: translateY(-9px) rotate(.35deg); }
  }

  .auth-gp-bar {
    background: rgba(250,246,241,.72);
    border-bottom: 1px solid rgba(92,61,46,.09);
    padding: 11px 14px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .auth-gp-logo { display: flex; align-items: center; gap: 7px; }
  .auth-gp-logo-dot {
    width: 20px; height: 20px; border-radius: 6px;
    overflow: hidden; position: relative;
  }
  .auth-gp-logo-dot img {
    width: 100%; height: 100%; object-fit: cover; display: block;
  }
    .auth-gp-logo-name {
    font-family: 'Playfair Display', serif;
    font-size: 12px; font-weight: 700; color: var(--brown);
  }
  .auth-gp-risk {
    background: #FEF2F2; border: 1px solid #FECACA;
    color: #DC2626; font-size: 9px; font-weight: 800; letter-spacing: .05em;
    padding: 2px 8px; border-radius: 100px;
  }

  .auth-gp-url {
    padding: 6px 14px; font-size: 10px;
    color: var(--light); font-family: 'DM Mono', monospace;
    border-bottom: 1px solid rgba(92,61,46,.07);
    display: flex; align-items: center; gap: 5px; justify-content: center;
  }

  .auth-gp-item {
    padding: 9px 14px; display: flex; gap: 8px;
    border-bottom: 1px solid rgba(92,61,46,.06);
  }
  .auth-gp-item:last-of-type { border: none; }
  .auth-gp-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .auth-gp-d-r { background: #EF4444; }
  .auth-gp-d-a { background: #F59E0B; }
  .auth-gp-d-g { background: var(--green); }
  .auth-gp-text {
    font-size: 11.5px; color: var(--text); line-height: 1.45;
    font-weight: 500;
  }
  .auth-gp-why {
    font-size: 10.5px; color: var(--muted);
    background: rgba(61,107,79,.06);
    border-left: 2px solid var(--green-muted);
    padding: 5px 9px; border-radius: 0 6px 6px 0;
    margin-top: 5px; line-height: 1.45;
  }
  .auth-gp-why-lbl {
    font-size: 9px; font-weight: 800; letter-spacing: .07em;
    text-transform: uppercase; color: var(--green); margin-bottom: 2px;
  }

  .auth-gp-footer {
    border-top: 1px solid rgba(92,61,46,.08);
    padding: 10px 14px; display: flex; gap: 7px;
    background: rgba(250,246,241,.5);
  }
  .auth-gp-btn {
    flex: 1; padding: 7px; border-radius: 7px; border: none;
    font-family: 'DM Sans', sans-serif; font-size: 10.5px;
    font-weight: 700; cursor: pointer; transition: all .15s;
  }
  .auth-gp-btn-p {
    background: var(--brown); color: white;
    box-shadow: 0 2px 8px rgba(92,61,46,.25);
  }
  .auth-gp-btn-p:hover { background: var(--brown-lt); }
  .auth-gp-btn-s {
    background: rgba(92,61,46,.07); color: var(--muted);
    border: 1px solid var(--border);
  }
  .auth-gp-btn-s:hover { background: rgba(92,61,46,.12); }

  /* trust pills */
  .auth-left-pills { display: flex; flex-direction: column; gap: 9px; align-items: left; }
  .auth-pill {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 12.5px; color: var(--muted); font-weight: 400;
  }
  .auth-pill-chk {
    width: 17px; height: 17px; border-radius: 50%;
    background: var(--green-pale); border: 1px solid var(--green-muted);
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; color: var(--green); flex-shrink: 0;
  }


/* ─────────── RIGHT ─────────── */
.auth-right {
  width: 500px; 
  min-width: 500px;
  display: flex; 
  flex-direction: column; /* Force vertical flow */
  align-items: center;    /* Keep it centered horizontally */
  
  /* CHANGE 1: Anchor to top instead of center */
  justify-content: flex-start; 
  
  /* CHANGE 2: Add a large top padding to act as the "starting position" */
  /* This ensures it never goes higher than 120px from the top */
  padding: 80px 44px 60px; 
  
  position: relative;
  min-height: 100vh; /* Ensure it takes full height so padding works */
}

  .auth-back-link {
    position: absolute; top: 32px; right: 36px;
    font-size: 12px; color: var(--light); text-decoration: none;
    font-weight: 500; letter-spacing: .01em;
    display: flex; align-items: center; gap: 4px;
    transition: color .15s; cursor: pointer; background: none; border: none;
  }
  .auth-back-link:hover { color: var(--brown); }

  /* the bordered card */
  .auth-card {
    width: 100%; max-width: 400px;
    border: 1.5px solid var(--border-md);
    border-radius: 24px;
    padding: 44px 40px 40px;
    background: rgba(255,255,255,.52);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow:
      0 1px 0 rgba(255,255,255,.9) inset,
      0 1px 0 rgba(255,255,255,.6),
      0 8px 32px rgba(92,61,46,.07),
      0 2px 8px rgba(92,61,46,.05);
    animation: fadeUp .6s .15s both;
    position: relative;
  }

  /* card top accent line */
  .auth-card::before {
    content: '';
    position: absolute; top: -1px; left: 15%; right: 15%;
    height: 2px; border-radius: 0 0 2px 2px;
    background: linear-gradient(to right, transparent, var(--brown-pale), transparent);
  }

  /* heading */
  /* tab switcher */
  .auth-tabs {
    display: flex; gap: 0;
    border: 1.5px solid var(--border-md);
    border-radius: 12px; overflow: hidden;
    margin-bottom: 28px;
  }
  .auth-tab {
    flex: 1; padding: 10px 0; border: none; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 600;
    letter-spacing: .01em; transition: all .2s; color: var(--light);
    background: transparent; position: relative;
  }
  .auth-tab + .auth-tab { border-left: 1.5px solid var(--border-md); }
  .auth-tab.on {
    color: var(--text);
    background: rgba(92,61,46,.06);
  }
  .auth-tab.on::after {
    content: '';
    position: absolute; bottom: 0; left: 20%; right: 20%;
    height: 2px; border-radius: 2px 2px 0 0;
    background: var(--brown);
  }

  /* social buttons */
  .auth-socials { display: flex; gap: 10px; margin-bottom: 22px; }
  .auth-soc-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 9px;
    padding: 12px 10px; border-radius: 12px;
    border: 1.5px solid var(--border-md);
    background: rgba(255,255,255,.6);
    cursor: pointer; font-family: 'DM Sans', sans-serif;
    font-size: 13.5px; font-weight: 600; color: var(--text);
    backdrop-filter: blur(8px);
    transition: all .18s;
    box-shadow: 0 1px 3px rgba(92,61,46,.06);
  }
  .auth-soc-btn:hover {
    border-color: var(--brown);
    background: rgba(255,255,255,.85);
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(92,61,46,.11);
  }

  /* or */
  .auth-or {
    display: flex; align-items: center; gap: 14px; margin-bottom: 22px;
  }
  .auth-or-ln { flex: 1; height: 1px; background: var(--border); }
  .auth-or-tx {
    font-size: 11px; color: var(--light); font-weight: 500;
    letter-spacing: .04em; text-transform: uppercase;
  }

  /* fields */
  .auth-fields { display: flex; flex-direction: column; gap: 18px; margin-bottom: 22px; }

  .auth-fld { display: flex; flex-direction: column; gap: 7px; }

  .auth-fld-top {
    display: flex; justify-content: space-between; align-items: baseline;
  }
  .auth-fld-lbl {
    font-size: 11.5px; font-weight: 600; color: var(--muted);
    letter-spacing: .05em; text-transform: uppercase;
  }
  .auth-fld-forgot {
    font-size: 11.5px; color: var(--brown); font-weight: 600;
    text-decoration: none; transition: opacity .15s; letter-spacing: .01em;
  }
  .auth-fld-forgot:hover { opacity: .6; }

  .auth-fld-wrap { position: relative; }
  .auth-fld-in {
    width: 100%; padding: 14px 16px;
    border: 1.5px solid var(--border-md);
    border-radius: 12px;
    background: rgba(255,255,255,.7);
    backdrop-filter: blur(8px);
    font-family: 'DM Sans', sans-serif; font-size: 14.5px;
    color: var(--text); outline: none;
    transition: border-color .2s, box-shadow .2s, background .2s;
    box-shadow: 0 1px 3px rgba(92,61,46,.05);
    -webkit-appearance: none;
  }
  .auth-fld-in::placeholder {
    color: var(--light); font-weight: 300; font-size: 14px;
  }
  .auth-fld-in:hover:not(:focus) {
    border-color: rgba(92,61,46,.28);
    background: rgba(255,255,255,.85);
  }
  .auth-fld-in:focus {
    border-color: var(--brown);
    background: white;
    box-shadow: 0 0 0 4px rgba(92,61,46,.08), 0 1px 3px rgba(92,61,46,.06);
  }
  .auth-fld-in.err { border-color: #C0392B; background: #FDF9F8; }
  .auth-fld-in.err:focus { box-shadow: 0 0 0 4px rgba(192,57,43,.08); }

  .auth-fld-eye {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    background: none; border: none; cursor: pointer; color: var(--light);
    font-size: 15px; padding: 4px; transition: color .15s;
    display: flex; align-items: center;
  }
  .auth-fld-eye:hover { color: var(--brown); }

  .auth-fld-err {
    font-size: 11px; color: #C0392B; font-weight: 600;
    display: flex; align-items: center; gap: 4px; letter-spacing: .01em;
  }

  /* error banner */
  .auth-err-banner {
    background: #FDF0EE; border: 1px solid #F0B9B2;
    border-radius: 11px; padding: 11px 16px; margin-bottom: 10px;
    font-size: 12.5px; color: #C0392B; font-weight: 600;
    display: flex; align-items: center; gap: 7px;
    animation: shake .4s ease;
    letter-spacing: .01em;
  }
  @keyframes shake {
    0%,100% { transform: translateX(0); }
    20%,60%  { transform: translateX(-5px); }
    40%,80%  { transform: translateX(5px); }
  }

  /* submit */
  .auth-submit {
    width: 100%; padding: 15px;
    background: var(--brown); color: white;
    border: none; border-radius: 13px; cursor: pointer;
    font-family: 'DM Sans', sans-serif;
    font-size: 15px; font-weight: 700; letter-spacing: .01em;
    display: flex; align-items: center; justify-content: center; gap: 9px;
    transition: background .2s, transform .18s, box-shadow .2s;
    box-shadow: 0 4px 20px rgba(92,61,46,.28), 0 1px 0 rgba(255,255,255,.12) inset;
    margin-bottom: 22px; position: relative; overflow: hidden;
  }
  .auth-submit::before {
    content: '';
    position: absolute; inset: 0;
    background: linear-gradient(to bottom, rgba(255,255,255,.1), transparent);
    pointer-events: none;
  }
  .auth-submit:hover:not(:disabled) {
    background: var(--brown-lt);
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(92,61,46,.32);
  }
  .auth-submit:active:not(:disabled) { transform: translateY(0); }
  .auth-submit:disabled { opacity: .72; cursor: wait; }
  .auth-submit.done { background: var(--green); }

  .auth-spin {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,.3); border-top-color: white;
    animation: authSpin .7s linear infinite; flex-shrink: 0;
  }
  @keyframes authSpin { to { transform: rotate(360deg); } }

  /* alt link */
  .auth-alt {
    text-align: center; font-size: 13px; color: var(--muted);
    margin-bottom: 22px; line-height: 1.5;
  }
  .auth-alt a {
    color: var(--brown); font-weight: 700; text-decoration: none;
    border-bottom: 1.5px solid transparent; transition: border-color .15s; cursor: pointer;
  }
  .auth-alt a:hover { border-color: var(--brown); }

  /* divider in card */
  .auth-card-divider {
    height: 1px; background: var(--border);
    margin: 0 -40px 22px;
  }

  /* terms */
  .auth-terms {
    text-align: center; font-size: 11px; color: var(--light);
    line-height: 1.6; letter-spacing: .01em;
  }
  .auth-terms a { color: var(--muted); text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 860px) {
    .auth-left { display: none; }
    .auth-right { width: 100%; min-width: unset; padding: 32px 20px; }
    .auth-card { padding: 36px 28px 32px; }
    .auth-socials { flex-direction: column; }
  }
`;

const GIcon = () => (
  <svg width="17" height="17" viewBox="0 0 18 18" fill="none">
    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908C16.658 14.131 17.64 11.862 17.64 9.2z" fill="#4285F4"/>
    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
    <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
  </svg>
);

const AIcon = () => (
  <svg width="14" height="17" viewBox="0 0 15 18" fill="currentColor">
    <path d="M12.63 9.55c-.02-2.16 1.77-3.2 1.85-3.25-1.01-1.47-2.58-1.67-3.14-1.69-1.34-.14-2.62.79-3.3.79-.68 0-1.73-.77-2.84-.75-1.46.02-2.81.85-3.56 2.16-1.52 2.63-.39 6.53 1.09 8.67.72 1.04 1.58 2.21 2.71 2.17 1.09-.04 1.5-.7 2.82-.7 1.31 0 1.68.7 2.82.68 1.17-.02 1.92-1.06 2.63-2.1.83-1.2 1.17-2.37 1.19-2.43-.03-.01-2.28-.87-2.27-3.55z"/>
    <path d="M10.47 3.05c.6-.73 1-1.73.89-2.74-.86.04-1.9.57-2.51 1.29-.55.63-1.03 1.65-.9 2.62.96.07 1.93-.48 2.52-1.17z"/>
  </svg>
);

interface HitState {
  email?: boolean;
  pw?: boolean;
  name?: boolean;
}

export default function LoginPage(_: {}) {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState<"in" | "up">("in");
  const [email,     setEmail]     = useState("");
  const [pw,        setPw]        = useState("");
  const [name,      setName]      = useState("");
  const [show,      setShow]      = useState(false);
  const [hit,       setHit]       = useState<HitState>({});
  const [busy,      setBusy]      = useState(false);
  const [err,       setErr]       = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotBusy, setForgotBusy] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotErr, setForgotErr] = useState("");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetMsg, setResetMsg] = useState("");

  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const okPw    = pw.length >= 8;
  const okName  = name.trim().length >= 2;
  const canGo   = okEmail && okPw && (tab === "in" || okName);
  const forgotEmailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail);
  const resetPwOk = newPw.length >= 8 && newPw === newPw2;

  // Detect password-recovery flow and gate normal auto-redirect
  useEffect(() => {
    const hash = window.location.hash;
    const query = window.location.search;
    const recoveryHint = hash.includes("type=recovery") || query.includes("type=recovery");
    if (recoveryHint) {
      setRecoveryMode(true);
      setTab("in");
      setErr("");
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
        setTab("in");
        setErr("");
      }
    });

    const checkSession = async () => {
      const { session } = await getCurrentSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    void checkSession();

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  const signup = async (): Promise<boolean> => {
    const result = await signUp({
      email,
      password: pw,
      name: name.trim(),
    });

    if (!result.success) {
      setErr(result.error || "Signup failed");
      return false;
    }

    if (result.requiresConfirmation) {
      setConfirmed(true);
      return false;
    }

    return true;
  };

  const signin = async (): Promise<boolean> => {
    const result = await signIn({
      email,
      password: pw,
    });

    if (!result.success) {
      setErr(result.error || "Sign in failed");
      return false;
    }

    return true;
  };

  const sendResetLink = async () => {
    setForgotErr("");
    setForgotMsg("");
    if (!forgotEmailOk) {
      setForgotErr("Please enter a valid email address.");
      return;
    }

    setForgotBusy(true);
    const result = await requestPasswordReset(forgotEmail.trim());
    setForgotBusy(false);

    if (!result.success) {
      setForgotErr(result.error || "Could not send reset link.");
      return;
    }

    setForgotMsg("Password reset link sent. Check your email inbox.");
  };

  const submitPasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErr("");
    setResetMsg("");

    if (!resetPwOk) {
      setErr("Password must be at least 8 characters and both fields must match.");
      return;
    }

    setResetBusy(true);
    const result = await updatePassword(newPw);
    setResetBusy(false);

    if (!result.success) {
      setErr(result.error || "Failed to update password.");
      return;
    }

    setResetMsg("Password updated successfully. You can now sign in.");
    setRecoveryMode(false);
    setForgotOpen(false);
    setTab("in");
    setShow(false);
    setErr("");
    setNewPw("");
    setNewPw2("");
    window.history.replaceState({}, document.title, "/login");
  };

  const go = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setHit({ email: true, pw: true, name: true });
    if (!canGo) return;
    setErr("");
    setResetMsg("");
    setBusy(true);

    const ok = tab === "up" ? await signup() : await signin();

    setBusy(false);

    if (ok) {
      // Clear form fields before navigating
      setEmail("");
      setPw("");
      setName("");
      setShow(false);
      setHit({});
      navigate("/dashboard");
    }
  };

  const swap = (t: "in" | "up") => {
    setTab(t);
    setEmail("");
    setPw("");
    setName("");
    setShow(false);
    setErr("");
    setConfirmed(false);
    setHit({});
    setForgotOpen(false);
    setForgotErr("");
    setForgotMsg("");
    setResetMsg("");
  };

  return (
    <>
      <style>{css}</style>
      <div className="auth-wrap">

        {/* ── LEFT ── */}
        <div className="auth-left">
          <BackgroundFlow />
          <div className="auth-left-copy">
            <h2 className="auth-left-headline">
              Know what you're<br /><em>agreeing to.</em>
            </h2>

            <div className="auth-glass-popup">
              <div className="auth-gp-bar">
                <div className="auth-gp-logo">
                  <div className="auth-gp-logo-dot">
                    <img src="/favicon_io/favicon-32x32.png" alt="" />
                  </div>
                  <span className="auth-gp-logo-name">PolicyLens</span>
                </div>
                <span className="auth-gp-risk">⚠ HIGH RISK</span>
              </div>
              <div className="auth-gp-url">
                PolicyLens in action!
              </div>

              <div className="auth-gp-item">
                <div className="auth-gp-dot auth-gp-d-r" />
                <div>
                  <div className="auth-gp-text">Your data may be sold to advertisers.</div>
                  <div className="auth-gp-why">
                    <div className="auth-gp-why-lbl">Why it matters</div>
                    Your habits are monetized without your consent.
                  </div>
                </div>
              </div>
              <div className="auth-gp-item">
                <div className="auth-gp-dot auth-gp-d-a" />
                <div className="auth-gp-text">Cookies persist for 3 years after your last visit.</div>
              </div>
              <div className="auth-gp-item">
                <div className="auth-gp-dot auth-gp-d-g" />
                <div className="auth-gp-text">Data deletion requests honoured within 30 days.</div>
              </div>

              <div className="auth-gp-footer">
                <button className="auth-gp-btn auth-gp-btn-p">Full Report</button>
                <button className="auth-gp-btn auth-gp-btn-s">Save to Dashboard</button>
              </div>
            </div>

            <div className="auth-left-pills">
              {[
                "Analysis runs entirely client-side",
                "Zero browsing data on our servers",
                "Works on any site, instantly",
              ].map(t => (
                <div key={t} className="auth-pill">
                  <div className="auth-pill-chk">✓</div>
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className="auth-right">
          <button className="auth-back-link" onClick={() => navigate('/')}>← Back to site</button>

          <div className="auth-card">

            {recoveryMode ? (
              <>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 8,
                  textAlign: "center",
                }}>Reset Your Password</h2>
                <p style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  textAlign: "center",
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}>Set a new password for your account. Use at least 8 characters.</p>

                {err && <div className="auth-err-banner"><span>⚠</span>{err}</div>}
                {resetMsg && (
                  <div style={{
                    background: "#F0FDF4", border: "1px solid #86EFAC",
                    borderRadius: 11, padding: "11px 16px", marginBottom: 12,
                    fontSize: 12.5, color: "#166534", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 7,
                  }}>
                    <span>✓</span>{resetMsg}
                  </div>
                )}

                <form onSubmit={submitPasswordUpdate} noValidate>
                  <div className="auth-fields">
                    <div className="auth-fld">
                      <label className="auth-fld-lbl">New Password</label>
                      <div className="auth-fld-wrap">
                        <input
                          className="auth-fld-in"
                          type={show ? "text" : "password"}
                          placeholder="At least 8 characters"
                          value={newPw}
                          onChange={e => setNewPw(e.target.value)}
                          style={{ paddingRight: 46 }}
                          autoComplete="new-password"
                        />
                        <button type="button" className="auth-fld-eye" onClick={() => setShow(p => !p)} tabIndex={-1}>
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="auth-fld">
                      <label className="auth-fld-lbl">Confirm Password</label>
                      <div className="auth-fld-wrap">
                        <input
                          className="auth-fld-in"
                          type={show ? "text" : "password"}
                          placeholder="Re-enter your new password"
                          value={newPw2}
                          onChange={e => setNewPw2(e.target.value)}
                          style={{ paddingRight: 46 }}
                          autoComplete="new-password"
                        />
                        <button type="button" className="auth-fld-eye" onClick={() => setShow(p => !p)} tabIndex={-1}>
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {newPw2.length > 0 && !resetPwOk && (
                        <span className="auth-fld-err">⚠ Passwords must match and be at least 8 characters</span>
                      )}
                    </div>
                  </div>

                  <button type="submit" className="auth-submit" disabled={resetBusy}>
                    {resetBusy && <div className="auth-spin" />}
                    {resetBusy ? "Updating password..." : "Set New Password"}
                  </button>
                </form>

                <div className="auth-card-divider" />

                <p className="auth-alt">
                  <a onClick={() => { setRecoveryMode(false); setResetMsg(""); setErr(""); }}>← Back to login</a>
                </p>
              </>
            ) : forgotOpen ? (
              <>
                <h2 style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 28,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 8,
                  textAlign: "center",
                }}>Forgot Password</h2>
                <p style={{
                  fontSize: 13,
                  color: "var(--muted)",
                  textAlign: "center",
                  marginBottom: 24,
                  lineHeight: 1.5,
                }}>Enter your account email and we'll send a secure password-reset link.</p>

                {forgotErr && <div className="auth-err-banner"><span>⚠</span>{forgotErr}</div>}
                {forgotMsg && (
                  <div style={{
                    background: "#F0FDF4", border: "1px solid #86EFAC",
                    borderRadius: 11, padding: "11px 16px", marginBottom: 12,
                    fontSize: 12.5, color: "#166534", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 7,
                  }}>
                    <span>✓</span>{forgotMsg}
                  </div>
                )}

                <div className="auth-fields">
                  <div className="auth-fld">
                    <label className="auth-fld-lbl">Email Address</label>
                    <div className="auth-fld-wrap">
                      <input
                        className="auth-fld-in"
                        type="email"
                        placeholder="you@example.com"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="auth-submit"
                  onClick={sendResetLink}
                  disabled={forgotBusy}
                >
                  {forgotBusy && <div className="auth-spin" />}
                  {forgotBusy ? "Sending link..." : "Send Reset Link"}
                </button>

                <div className="auth-card-divider" />

                <p className="auth-alt">
                  <a onClick={() => { setForgotOpen(false); setForgotErr(""); setForgotMsg(""); }}>← Back to login</a>
                </p>
              </>
            ) : (
              <>
                <div className="auth-socials">
                  <button className="auth-soc-btn"><GIcon />Google</button>
                  <button className="auth-soc-btn"><AIcon />Apple</button>
                </div>

                <div className="auth-or">
                  <div className="auth-or-ln" />
                  <span className="auth-or-tx">or continue with email</span>
                  <div className="auth-or-ln" />
                </div>

                {err && <div className="auth-err-banner"><span>⚠</span>{err}</div>}

                {confirmed && (
                  <div style={{
                    background: "#F0FDF4", border: "1px solid #86EFAC",
                    borderRadius: 11, padding: "11px 16px", marginBottom: 10,
                    fontSize: 12.5, color: "#166534", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 7,
                    letterSpacing: ".01em",
                  }}>
                    <span>✉</span> Check your email to confirm your account, then sign in.
                  </div>
                )}

                {resetMsg && (
                  <div style={{
                    background: "#F0FDF4", border: "1px solid #86EFAC",
                    borderRadius: 11, padding: "11px 16px", marginBottom: 10,
                    fontSize: 12.5, color: "#166534", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 7,
                    letterSpacing: ".01em",
                  }}>
                    <span>✓</span> {resetMsg}
                  </div>
                )}

                <form onSubmit={go} noValidate>
                  <div className="auth-fields">
                    {tab === "up" && (
                      <div className="auth-fld">
                        <label className="auth-fld-lbl">Full Name</label>
                        <div className="auth-fld-wrap">
                          <input
                            className={`auth-fld-in${hit.name && !okName ? " err" : ""}`}
                            type="text" placeholder="Ada Lovelace"
                            value={name} onChange={e => setName(e.target.value)}
                            onBlur={() => setHit(p => ({ ...p, name: true }))}
                            autoComplete="name"
                          />
                        </div>
                        {hit.name && !okName &&
                          <span className="auth-fld-err">⚠ Enter your full name</span>}
                      </div>
                    )}

                    <div className="auth-fld">
                      <label className="auth-fld-lbl">Email Address</label>
                      <div className="auth-fld-wrap">
                        <input
                          className={`auth-fld-in${hit.email && !okEmail ? " err" : ""}`}
                          type="email" placeholder="you@example.com"
                          value={email} onChange={e => setEmail(e.target.value)}
                          onBlur={() => setHit(p => ({ ...p, email: true }))}
                          autoComplete="email"
                        />
                      </div>
                      {hit.email && !okEmail &&
                        <span className="auth-fld-err">⚠ Valid email required</span>}
                    </div>

                    <div className="auth-fld">
                      <div className="auth-fld-top">
                        <label className="auth-fld-lbl">Password</label>
                        {tab === "in" &&
                          <button
                            type="button"
                            className="auth-fld-forgot"
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                            onClick={() => {
                              setForgotOpen(true);
                              setForgotErr("");
                              setForgotMsg("");
                              if (!forgotEmail && email) setForgotEmail(email);
                            }}
                          >
                            Forgot password?
                          </button>}
                      </div>
                      <div className="auth-fld-wrap">
                        <input
                          className={`auth-fld-in${hit.pw && !okPw ? " err" : ""}`}
                          type={show ? "text" : "password"}
                          placeholder={tab === "up" ? "At least 8 characters" : "Enter your password"}
                          value={pw} onChange={e => setPw(e.target.value)}
                          onBlur={() => setHit(p => ({ ...p, pw: true }))}
                          style={{ paddingRight: 46 }}
                          autoComplete={tab === "up" ? "new-password" : "current-password"}
                        />
                        <button type="button" className="auth-fld-eye"
                          onClick={() => setShow(p => !p)} tabIndex={-1}>
                          {show ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {hit.pw && !okPw &&
                        <span className="auth-fld-err">⚠ At least 8 characters</span>}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="auth-submit"
                    disabled={busy}
                  >
                    {busy && <div className="auth-spin" />}
                    {busy
                      ? (tab === "up" ? "Creating account…" : "Signing in…")
                      : tab === "in" ? "Sign In to PolicyLens"
                      : "Create My Account"}
                  </button>
                </form>

                <div className="auth-card-divider" />

                <p className="auth-alt">
                  {tab === "in"
                    ? <>Don't have an account?{" "}<a onClick={() => swap("up")}>Sign up free →</a></>
                    : <>Already have an account?{" "}<a onClick={() => swap("in")}>Sign in →</a></>}
                </p>

                <p className="auth-terms">
                  By continuing you agree to our{" "}
                  <a>Terms of Service</a> and <a>Privacy Policy</a>.<br />
                </p>
              </>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
