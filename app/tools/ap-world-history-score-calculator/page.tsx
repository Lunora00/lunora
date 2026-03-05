"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, BarChart2, Brain, BookOpen,
  ChevronDown, Trash2, History,
  CheckCircle, Sparkles,
  Trophy, Target, TrendingUp, Clock,
  ArrowRight, RotateCcw, Info, Globe,
} from "lucide-react";

// ─── AP World History: Modern 2026 Scoring ────────────────────────────────
// Section 1: 55 MCQ + 3 SAQ → 60% of composite
//   Part A: 55 MCQ · 55 min · 40% of composite
//   Part B: 3 SAQ · 40 min · 20% of composite
//     SAQ 1: /3  (required — periods 1–6, with primary or secondary source)
//     SAQ 2: /3  (required — periods 1–6, no source)
//     SAQ 3 OR 4: /3  (student choice — periods 1–3 OR periods 4–6)
//   Total SAQ raw = 9 pts
// Section 2: 1 DBQ + 1 LEQ → 40% of composite
//   Part A: 1 DBQ · 60 min (recommended) · 25% of composite  /7
//   Part B: 1 LEQ (choice of 3) · 40 min (recommended) · 15% of composite  /6
// Composite formula:
//   MCQ component  = (MCQ/55) × 40
//   SAQ component  = (SAQ_raw/9) × 20
//   DBQ component  = (DBQ/7) × 25
//   LEQ component  = (LEQ/6) × 15
//   Composite = MCQ_pts + SAQ_pts + DBQ_pts + LEQ_pts → /100
// AP Score thresholds (approximate, College Board 2024–2025 data)
// APWH has a moderate 5 rate (~15–17%) and passing rate (~55–60%)
const AP_SCORE_BREAKPOINTS = [
  { min: 72, score: 5 },
  { min: 58, score: 4 },
  { min: 42, score: 3 },
  { min: 28, score: 2 },
  { min: 0,  score: 1 },
];

const MCQ_TOTAL = 55;
const SAQ_TOTAL = 9;
const DBQ_MAX   = 7;
const LEQ_MAX   = 6;

function calcComposite(mcq: number, saq: number, dbq: number, leq: number): number {
  const mcqPts = (mcq / MCQ_TOTAL) * 40;
  const saqPts = (saq / SAQ_TOTAL) * 20;
  const dbqPts = (dbq / DBQ_MAX)   * 25;
  const leqPts = (leq / LEQ_MAX)   * 15;
  return Math.round((mcqPts + saqPts + dbqPts + leqPts) * 10) / 10;
}
function calcAPScore(composite: number): number {
  for (const bp of AP_SCORE_BREAKPOINTS) if (composite >= bp.min) return bp.score;
  return 1;
}
function getScoreLabel(score: number): string {
  return ({ 5: "Extremely well qualified", 4: "Well qualified", 3: "Qualified", 2: "Possibly qualified", 1: "No recommendation" } as Record<number, string>)[score] ?? "";
}
function getScoreColor(score: number): string {
  return ({ 5: "#1a7a4a", 4: "#2d6e9e", 3: "#8a6a00", 2: "#b84e00", 1: "#c83232" } as Record<number, string>)[score] ?? "#888";
}
function getScoreBg(score: number): string {
  return ({ 5: "rgba(26,122,74,0.08)", 4: "rgba(45,110,158,0.08)", 3: "rgba(138,106,0,0.08)", 2: "rgba(184,78,0,0.08)", 1: "rgba(200,50,50,0.08)" } as Record<number, string>)[score] ?? "rgba(0,0,0,0.04)";
}
function getScoreMessage(score: number): string {
  return ({
    5: "Outstanding — you've mastered world history argumentation across civilizations, trade networks, and global transformations.",
    4: "Strong result. A 4 on AP World History demonstrates real command of historical thinking across six periods and multiple regions.",
    3: "You're in qualifying territory. Sharpen your DBQ sourcing and LEQ complexity to push into a 4.",
    2: "You're building the foundation. Focus on your DBQ argument structure and SAQ contextualization to move up fast.",
    1: "Don't be discouraged. Consistent daily practice on APWH historical thinking skills will turn this around.",
  } as Record<number, string>)[score] ?? "";
}
function getThresholdRange(score: number): string {
  return ({ 5: "≥72", 4: "58–71", 3: "42–57", 2: "28–41", 1: "0–27" } as Record<number, string>)[score] ?? "";
}

interface SavedAttempt {
  id: string; mcq: number; saq: number; dbq: number; leq: number;
  composite: number; apScore: number; savedAt: number; label: string;
}
const DB_NAME = "lunora_ap_apwh"; const DB_VERSION = 1; const STORE = "attempts";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
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

function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const svgSizes = { sm: 90, md: 120, lg: 140 }; const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size]; const ts = textSizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
      <svg viewBox="0 0 100 100" style={{ width: s, height: s, transform: "rotate(40deg)", flexShrink: 0 }}>
        <defs>
          <mask id={`lm-${light ? "l" : "d"}`}>
            <rect width="100" height="100" fill="white" />
            <circle cx="57" cy="50" r="40" fill="black" />
          </mask>
        </defs>
        <circle cx="50" cy="50" r="42" fill={light ? "white" : "#203567"} mask={`url(#lm-${light ? "l" : "d"})`} />
      </svg>
      <span style={{ fontSize: ts, fontWeight: 300, letterSpacing: "0.12em", color: light ? "white" : "#1a1a1a", marginLeft: -60, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>lunora</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #eef0f8" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#203567", paddingRight: 16, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: "#203567", transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}><ChevronDown size={18} /></span>
      </button>
      <div style={{ maxHeight: open ? 400 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s" }}>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.75, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

function ScoreGauge({ composite }: { composite: number }) {
  const apScore = calcAPScore(composite); const color = getScoreColor(apScore);
  const pct = Math.min(composite / 100, 1); const r = 54; const circ = 2 * Math.PI * r;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width={140} height={100} viewBox="0 0 140 110">
        <circle cx="70" cy="80" r={r} fill="none" stroke="#eef0f8" strokeWidth={10} strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(-225 70 80)" />
        <circle cx="70" cy="80" r={r} fill="none" stroke={color} strokeWidth={10} strokeDasharray={`${circ * 0.75 * pct} ${circ * (1 - 0.75 * pct)}`} strokeDashoffset={circ * 0.125} strokeLinecap="round" transform="rotate(-225 70 80)" style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)" }} />
        <text x="70" y="76" textAnchor="middle" fill={color} fontSize="28" fontWeight="800" fontFamily="DM Sans, sans-serif">{composite.toFixed(1)}</text>
        <text x="70" y="92" textAnchor="middle" fill="#aaa" fontSize="10" fontFamily="DM Sans, sans-serif">out of 100</text>
      </svg>
    </div>
  );
}

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
          <input type="number" min={0} max={max} value={value} onChange={e => { const v = Math.max(0, Math.min(max, Number(e.target.value))); onChange(isNaN(v) ? 0 : v); }} style={{ width: 52, padding: "4px 8px", border: "1.5px solid #eef0f8", borderRadius: 8, fontSize: 15, fontWeight: 800, color, textAlign: "center", fontFamily: "'DM Sans', sans-serif", outline: "none", background: "white" }} />
          <span style={{ fontSize: 13, color: "#aaa", fontWeight: 500 }}>/ {max}</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 6, borderRadius: 100, background: "#eef0f8", cursor: "pointer" }} onClick={e => { const rect = e.currentTarget.getBoundingClientRect(); onChange(Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * max)); }}>
        <div style={{ position: "absolute", left: 0, top: 0, height: "100%", borderRadius: 100, background: color, width: `${pct}%`, transition: "width 0.15s ease" }} />
        <input type="range" min={0} max={max} value={value} onChange={e => onChange(Number(e.target.value))} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", margin: 0 }} />
      </div>
    </div>
  );
}

function BreakdownBar({ label, score, max, color, pts }: { label: string; score: number; max: number; color: string; pts: number }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: "#888", fontWeight: 500, width: 96, flexShrink: 0, lineHeight: 1.3 }}>{label}</span>
      <div style={{ flex: 1, height: 8, background: "#eef0f8", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", background: color, width: `${pct}%`, borderRadius: 100, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 52, textAlign: "right", flexShrink: 0 }}>{pts.toFixed(1)}</span>
    </div>
  );
}

export default function APWorldHistoryScoreCalculator() {
  const [mcq, setMcq] = useState(35);
  const [saq, setSaq] = useState(6);
  const [dbq, setDbq] = useState(5);
  const [leq, setLeq] = useState(4);
  const [savedAttempts, setSavedAttempts] = useState<SavedAttempt[]>([]);
  const [justSaved, setJustSaved]         = useState(false);
  const [showHistory, setShowHistory]     = useState(false);
  const [scrolled, setScrolled]           = useState(false);

  const composite  = calcComposite(mcq, saq, dbq, leq);
  const apScore    = calcAPScore(composite);
  const scoreColor = getScoreColor(apScore);
  const scoreBg    = getScoreBg(apScore);

  const mcqPts = Math.round((mcq / MCQ_TOTAL) * 40 * 10) / 10;
  const saqPts = Math.round((saq / SAQ_TOTAL) * 20 * 10) / 10;
  const dbqPts = Math.round((dbq / DBQ_MAX)   * 25 * 10) / 10;
  const leqPts = Math.round((leq / LEQ_MAX)   * 15 * 10) / 10;

  useEffect(() => {
    loadAttempts().then(setSavedAttempts);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleSave = async () => {
    const attempt: SavedAttempt = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      mcq, saq, dbq, leq, composite, apScore, savedAt: Date.now(),
      label: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    };
    await saveAttempt(attempt); setSavedAttempts(await loadAttempts());
    setJustSaved(true); setShowHistory(true); setTimeout(() => setJustSaved(false), 2200);
  };
  const handleDelete = async (id: string) => { await deleteAttempt(id); setSavedAttempts(await loadAttempts()); };
  const handleReset  = () => { setMcq(0); setSaq(0); setDbq(0); setLeq(0); };
  const loadAttemptIntoCalc = (a: SavedAttempt) => {
    setMcq(a.mcq); setSaq(a.saq); setDbq(a.dbq); setLeq(a.leq);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const faqs = [
    {
      q: "How is the AP World History: Modern exam scored in 2026?",
      a: "The AP World History: Modern exam has two sections. Section 1 (95 minutes, 60% of composite) is split into Part A — 55 multiple choice questions worth 40% of your score — and Part B — 3 short answer questions worth 20%. Section 2 (100 minutes, 40% of composite) is split into Part A — 1 document-based question worth 25% — and Part B — 1 long essay question chosen from three options worth 15%. The DBQ is scored out of 7 and the LEQ out of 6. All scores convert to a composite out of 100, which maps to an AP score of 1–5.",
    },
    {
      q: "What composite score do I need for a 5 on AP World History?",
      a: "Based on recent College Board score distributions, you generally need a composite score of approximately 72 or above to earn a 5 on AP World History: Modern. About 15–17% of test takers score a 5 each year. The essays — particularly the DBQ — are the primary differentiators between a 3 and a 5. Students who master HAPP sourcing and the complexity point consistently outperform those who focus only on content knowledge.",
    },
    {
      q: "What composite score do I need for a 3 on AP World History?",
      a: "A composite score of approximately 42 or above typically earns a 3 on AP World History: Modern. About 55–60% of test takers earn a 3 or higher. The most common path to a 3 is solid MCQ performance with partial credit on essays — moving to a 4 or 5 requires mastering the full DBQ rubric, especially contextualization and the complexity point.",
    },
    {
      q: "How is the AP World History DBQ scored?",
      a: "The Document-Based Question is scored out of 7 points. 1 point for thesis (a historically defensible claim that establishes a line of reasoning — not just a restatement of the prompt). 1 point for contextualization (a developed explanation of the broader historical context that is relevant to the prompt — must be more than a phrase or reference). Up to 3 points for evidence: 1 for accurately describing content from at least 3 documents, 2 for using document content to support an argument, and 1 additional point for sourcing at least 3 documents using HAPP (Historical context, Audience, Purpose, or Point of view). 1 point for demonstrating a complex understanding of the topic. The DBQ accounts for 25% of your composite score.",
    },
    {
      q: "How is the AP World History LEQ scored?",
      a: "The Long Essay Question is scored out of 6 points. 1 point for thesis. 1 point for contextualization. Up to 2 points for evidence (1 for specific examples, 2 for using evidence to support an argument). 1 point for demonstrating a historical reasoning skill (comparison, causation, or continuity and change over time). 1 point for demonstrating a complex understanding. The LEQ accounts for 15% of your composite score. You choose one of three prompts — all test the same historical reasoning skills across different time periods.",
    },
    {
      q: "What time periods does AP World History: Modern cover?",
      a: "AP World History: Modern covers six periods: Period 1 (1200–1450) — networks of exchange and the Mongol Empire; Period 2 (1450–1750) — European exploration, the Columbian Exchange, the Atlantic slave trade, and land-based empires; Period 3 (1750–1900) — industrialization, imperialism, revolutions, and nationalism; Period 4 (1900–1945) — World War I, the Great Depression, World War II, and decolonization; Period 5 (1945–1980) — Cold War, decolonization movements, and global economic changes; Period 6 (1980–present) — globalization, technology, and contemporary global issues. Periods 3 and 4 receive the highest emphasis.",
    },
    {
      q: "What is the difference between AP World History and AP US History?",
      a: "AP World History: Modern and AP US History share the exact same exam structure — 55 MCQ, 3 SAQ, 1 DBQ, 1 LEQ — and use the same scoring formula and rubrics. The difference is scope: APUSH covers American history across nine periods (1491–present), while APWH covers global history across six periods (1200–present). APWH requires broader geographic and cultural knowledge — you need to analyze events across Africa, Asia, the Americas, Europe, and the Middle East simultaneously. Both exams test the same historical thinking skills: causation, comparison, continuity and change over time, and contextualization.",
    },
    {
      q: "How can I improve my AP World History score?",
      a: "Focus on the DBQ first — it's worth 25% of your composite and most students score 4–5 out of 7 when they could score 6–7 with better HAPP sourcing and a genuine complexity argument. For HAPP sourcing, practice identifying how the author's audience, purpose, historical context, or point of view explains why the document says what it says — not just what it says. For contextualization, write a full paragraph of developed context before your thesis, not just a one-sentence mention. For the LEQ, choose the prompt where your evidence is strongest and pre-plan at least four specific historical examples before writing. Use tools like Lunora to generate unlimited APWH practice questions from your notes organized by period and region.",
    },
  ];

  const otherExams = [
    { name: "AP US History",        href: "/tools/ap-us-history-score-calculator"           },
    { name: "AP Euro History",      href: "/tools/ap-european-history-score-calculator"     },
    { name: "AP Gov & Politics",    href: "/tools/ap-us-government-score-calculator"        },
    { name: "AP Psychology",        href: "/tools/ap-psychology-score-calculator"           },
    { name: "AP Macroeconomics",    href: "/tools/ap-macroeconomics-score-calculator"       },
    { name: "AP Human Geography",   href: "/tools/ap-human-geography-score-calculator"      },
    { name: "AP English Lang",      href: "/tools/ap-english-language-score-calculator"     },
    { name: "AP English Lit",       href: "/tools/ap-english-literature-score-calculator"   },
    { name: "AP Biology",           href: "/tools/ap-biology-score-calculator"              },
    { name: "AP Chemistry",         href: "/tools/ap-chemistry-score-calculator"            },
    { name: "AP Env. Science",      href: "/tools/ap-environmental-science-score-calculator" },
    { name: "AP Statistics",        href: "/tools/ap-statistics-score-calculator"           },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }
        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; font-family: 'DM Sans', sans-serif; position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1.5px; background: #203567; transition: width 0.25s; }
        .nav-link:hover { color: #203567; } .nav-link:hover::after { width: 100%; }
        .btn-primary { background: #203567; color: white; border: none; border-radius: 100px; padding: 14px 32px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
        .btn-primary:hover { background: #162a54; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(32,53,103,0.3); }
        .tag-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 100px; background: rgba(32,53,103,0.07); border: 1px solid rgba(32,53,103,0.12); font-size: 11px; font-weight: 700; color: #203567; letter-spacing: 0.08em; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }
        .score-card { border-radius: 20px; border: 1.5px solid #eef0f8; background: white; padding: 28px; transition: box-shadow 0.2s, transform 0.2s; }
        .score-card:hover { box-shadow: 0 8px 32px rgba(32,53,103,0.09); transform: translateY(-2px); }
        .calc-grid { display: grid; grid-template-columns: 1fr 380px; gap: 32px; max-width: 1100px; margin: 0 auto; align-items: start; }
        @media(max-width: 900px) { .calc-grid { grid-template-columns: 1fr; } }
        .hide-mobile { display: none !important; }
        @media(min-width: 769px) { .hide-mobile { display: flex !important; } }
        input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        input[type=number] { -moz-appearance: textfield; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }
        .exam-card { padding: 16px 18px; border-radius: 14px; border: 1.5px solid #eef0f8; background: #fafbfd; transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; cursor: pointer; text-decoration: none; display: block; }
        .exam-card:hover { border-color: rgba(32,53,103,0.25); box-shadow: 0 4px 20px rgba(32,53,103,0.08); transform: translateY(-2px); }
        .promo-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
        @media(min-width: 768px) { .promo-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", "name": "AP World History Score Calculator", "description": "Free AP World History: Modern score calculator for 2026. Enter your MCQ, SAQ, DBQ, and LEQ scores to instantly calculate your composite score and predicted AP score of 1–5.", "url": "https://lunora.app/tools/ap-world-history-score-calculator", "applicationCategory": "EducationApplication", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" } }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [ { "@type": "Question", "name": "How is the AP World History exam scored?", "acceptedAnswer": { "@type": "Answer", "text": "AP World History has two sections. Section 1 (60% of composite): 55 MCQ worth 40% and 3 SAQs worth 20%. Section 2 (40% of composite): 1 DBQ worth 25% (out of 7) and 1 LEQ worth 15% (out of 6). All scores convert to a composite out of 100, then to an AP score of 1–5." } }, { "@type": "Question", "name": "What composite score do I need for a 5 on AP World History?", "acceptedAnswer": { "@type": "Answer", "text": "You generally need a composite score of approximately 72 or above to earn a 5 on AP World History: Modern. About 15–17% of students score a 5 each year." } }, { "@type": "Question", "name": "How is the AP World History DBQ scored?", "acceptedAnswer": { "@type": "Answer", "text": "The DBQ is scored out of 7: 1 for thesis, 1 for contextualization, up to 3 for evidence and HAPP sourcing, and 1 for complexity. It counts for 25% of your composite." } }, { "@type": "Question", "name": "What time periods does AP World History cover?", "acceptedAnswer": { "@type": "Answer", "text": "AP World History: Modern covers six periods from 1200 to the present: Period 1 (1200–1450), Period 2 (1450–1750), Period 3 (1750–1900), Period 4 (1900–1945), Period 5 (1945–1980), and Period 6 (1980–present). Periods 3 and 4 receive the highest emphasis." } }, { "@type": "Question", "name": "What is the difference between AP World History and AP US History?", "acceptedAnswer": { "@type": "Answer", "text": "Both exams share the same structure (55 MCQ, 3 SAQ, 1 DBQ, 1 LEQ) and rubrics. AP World History covers global history across six periods (1200–present), while AP US History covers American history across nine periods (1491–present)." } } ] }) }} />

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,1)", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: scrolled ? "1px solid rgba(32,53,103,0.08)" : "1px solid transparent", transition: "all 0.3s ease" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 120, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}><LunoraLogo size="sm" /></Link>
          <div className="hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Link href="/#features" className="nav-link">Features</Link>
            <Link href="/#how-it-works" className="nav-link">How it works</Link>
            <Link href="/#faq" className="nav-link">FAQ</Link>
          </div>
          <Link href="/signin" className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>Get Started</Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "160px 24px 56px", background: "linear-gradient(180deg,#f8f9fd 0%,#fff 100%)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="tag-pill"><Zap size={11} color="#203567" strokeWidth={2.5} />Free Tool · 2026</div>
          </div>
          <h1 style={{ fontSize: "clamp(32px,5.5vw,58px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
            AP World History{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>Score Calculator</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 20px" }}>
            Enter your <strong style={{ color: "#1a1a1a" }}>MCQ</strong>, <strong style={{ color: "#1a1a1a" }}>SAQ</strong>, <strong style={{ color: "#1a1a1a" }}>DBQ</strong>, and <strong style={{ color: "#1a1a1a" }}>LEQ</strong> scores to instantly see your predicted AP score of 1–5 and composite out of 100.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 20, flexWrap: "wrap" }}>
            {[{ Icon: CheckCircle, text: "2026 scoring formula" }, { Icon: History, text: "Saves your attempts" }, { Icon: Target, text: "Instant prediction" }].map(({ Icon, text }, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}><Icon size={13} color="#28a745" strokeWidth={2} /> {text}</span>
            ))}
          </div>
        </div>
      </section>

      {/* CALCULATOR */}
      <section style={{ padding: "0 24px 80px" }}>
        <div className="calc-grid">
          <div>

            {/* SECTION 1 LABEL */}
            <div style={{ marginBottom: 10, paddingLeft: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.1em", textTransform: "uppercase" }}>Section 1 · 60% of composite · 95 min</span>
            </div>

            {/* MCQ */}
            <div className="score-card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BarChart2 size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Part A: Multiple Choice</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>55 questions · <strong style={{ color: "#203567" }}>40%</strong> of composite · 55 min · stimulus-based sets</p>
                </div>
              </div>
              <ScoreSlider label="Multiple Choice Score" sublabel="no guessing penalty" value={mcq} max={MCQ_TOTAL} onChange={setMcq} color="#203567" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>MCQ contributes to composite (40% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>{mcqPts} / 40</span>
              </div>
            </div>

            {/* SAQ */}
            <div className="score-card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Part B: Short Answer Questions</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>3 questions · 3 pts each · <strong style={{ color: "#203567" }}>20%</strong> of composite · 40 min · no thesis required</p>
                </div>
              </div>
              <div style={{ marginBottom: 14, padding: "11px 14px", background: "rgba(74,124,199,0.06)", borderRadius: 10, border: "1px solid rgba(74,124,199,0.15)" }}>
                <p style={{ fontSize: 12, color: "#4a7cc7", lineHeight: 1.6, margin: 0 }}>
                  <strong>Q1 & Q2 are required</strong> (Q1 uses a source; Q2 does not). <strong>Q3 OR Q4 is your choice</strong> — one covers periods 1–3, the other periods 4–6. Each part (a/b/c) is worth 1 point. No thesis needed; be specific and concise.
                </p>
              </div>
              <ScoreSlider label="SAQ Total Score" sublabel="3 questions × 3 pts" value={saq} max={SAQ_TOTAL} onChange={setSaq} color="#4a7cc7" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>SAQ contributes to composite (20% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#4a7cc7" }}>{saqPts} / 20</span>
              </div>
            </div>

            {/* SECTION 2 LABEL */}
            <div style={{ marginBottom: 10, paddingLeft: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.1em", textTransform: "uppercase" }}>Section 2 · 40% of composite · 100 min</span>
            </div>

            {/* DBQ */}
            <div className="score-card" style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Globe size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Part A: Document-Based Question</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>1 essay · 7 pts · <strong style={{ color: "#203567" }}>25%</strong> of composite · 60 min recommended</p>
                </div>
              </div>
              <div style={{ marginBottom: 16, padding: "11px 14px", background: "rgba(74,124,199,0.06)", borderRadius: 10, border: "1px solid rgba(74,124,199,0.15)" }}>
                <p style={{ fontSize: 12, color: "#4a7cc7", lineHeight: 1.6, margin: 0 }}>
                  <strong>Rubric: Thesis (1) · Contextualization (1) · Evidence & Sourcing (3) · Complexity (1).</strong> Source at least 3 documents using HAPP (Historical context, Audience, Purpose, Point of view) to earn the third evidence point.
                </p>
              </div>
              <ScoreSlider label="DBQ Score" sublabel="out of 7" value={dbq} max={DBQ_MAX} onChange={setDbq} color="#2d6e9e" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>DBQ contributes to composite (25% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#2d6e9e" }}>{dbqPts} / 25</span>
              </div>
            </div>

            {/* LEQ */}
            <div className="score-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Part B: Long Essay Question</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>1 essay (choice of 3) · 6 pts · <strong style={{ color: "#203567" }}>15%</strong> of composite · 40 min recommended</p>
                </div>
              </div>
              <div style={{ marginBottom: 16, padding: "11px 14px", background: "rgba(74,124,199,0.06)", borderRadius: 10, border: "1px solid rgba(74,124,199,0.15)" }}>
                <p style={{ fontSize: 12, color: "#4a7cc7", lineHeight: 1.6, margin: 0 }}>
                  <strong>Rubric: Thesis (1) · Contextualization (1) · Evidence (2) · Historical Reasoning Skill (1) · Complexity (1).</strong> All three prompts cover different periods — choose the one where your specific evidence is strongest.
                </p>
              </div>
              <ScoreSlider label="LEQ Score" sublabel="out of 6" value={leq} max={LEQ_MAX} onChange={setLeq} color="#4a7cc7" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>LEQ contributes to composite (15% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#4a7cc7" }}>{leqPts} / 15</span>
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button onClick={handleReset} style={{ flex: 1, padding: "11px", border: "1.5px solid #eef0f8", borderRadius: 12, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#888", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "border-color 0.2s, color 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#203567"; (e.currentTarget as HTMLButtonElement).style.color = "#203567"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#eef0f8"; (e.currentTarget as HTMLButtonElement).style.color = "#888"; }}>
                  <RotateCcw size={13} strokeWidth={2} /> Reset all
                </button>
                <button onClick={handleSave} className="btn-primary" style={{ flex: 2, padding: "11px", fontSize: 13 }}>
                  {justSaved ? <><CheckCircle size={14} />Saved!</> : <><History size={14} />Save this attempt</>}
                </button>
              </div>
            </div>
          </div>

          {/* Result Panel */}
          <div>
            <div style={{ borderRadius: 24, background: scoreBg, border: `2px solid ${scoreColor}22`, padding: "32px 28px", marginBottom: 20, textAlign: "center", position: "sticky", top: 140 }}>
              <div style={{ marginBottom: 8 }}><ScoreGauge composite={composite} /></div>
              <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", padding: "18px 32px", borderRadius: 16, background: "white", border: `2px solid ${scoreColor}33`, marginBottom: 16, minWidth: 160 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>AP Score</span>
                <span style={{ fontSize: 72, fontWeight: 800, color: scoreColor, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>{apScore}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: scoreColor, marginTop: 4 }}>{getScoreLabel(apScore)}</span>
              </div>
              <p style={{ fontSize: 14, color: "#555", lineHeight: 1.65, maxWidth: 280, margin: "0 auto 20px" }}>{getScoreMessage(apScore)}</p>

              {/* Thresholds */}
              <div style={{ borderRadius: 14, border: "1.5px solid #eef0f8", overflow: "hidden", background: "white", marginBottom: 20 }}>
                <div style={{ padding: "12px 16px", background: "#f8f9fd", borderBottom: "1px solid #eef0f8" }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase" }}>Score Thresholds</span>
                </div>
                {AP_SCORE_BREAKPOINTS.slice().reverse().map(({ score }) => {
                  const isActive = apScore === score; const c = getScoreColor(score);
                  return (
                    <div key={score} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #f0f3fa", background: isActive ? getScoreBg(score) : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 7, background: `${c}15`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 14, fontWeight: 800, color: c }}>{score}</span></div>
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
                <BreakdownBar label="MCQ (40%)" score={mcq} max={MCQ_TOTAL} color="#203567" pts={mcqPts} />
                <BreakdownBar label="SAQ (20%)" score={saq} max={SAQ_TOTAL} color="#4a7cc7" pts={saqPts} />
                <BreakdownBar label="DBQ (25%)" score={dbq} max={DBQ_MAX}   color="#2d6e9e" pts={dbqPts} />
                <BreakdownBar label="LEQ (15%)" score={leq} max={LEQ_MAX}   color="#4a7cc7" pts={leqPts} />
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #f0f3fa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a1a" }}>Composite Score</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: scoreColor }}>{composite}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Attempts */}
        {savedAttempts.length > 0 && (
          <div style={{ maxWidth: 1100, margin: "32px auto 0" }}>
            <button onClick={() => setShowHistory(h => !h)} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'DM Sans', sans-serif" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}><History size={15} color="#203567" strokeWidth={2} /></div>
              <span style={{ fontSize: 16, fontWeight: 700, color: "#1a1a1a" }}>Saved Attempts</span>
              <span style={{ fontSize: 12, color: "#aaa", background: "#f0f3fa", padding: "2px 10px", borderRadius: 100, fontWeight: 600 }}>{savedAttempts.length}</span>
              <ChevronDown size={16} color="#888" style={{ transform: showHistory ? "rotate(180deg)" : "none", transition: "transform 0.25s" }} />
            </button>
            {showHistory && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }} className="fade-up">
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
                        <div style={{ fontSize: 12, color: "#aaa" }}>MCQ {a.mcq}/{MCQ_TOTAL} · SAQ {a.saq}/{SAQ_TOTAL} · DBQ {a.dbq}/{DBQ_MAX} · LEQ {a.leq}/{LEQ_MAX}</div>
                        <div style={{ fontSize: 11, color: "#ccc", marginTop: 2 }}>{a.label}</div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button onClick={() => loadAttemptIntoCalc(a)} style={{ padding: "6px 12px", border: "1.5px solid #eef0f8", borderRadius: 8, background: "white", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#555", fontFamily: "'DM Sans', sans-serif" }}>Load</button>
                        <button onClick={() => handleDelete(a.id)} style={{ padding: 6, border: "none", background: "none", cursor: "pointer", color: "#ddd", display: "flex" }} onMouseEnter={e => (e.currentTarget as HTMLButtonElement).style.color = "#c83232"} onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.color = "#ddd"}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* HOW IT'S CALCULATED */}
      <section style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill"><Info size={11} strokeWidth={2.5} />Scoring Guide</div></div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>How the AP World History score is calculated</h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 540, margin: "0 auto" }}>Four components, each with a distinct weight — the DBQ alone accounts for 25% of your composite.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 20 }}>
            {[
              { Icon: BarChart2, color: "#203567", title: "MCQ (40%)", sub: "55 questions · 55 min", body: "Stimulus-based sets of 3–4 questions built around primary sources, secondary sources, maps, or images spanning all six APWH periods. Questions test historical thinking skills: causation, comparison, and continuity and change over time.", formula: "MCQ / 55 × 40" },
              { Icon: BookOpen, color: "#4a7cc7", title: "SAQ (20%)", sub: "3 questions · 40 min", body: "Three-part questions worth 3 pts each. Q1 uses a primary or secondary source; Q2 does not. Q3 or Q4 is student choice by time period. No thesis needed. Each part (a/b/c) earns 1 point for a specific, accurate response.", formula: "SAQ / 9 × 20" },
              { Icon: Globe, color: "#2d6e9e", title: "DBQ (25%)", sub: "1 essay · 7 pts · 60 min", body: "The highest-value single question. Requires a thesis, developed contextualization, use of at least 6 documents, HAPP sourcing on 3+ documents, outside evidence, and a complexity argument. Covers a topic from periods 1–6.", formula: "DBQ / 7 × 25" },
              { Icon: Trophy, color: "#1a7a4a", title: "LEQ (15%)", sub: "1 essay · 6 pts · 40 min", body: "Choose one of three prompts testing comparison, causation, or continuity and change over time across different APWH periods. Same rubric as the DBQ minus document requirements. Complexity earns the final point.", formula: "LEQ / 6 × 15" },
            ].map(({ Icon, color, title, sub, body, formula }, i) => (
              <div key={i} className="score-card" style={{ padding: "24px" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><Icon size={19} color={color} strokeWidth={1.75} /></div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "#1a1a1a", marginBottom: 2 }}>{title}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, opacity: 0.8 }}>{sub}</div>
                <p style={{ fontSize: 13, color: "#666", lineHeight: 1.65, marginBottom: 12 }}>{body}</p>
                <div style={{ padding: "6px 12px", background: `${color}08`, borderRadius: 8, fontFamily: "monospace", fontSize: 12, color, fontWeight: 700 }}>{formula}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROMO */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }} className="promo-grid">
          <div>
            <div style={{ display: "flex", marginBottom: 20 }}><LunoraLogo light size="sm" /></div>
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, color: "white", lineHeight: 1.2, letterSpacing: "-0.025em", marginBottom: 16 }}>
              Now you know your target — time to{" "}<span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>actually reach it.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 28 }}>
              AP World History covers 800 years of global history across six periods and every inhabited continent — the breadth alone is daunting. Most students lose points not because they don't know the content, but because their DBQ contextualization is a single sentence instead of a developed paragraph, their HAPP sourcing explains what a document says rather than why the author wrote it that way, or their LEQ thesis restates the prompt instead of establishing a line of reasoning. Upload your APWH notes, textbook chapters, and practice essays into Lunora to get unlimited targeted practice broken down by period and region, so every era from the Mongol Empire to globalization is locked in before exam day.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
              Try Lunora for AP World History — Free <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
            </Link>
            <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>No credit card needed</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { Icon: Sparkles, title: "Unlimited APWH practice questions", body: "Generate MCQ sets, SAQ prompts, and essay outlines on every period — from Period 1 (1200–1450) through Period 6 (1980–present) — from your own notes and textbook chapters." },
              { Icon: Brain, title: "Master DBQ and LEQ argumentation", body: "Struggling with HAPP sourcing or contextualization? Get instant feedback and worked examples on writing developed context, sourcing documents by audience and purpose, and constructing complexity arguments." },
              { Icon: TrendingUp, title: "Track mastery by period and region", body: "See your accuracy across all six APWH periods and across regions — Africa, Asia, the Americas, Europe, the Middle East. Know exactly what you've locked in and what needs work." },
              { Icon: Clock, title: "Short daily sessions that work", body: "APWH rewards both content breadth and essay skill. Focused sessions that mix period-based content review with timed essay practice build both in parallel." },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "16px 18px", borderRadius: 14, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon size={15} color="white" strokeWidth={2} /></div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 4 }}>{title}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>{body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* OTHER EXAMS */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill"><Zap size={11} strokeWidth={2.5} />More AP Calculators</div></div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em" }}>Calculate scores for other AP exams</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
            {otherExams.map(({ name, href }) => (
              <Link key={name} href={href} className="exam-card">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Globe size={13} color="#203567" strokeWidth={2} /></div>
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

      {/* FAQ */}
      <section id="faq" style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill">FAQ</div></div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#203567", letterSpacing: "-0.025em" }}>AP World History Score Calculator FAQ</h2>
            <p style={{ fontSize: 15, color: "#8899bb", marginTop: 10 }}>Everything you need to know about how AP World History: Modern is scored.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>Stop estimating. Start mastering.</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>Turn your AP World History notes into unlimited period-by-period practice questions and essay prompts. Track your progress to a 5.</p>
          <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", color: "#203567", fontWeight: 800, fontSize: 16, padding: "16px 40px", borderRadius: 100, textDecoration: "none" }}>
            Start learning free <ArrowRight size={16} color="#203567" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#16254a", padding: "48px 24px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <LunoraLogo light size="sm" />
          <div style={{ display: "flex", gap: 28 }}>
            <Link href="/privacy-policy" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms-and-conditions" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Terms</Link>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>© 2026 Lunora. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}