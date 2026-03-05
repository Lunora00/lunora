"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Atom, BarChart2, Brain, BookOpen,
  ChevronDown, Trash2, History,
  CheckCircle, Sparkles,
  Trophy, Target, TrendingUp, Clock,
  ArrowRight, RotateCcw, Info, Zap,
} from "lucide-react";

// ─── AP Physics 1 2026 Scoring ────────────────────────────────────────────────
// As of 2025, AP Physics 1 was restructured. The updated exam:
// Section 1: 40 MCQ (single-select) → 43.75% weight
//            5 MCQ (multi-select)   → 6.25% weight  — total MCQ = 45 questions, 50% weight
// Section 2: 5 FRQ → 50% weight
//   Q1: /15 (experimental design / long)
//   Q2: /12 (quantitative/qualitative argument / long)
//   Q3: /10 (short)
//   Q4: /7  (short)
//   Q5: /6  (short)
//   Total FRQ raw = 50 pts
//
// Composite = (MCQ_correct/45 × 50) + (FRQ_raw/50 × 50)  → /100
// AP Score thresholds (approximate, based on College Board 2024–2025 data)
// Physics 1 is one of the harder APs — ~5% score a 5, ~20% score a 4
const AP_SCORE_BREAKPOINTS = [
  { min: 70, score: 5 },
  { min: 55, score: 4 },
  { min: 38, score: 3 },
  { min: 23, score: 2 },
  { min: 0,  score: 1 },
];

const FRQ_CONFIG = [
  { label: "Experimental Design (Long)",        max: 15, type: "long"  },
  { label: "Quantitative Argument (Long)",       max: 12, type: "long"  },
  { label: "Short Answer 3",                    max: 10, type: "short" },
  { label: "Short Answer 4",                    max: 7,  type: "short" },
  { label: "Short Answer 5",                    max: 6,  type: "short" },
];

const FRQ_TOTAL_RAW = 50;
const MCQ_TOTAL     = 45;

function calcComposite(mcq: number, frq: number[]): number {
  const frqRaw       = frq.reduce((a, b) => a + b, 0);
  const mcqComponent = (mcq    / MCQ_TOTAL)     * 50;
  const frqComponent = (frqRaw / FRQ_TOTAL_RAW) * 50;
  return Math.round((mcqComponent + frqComponent) * 10) / 10;
}

function calcAPScore(composite: number): number {
  for (const bp of AP_SCORE_BREAKPOINTS) {
    if (composite >= bp.min) return bp.score;
  }
  return 1;
}

function getScoreLabel(score: number): string {
  return ({
    5: "Extremely well qualified",
    4: "Well qualified",
    3: "Qualified",
    2: "Possibly qualified",
    1: "No recommendation",
  } as Record<number, string>)[score] ?? "";
}

function getScoreColor(score: number): string {
  return ({
    5: "#1a7a4a", 4: "#2d6e9e", 3: "#8a6a00", 2: "#b84e00", 1: "#c83232",
  } as Record<number, string>)[score] ?? "#888";
}

function getScoreBg(score: number): string {
  return ({
    5: "rgba(26,122,74,0.08)",   4: "rgba(45,110,158,0.08)",
    3: "rgba(138,106,0,0.08)",   2: "rgba(184,78,0,0.08)",
    1: "rgba(200,50,50,0.08)",
  } as Record<number, string>)[score] ?? "rgba(0,0,0,0.04)";
}

function getScoreMessage(score: number): string {
  return ({
    5: "Exceptional — you're on track for a 5. Physics 1 is one of the hardest APs to ace. Keep it up.",
    4: "Strong result. A 4 on Physics 1 is well above average and earns credit at most colleges.",
    3: "You're in qualifying territory. Targeted FRQ practice can push you to a 4.",
    2: "You're building the foundation. Focus on force diagrams and energy conservation to move up fast.",
    1: "Don't be discouraged. Consistent daily practice on core mechanics concepts will turn this around.",
  } as Record<number, string>)[score] ?? "";
}

function getThresholdRange(score: number): string {
  return ({ 5: "≥70", 4: "55–69", 3: "38–54", 2: "23–37", 1: "0–22" } as Record<number, string>)[score] ?? "";
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────
interface SavedAttempt {
  id: string; mcq: number; frq: number[];
  composite: number; apScore: number;
  savedAt: number; label: string;
}

const DB_NAME = "lunora_ap_physics1"; const DB_VERSION = 1; const STORE = "attempts";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}
async function saveAttempt(a: SavedAttempt): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(a);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch { /* silent */ }
}
async function loadAttempts(): Promise<SavedAttempt[]> {
  try {
    const db = await openDB();
    return new Promise((res, rej) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).getAll();
      req.onsuccess = () => res(req.result || []); req.onerror = () => rej(req.error);
    });
  } catch { return []; }
}
async function deleteAttempt(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((res, rej) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).delete(id);
      tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error);
    });
  } catch { /* silent */ }
}

// ─── Moon Logo ────────────────────────────────────────────────────────────────
function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const svgSizes = { sm: 90, md: 120, lg: 140 };
  const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size]; const ts = textSizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
      <svg viewBox="0 0 100 100" style={{ width: s, height: s, transform: "rotate(40deg)", flexShrink: 0 }}>
        <defs>
          <mask id={`lunora-mask-${light ? "light" : "dark"}`}>
            <rect width="100" height="100" fill="white" />
            <circle cx="57" cy="50" r="40" fill="black" />
          </mask>
        </defs>
        <circle cx="50" cy="50" r="42" fill={light ? "white" : "#203567"} mask={`url(#lunora-mask-${light ? "light" : "dark"})`} />
      </svg>
      <span style={{ fontSize: ts, fontWeight: 300, letterSpacing: "0.12em", color: light ? "white" : "#1a1a1a", marginLeft: -60, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>lunora</span>
    </div>
  );
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #eef0f8" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#203567", paddingRight: 16, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: "#203567", transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}>
          <ChevronDown size={18} />
        </span>
      </button>
      <div style={{ maxHeight: open ? 300 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s" }}>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.75, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

// ─── Score Gauge ──────────────────────────────────────────────────────────────
function ScoreGauge({ composite }: { composite: number }) {
  const apScore = calcAPScore(composite);
  const color   = getScoreColor(apScore);
  const pct     = Math.min(composite / 100, 1);
  const r = 54; const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={140} height={100} viewBox="0 0 140 110">
        <circle cx="70" cy="80" r={r} fill="none" stroke="#eef0f8" strokeWidth={10}
          strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={circ * 0.125}
          strokeLinecap="round" transform="rotate(-225 70 80)"
        />
        <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${circ * 0.75 * pct} ${circ * (1 - 0.75 * pct)}`}
          strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(-225 70 80)"
          style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }}
        />
        <text x="70" y="76" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="DM Sans, sans-serif">{composite.toFixed(1)}</text>
        <text x="70" y="92" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="DM Sans, sans-serif">out of 100</text>
      </svg>
    </div>
  );
}

// ─── Score Slider ─────────────────────────────────────────────────────────────
function ScoreSlider({ label, sublabel, value, max, onChange, color = "#203567" }: {
  label: string; sublabel?: string; value: number; max: number; onChange: (v: number) => void; color?: string;
}) {
  const pct = (value / max) * 100;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
        <div>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{label}</span>
          {sublabel && <span style={{ fontSize: 12, color: "#aaa", marginLeft: 6 }}>{sublabel}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <input
            type="number" min={0} max={max} value={value}
            onChange={e => { const v = Math.max(0, Math.min(max, Number(e.target.value))); onChange(isNaN(v) ? 0 : v); }}
            style={{ width: 52, padding: "4px 8px", border: "1.5px solid #eef0f8", borderRadius: 8, fontSize: 15, fontWeight: 800, color, textAlign: "center", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }}
          />
          <span style={{ fontSize: 13, color: "#aaa", fontWeight: 500 }}>/ {max}</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 100, background: "#eef0f8", cursor: "pointer" }}
        onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); onChange(Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * max)); }}
      >
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 100, background: color, width: `${pct}%`, transition: "width 0.15s ease" }} />
        <input type="range" min={0} max={max} value={value} onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }}
        />
      </div>
    </div>
  );
}

// ─── Breakdown Bar ────────────────────────────────────────────────────────────
function BreakdownBar({ label, score, max, color }: { label: string; score: number; max: number; color: string }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: "#888", fontWeight: 500, width: 90, flexShrink: 0, lineHeight: 1.3 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "#eef0f8", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", background: color, width: `${pct}%`, borderRadius: 100, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 44, textAlign: "right", flexShrink: 0 }}>{score}/{max}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function APPhysics1ScoreCalculator() {
  const [mcq, setMcq]                     = useState(25);
  const [frq, setFrq]                     = useState<number[]>([9, 7, 6, 4, 3]);
  const [savedAttempts, setSavedAttempts] = useState<SavedAttempt[]>([]);
  const [justSaved, setJustSaved]         = useState(false);
  const [showHistory, setShowHistory]     = useState(false);
  const [scrolled, setScrolled]           = useState(false);

  const frqRaw       = frq.reduce((a, b) => a + b, 0);
  const composite    = calcComposite(mcq, frq);
  const apScore      = calcAPScore(composite);
  const scoreColor   = getScoreColor(apScore);
  const scoreBg      = getScoreBg(apScore);
  const mcqComponent = Math.round((mcq    / MCQ_TOTAL)     * 50 * 10) / 10;
  const frqComponent = Math.round((frqRaw / FRQ_TOTAL_RAW) * 50 * 10) / 10;

  useEffect(() => {
    loadAttempts().then(setSavedAttempts);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const updateFrq = (i: number, val: number) => {
    const copy = [...frq];
    copy[i] = Math.max(0, Math.min(FRQ_CONFIG[i].max, val));
    setFrq(copy);
  };

  const handleSave = async () => {
    const attempt: SavedAttempt = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      mcq, frq: [...frq], composite, apScore, savedAt: Date.now(),
      label: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    };
    await saveAttempt(attempt);
    setSavedAttempts(await loadAttempts());
    setJustSaved(true); setShowHistory(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  const handleDelete = async (id: string) => {
    await deleteAttempt(id);
    setSavedAttempts(await loadAttempts());
  };

  const handleReset = () => { setMcq(0); setFrq([0, 0, 0, 0, 0]); };

  const loadAttemptIntoCalc = (a: SavedAttempt) => {
    setMcq(a.mcq); setFrq([...a.frq]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const faqs = [
    {
      q: "How is the AP Physics 1 exam scored in 2026?",
      a: "The updated AP Physics 1 exam has two sections. Section 1 has 45 multiple choice questions (a mix of single-select and multi-select) worth 50% of your total score, completed in 1 hour 35 minutes. Section 2 has 5 free response questions worth 50%, completed in 1 hour 50 minutes. Raw scores from each section are converted to a composite out of 100 and then mapped to an AP score of 1–5.",
    },
    {
      q: "What composite score do I need for a 5 on AP Physics 1?",
      a: "Based on recent College Board score distributions, you generally need a composite score of approximately 70 or above to earn a 5 on AP Physics 1. Physics 1 consistently has one of the lowest 5 rates of any AP exam — typically only 5–8% of test takers score a 5 each year.",
    },
    {
      q: "What composite score do I need for a 3 on AP Physics 1?",
      a: "A composite score of approximately 38 or above typically earns a 3 on AP Physics 1. A 3 is considered 'qualified' and accepted for college credit at many universities, though policies vary.",
    },
    {
      q: "How many free response questions are on AP Physics 1?",
      a: "The AP Physics 1 free response section has 5 questions: 2 long free response questions (one experimental design worth 15 pts, one quantitative argument worth 12 pts) and 3 short free response questions (worth 10, 7, and 6 pts respectively). The total raw FRQ score is 50 points.",
    },
    {
      q: "Is AP Physics 1 hard to get a 5 on?",
      a: "Yes — AP Physics 1 is widely considered one of the most difficult AP exams to score a 5 on. The exam emphasizes conceptual reasoning, mathematical derivation, and experimental design rather than plug-and-chug calculations. Only about 5–8% of students earn a 5. Strong FRQ performance is especially critical.",
    },
    {
      q: "What topics are covered on AP Physics 1?",
      a: "AP Physics 1 covers kinematics, dynamics (Newton's laws), circular motion, energy, momentum, simple harmonic motion, torque and rotational motion, electric charge and current, and mechanical waves. The 2025 restructuring removed some electricity topics that moved to AP Physics 2.",
    },
    {
      q: "How can I improve my AP Physics 1 score?",
      a: "Focus heavily on the free response section — it's worth 50% of your score and where most students lose the most points. Practice drawing and interpreting force diagrams, energy bar charts, and momentum diagrams. Work through past College Board FRQs under timed conditions. Use tools like Lunora to generate unlimited practice questions from your AP Physics 1 notes and identify your weak units fast.",
    },
  ];

  const otherExams = [
    { name: "AP Chemistry",        href: "/tools/ap-chemistry-score-calculator"           },
    { name: "AP Biology",          href: "/tools/ap-biology-score-calculator"              },
    { name: "AP Calculus AB",      href: "/tools/ap-calculus-ab-score-calculator"          },
    { name: "AP Statistics",       href: "/tools/ap-statistics-score-calculator"           },
    { name: "AP US History",       href: "/tools/ap-us-history-score-calculator"           },
    { name: "AP World History",    href: "/tools/ap-world-history-score-calculator"        },
    { name: "AP Psychology",       href: "/tools/ap-psychology-score-calculator"           },
    { name: "AP Macroeconomics",   href: "/tools/ap-macroeconomics-score-calculator"       },
    { name: "AP English Lang",     href: "/tools/ap-english-language-score-calculator"     },
    { name: "AP Computer Sci A",   href: "/tools/ap-computer-science-a-score-calculator"   },
    { name: "AP Env. Science",     href: "/tools/ap-environmental-science-score-calculator" },
    { name: "AP Human Geography",  href: "/tools/ap-human-geography-score-calculator"      },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      {/* ── Styles ──────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }

        .nav-link {
          color: #555; text-decoration: none; font-size: 14px; font-weight: 500;
          transition: color 0.2s; font-family: 'DM Sans', sans-serif; position: relative;
        }
        .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1.5px; background: #203567; transition: width 0.25s; }
        .nav-link:hover { color: #203567; }
        .nav-link:hover::after { width: 100%; }

        .btn-primary {
          background: #203567; color: white; border: none; border-radius: 100px;
          padding: 14px 32px; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center;
          justify-content: center; gap: 8px; text-decoration: none;
        }
        .btn-primary:hover { background: #162a54; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(32,53,103,0.3); }

        .tag-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 14px; border-radius: 100px;
          background: rgba(32,53,103,0.07); border: 1px solid rgba(32,53,103,0.12);
          font-size: 11px; font-weight: 700; color: #203567;
          letter-spacing: 0.08em; text-transform: uppercase; font-family: 'DM Sans', sans-serif;
        }

        .score-card {
          border-radius: 20px; border: 1.5px solid #eef0f8; background: white; padding: 28px;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .score-card:hover { box-shadow: 0 8px 32px rgba(32,53,103,0.09); transform: translateY(-2px); }

        .calc-grid {
          display: grid; grid-template-columns: 1fr 380px; gap: 32px;
          max-width: 1100px; margin: 0 auto; align-items: start;
        }
        @media(max-width: 900px) { .calc-grid { grid-template-columns: 1fr; } }

        .hide-mobile { display: none !important; }
        @media(min-width: 769px) { .hide-mobile { display: flex !important; } }

        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }

        .exam-card {
          padding: 16px 18px; border-radius: 14px; border: 1.5px solid #eef0f8;
          background: #fafbfd; transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
          cursor: pointer; text-decoration: none; display: block;
        }
        .exam-card:hover { border-color: rgba(32,53,103,0.25); box-shadow: 0 4px 20px rgba(32,53,103,0.08); transform: translateY(-2px); }

        .promo-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
        @media(min-width: 768px) { .promo-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      {/* ── JSON-LD WebApplication ───────────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "AP Physics 1 Score Calculator",
        "description": "Free AP Physics 1 score calculator for 2026. Enter your multiple choice and free response scores to instantly calculate your composite score and predicted AP score of 1–5.",
        "url": "https://lunora.app/tools/ap-physics-1-score-calculator",
        "applicationCategory": "EducationApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" },
      })}} />

      {/* ── JSON-LD FAQPage ──────────────────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "How is the AP Physics 1 exam scored?", "acceptedAnswer": { "@type": "Answer", "text": "AP Physics 1 has two sections. Section 1 is 45 multiple choice questions worth 50% of your score. Section 2 is 5 free response questions worth 50%. Raw scores convert to a composite out of 100, which maps to an AP score of 1–5." } },
          { "@type": "Question", "name": "What composite score do I need for a 5 on AP Physics 1?", "acceptedAnswer": { "@type": "Answer", "text": "You generally need a composite score of approximately 70 or above to earn a 5 on AP Physics 1. It has one of the lowest 5-rates of any AP exam — typically just 5–8% of students." } },
          { "@type": "Question", "name": "Is AP Physics 1 the hardest AP exam?", "acceptedAnswer": { "@type": "Answer", "text": "AP Physics 1 consistently has one of the lowest pass rates and 5-rates of all AP exams. Its emphasis on conceptual reasoning, experimental design, and mathematical derivation — rather than memorisation — makes it uniquely challenging." } },
          { "@type": "Question", "name": "How many free response questions are on AP Physics 1?", "acceptedAnswer": { "@type": "Answer", "text": "AP Physics 1 has 5 free response questions: 2 long (experimental design 15 pts, quantitative argument 12 pts) and 3 short (10, 7, 6 pts). Total FRQ raw score is 50 points." } },
        ],
      })}} />

      {/* ── NAV ─────────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,1)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(32,53,103,0.08)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 120, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}><LunoraLogo size="sm" /></Link>
          <div className="hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Link href="/#features"     className="nav-link">Features</Link>
            <Link href="/#how-it-works" className="nav-link">How it works</Link>
            <Link href="/#faq"          className="nav-link">FAQ</Link>
          </div>
          <Link href="/signin" className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ padding: "160px 24px 56px", background: "linear-gradient(180deg,#f8f9fd 0%,#fff 100%)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="tag-pill">
              <Atom size={11} color="#203567" strokeWidth={2.5} />
              Free Tool · 2026
            </div>
          </div>
          <h1 style={{ fontSize: "clamp(32px,5.5vw,58px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
            AP Physics 1{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>
              Score Calculator
            </span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 20px" }}>
            Enter your <strong style={{ color: "#1a1a1a" }}>Multiple Choice</strong> and <strong style={{ color: "#1a1a1a" }}>Free Response</strong> scores to instantly see your predicted AP score of 1–5 and composite out of 100.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {[
              { Icon: CheckCircle, text: "2026 scoring formula" },
              { Icon: History,     text: "Saves your attempts"  },
              { Icon: Target,      text: "Instant prediction"   },
            ].map(({ Icon, text }, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}>
                <Icon size={13} color="#28a745" strokeWidth={2} /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CALCULATOR ──────────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div className="calc-grid">

          {/* ── LEFT: Inputs ────────────────────────────────────────────── */}
          <div>

            {/* Section 1 — MCQ */}
            <div className="score-card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BarChart2 size={17} color="#203567" strokeWidth={2} />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Section 1: Multiple Choice</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>45 questions (40 single-select + 5 multi-select) · 50% of total score · 1h 35min</p>
                </div>
              </div>
              <ScoreSlider label="Multiple Choice Score" sublabel="no guessing penalty" value={mcq} max={MCQ_TOTAL} onChange={setMcq} color="#203567" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>MCQ contributes to composite</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>{mcqComponent} / 50</span>
              </div>
            </div>

            {/* Section 2 — FRQ */}
            <div className="score-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen size={17} color="#203567" strokeWidth={2} />
                </div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Section 2: Free Response</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>5 questions · 50% of total score · 1h 50min</p>
                </div>
              </div>

              {/* Long FRQ */}
              <div style={{ marginTop: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase" }}>Long Free Response</span>
                  <span style={{ fontSize: 11, color: "#bbb" }}>2 questions</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {FRQ_CONFIG.filter(q => q.type === "long").map((q, i) => (
                    <ScoreSlider key={i} label={`Question ${i + 1}`} sublabel={`${q.label.toLowerCase()} · /${q.max}`} value={frq[i]} max={q.max} onChange={v => updateFrq(i, v)} color="#4a7cc7" />
                  ))}
                </div>
              </div>

              {/* Short FRQ */}
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #f0f3fa" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase" }}>Short Free Response</span>
                  <span style={{ fontSize: 11, color: "#bbb" }}>3 questions · varying points</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                  {FRQ_CONFIG.filter(q => q.type === "short").map((q, i) => (
                    <ScoreSlider key={i + 2} label={`Question ${i + 3}`} sublabel={`${q.label.toLowerCase()} · /${q.max}`} value={frq[i + 2]} max={q.max} onChange={v => updateFrq(i + 2, v)} color="#4a7cc7" />
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>FRQ raw total ({frqRaw}/{FRQ_TOTAL_RAW}) contributes</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>{frqComponent} / 50</span>
              </div>

              {/* Reset + Save */}
              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button
                  onClick={handleReset}
                  style={{ flex: 1, padding: "11px", border: "1.5px solid #eef0f8", borderRadius: 12, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#888", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "border-color 0.2s, color 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#203567"; (e.currentTarget as HTMLButtonElement).style.color = "#203567"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#eef0f8"; (e.currentTarget as HTMLButtonElement).style.color = "#888"; }}
                >
                  <RotateCcw size={13} strokeWidth={2} /> Reset all
                </button>
                <button onClick={handleSave} className="btn-primary" style={{ flex: 2, padding: "11px", fontSize: 13 }}>
                  {justSaved ? <><CheckCircle size={14} />Saved!</> : <><History size={14} />Save this attempt</>}
                </button>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Result Panel ──────────────────────────────────────── */}
          <div>
            <div style={{ borderRadius: 24, background: scoreBg, border: `2px solid ${scoreColor}22`, padding: "32px 28px", marginBottom: 20, textAlign: "center", position: "sticky", top: 140 }}>
              <div style={{ marginBottom: 8 }}><ScoreGauge composite={composite} /></div>

              {/* AP Score badge */}
              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "18px 32px", borderRadius: 16, background: "white", border: `2px solid ${scoreColor}33`, marginBottom: 16, minWidth: 160 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>AP Score</span>
                <span style={{ fontSize: 72, fontWeight: 800, color: scoreColor, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>{apScore}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor, marginTop: 4 }}>{getScoreLabel(apScore)}</span>
              </div>

              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, marginBottom: 20, maxWidth: 280, margin: "0 auto 20px" }}>
                {getScoreMessage(apScore)}
              </p>

              {/* Thresholds */}
              <div style={{ borderRadius: 14, border: "1.5px solid #eef0f8", overflow: "hidden", background: "white", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", background: "#f8f9fd", borderBottom: "1px solid #eef0f8" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase" }}>Score Thresholds</span>
                </div>
                {AP_SCORE_BREAKPOINTS.slice().reverse().map(({ score }) => {
                  const isActive = apScore === score;
                  const c = getScoreColor(score);
                  return (
                    <div key={score} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f0f3fa", background: isActive ? getScoreBg(score) : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: c }}>{score}</span>
                        </div>
                        <span style={{ fontSize: 12, color: "#666" }}>{getScoreLabel(score)}</span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: isActive ? c : "#bbb" }}>{getThresholdRange(score)}</span>
                    </div>
                  );
                })}
              </div>

              {/* Breakdown */}
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Score Breakdown</span>
                <BreakdownBar label="Multiple Choice" score={mcq} max={MCQ_TOTAL} color="#203567" />
                {FRQ_CONFIG.map((q, i) => (
                  <BreakdownBar key={i} label={`FRQ Q${i + 1}`} score={frq[i]} max={q.max} color="#4a7cc7" />
                ))}
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f3fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>Composite Score</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor }}>{composite}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Saved Attempts ─────────────────────────────────────────────── */}
        {savedAttempts.length > 0 && (
          <div style={{ maxWidth: 1100, margin: "32px auto 0" }}>
            <button
              onClick={() => setShowHistory(h => !h)}
              style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" }}
            >
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <History size={15} color="#203567" strokeWidth={2} />
              </div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Saved Attempts</span>
              <span style={{ fontSize: 12, color: "#aaa", background: "#f0f3fa", padding: "2px 10px", borderRadius: 100, fontWeight: 600 }}>{savedAttempts.length}</span>
              <ChevronDown size={16} color="#888" style={{ transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
            </button>
            {showHistory && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }} className="fade-up">
                {[...savedAttempts].sort((a, b) => b.savedAt - a.savedAt).map(a => {
                  const c = getScoreColor(a.apScore);
                  return (
                    <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: 12, border: "1.5px solid #eef0f8", background: "white" }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: getScoreBg(a.apScore), display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontSize: 18, fontWeight: 800, color: c, lineHeight: 1 }}>{a.apScore}</span>
                        <span style={{ fontSize: 9, color: c, fontWeight: 600 }}>AP</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{a.composite}/100</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>MCQ {a.mcq}/{MCQ_TOTAL} · FRQ {a.frq.reduce((x, y) => x + y, 0)}/{FRQ_TOTAL_RAW}</div>
                        <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>{a.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => loadAttemptIntoCalc(a)} style={{ padding: "6px 12px", border: "1.5px solid #eef0f8", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>Load</button>
                        <button onClick={() => handleDelete(a.id)} style={{ padding: 6, border: "none", background: "none", cursor: "pointer", color: "#ddd", display: "flex" }}
                          onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c83232"}
                          onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── HOW IT'S CALCULATED ─────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div className="tag-pill"><Info size={11} strokeWidth={2.5} />Scoring Guide</div>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>
              How the AP Physics 1 score is calculated
            </h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 500, margin: "0 auto" }}>
              Physics 1 is graded differently from most AP exams — understanding the weighting is key to knowing where to spend your prep time.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              {
                Icon: BarChart2, color: "#203567",
                title: "Section 1: MCQ",   sub: "50% of total score",
                body:  "45 multiple choice questions in 1h 35min. 40 are single-select, 5 are multi-select. Each question is worth the same regardless of type. No penalty for wrong answers.",
                formula: "MCQ / 45 × 50",
              },
              {
                Icon: BookOpen, color: "#4a7cc7",
                title: "Section 2: FRQ",   sub: "50% of total score",
                body:  "5 questions in 1h 50min. Q1 = 15 pts (experimental design), Q2 = 12 pts (quantitative argument), Q3 = 10 pts, Q4 = 7 pts, Q5 = 6 pts. Total raw = 50 pts.",
                formula: "FRQ_raw / 50 × 50",
              },
              {
                Icon: Target,   color: "#2d6e9e",
                title: "Composite Score",  sub: "out of 100",
                body:  "Both section components add up to your composite score out of 100. This is the number that directly determines your AP score of 1–5.",
                formula: "MCQ_pts + FRQ_pts",
              },
              {
                Icon: Trophy,   color: "#1a7a4a",
                title: "AP Score",         sub: "1–5",
                body:  "Composite ≥70 → 5 · ≥55 → 4 · ≥38 → 3 · ≥23 → 2 · below → 1. Physics 1 has one of the strictest 5-thresholds of any AP — only ~5–8% of students reach it.",
                formula: "composite → 1–5",
              },
            ].map(({ Icon, color, title, sub, body, formula }, i) => (
              <div key={i} className="score-card" style={{ padding: "24px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={19} color={color} strokeWidth={1.75} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, opacity: 0.8 }}>{sub}</div>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.65, marginBottom: 12 }}>{body}</p>
                <div style={{ padding: "6px 12px", background: `${color}08`, borderRadius: 8, fontFamily: "monospace", fontSize: 12, color, fontWeight: 700 }}>{formula}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LUNORA PROMO ────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }} className="promo-grid">
          <div>
            <div style={{ display: "flex", marginBottom: 20 }}><LunoraLogo light size="sm" /></div>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, color: "white", lineHeight: 1.2, letterSpacing: "-0.025em", marginBottom: 16 }}>
              Now you know your target — time to{" "}
              <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>actually reach it.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 28 }}>
              AP Physics 1 is one of the hardest exams to score a 5 on — not because the content is impossible, but because most students review instead of practice. Upload your Physics 1 notes, textbook chapters, or lecture videos into Lunora and get unlimited targeted practice questions until Newton's laws, energy conservation, and rotational dynamics are second nature.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
              Try Lunora for AP Physics — Free
              <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
            </Link>
            <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>No credit card needed</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { Icon: Sparkles,   title: "Unlimited AP Physics questions",  body: "Generate as many practice questions as you need from your own notes, past FRQs, or any study material — free." },
              { Icon: Brain,      title: "Deep-dive on weak concepts",      body: "Struggling with torque or simple harmonic motion? Get instant flashcards, concept summaries, and mini quizzes on that exact topic." },
              { Icon: TrendingUp, title: "Track mastery per unit",          body: "See best score, average score, and subtopic breakdown across every quiz attempt. Know exactly where you're improving." },
              { Icon: Clock,      title: "Short daily sessions that work",  body: "Built for busy students. Focused, tracked sessions move your score measurably forward — even in 15 minutes a day." },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={15} color="white" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OTHER AP CALCULATORS ────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div className="tag-pill"><Atom size={11} strokeWidth={2.5} />More AP Calculators</div>
            </div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em" }}>
              Calculate scores for other AP exams
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {otherExams.map(({ name, href }) => (
              <Link key={name} href={href} className="exam-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Atom size={13} color="#203567" strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a", lineHeight: 1.3 }}>{name}</div>
                    <div style={{ fontSize: 11, color: "#aaa", marginTop: 1 }}>Score Calculator</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
              <div className="tag-pill">FAQ</div>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#203567", letterSpacing: "-0.025em" }}>
              AP Physics 1 Score Calculator FAQ
            </h2>
            <p style={{ fontSize: 15, color: "#8899bb", marginTop: 10 }}>
              Everything you need to know about how AP Physics 1 is scored.
            </p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
            Stop estimating. Start mastering.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>
            Turn your AP Physics 1 notes and videos into unlimited practice questions. Track your progress to a 5.
          </p>
          <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", color: "#203567", fontWeight: 800, fontSize: 16, padding: "16px 40px", borderRadius: 100, textDecoration: "none" }}>
            Start learning free
            <ArrowRight size={16} color="#203567" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer style={{ background: "#16254a", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <LunoraLogo light size="sm" />
          <div style={{ display: "flex", gap: 28 }}>
            <Link href="/privacy-policy"       style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms-and-conditions"  style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Terms</Link>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            © 2026 Lunora. All rights reserved.
          </p>
        </div>
      </footer>

    </div>
  );
}