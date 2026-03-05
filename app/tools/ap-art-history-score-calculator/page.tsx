"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, BarChart2, Brain, BookOpen,
  ChevronDown, Trash2, History,
  CheckCircle, Sparkles,
  Trophy, Target, TrendingUp, Clock,
  ArrowRight, RotateCcw, Info, Palette,
} from "lucide-react";

// ─── AP Art History 2026 Scoring ──────────────────────────────────────────
// Section 1: 80 MCQ → 50% of composite · 1h
//   Questions organized around image-based sets and individual items
//   Tests all 10 content areas (global art from prehistory to present)
// Section 2: 6 FRQ → 50% of composite · 2h
//   Question 1: Visual Analysis (single object)         /6
//   Question 2: Visual Analysis (single object)         /6
//   Question 3: Comparison (two objects)                /6
//   Question 4: Contextual Analysis                     /6
//   Question 5: Attribution                             /6
//   Question 6: Long Essay (using art as evidence)      /7
//   Total FRQ raw = 37 pts
// Composite = (MCQ/80 × 50) + (FRQ_raw/37 × 50) → /100
// AP Score thresholds (approximate, College Board 2024–2025 data)
// ~25,000–30,000 test takers per year
// 5 rate ~11–14%; 3+ rate ~63–67%
const AP_SCORE_BREAKPOINTS = [
  { min: 72, score: 5 },
  { min: 57, score: 4 },
  { min: 42, score: 3 },
  { min: 28, score: 2 },
  { min: 0,  score: 1 },
];

const FRQ_CONFIG = [
  {
    label: "Q1 — Visual Analysis (Single Object)",
    max: 6,
    desc: "Analyze a single work of art using formal analysis: describe visual elements (line, color, composition, scale, material, technique), then explain how those formal choices contribute to the work's meaning, function, or context. No prior knowledge of the specific work is required.",
  },
  {
    label: "Q2 — Visual Analysis (Single Object)",
    max: 6,
    desc: "A second visual analysis of a single work, often from a different time period or culture than Q1. Graded identically: formal description + analysis of how visual choices create meaning. Works may be from the required 250 or be an unknown work.",
  },
  {
    label: "Q3 — Comparison (Two Objects)",
    max: 6,
    desc: "Compare two works of art — often one known and one unknown — analyzing both similarities and differences in formal qualities, function, context, or meaning. Must address both works substantively, not just describe each in isolation.",
  },
  {
    label: "Q4 — Contextual Analysis",
    max: 6,
    desc: "Analyze a work in relation to its cultural, historical, religious, or social context. Explain how its context shaped the work's meaning, function, or reception. Requires specific factual knowledge about the work and its circumstances of creation.",
  },
  {
    label: "Q5 — Attribution",
    max: 6,
    desc: "Given an unfamiliar work, identify its likely period, culture, or artist based on formal and contextual evidence. Justify your attribution with specific visual and historical reasoning. Tests ability to apply art historical thinking beyond the required 250 works.",
  },
  {
    label: "Q6 — Long Essay (Art as Evidence)",
    max: 7,
    desc: "Respond to a thematic prompt using specific works of art as evidence to support a historical or cultural argument. Must use at least two specific works as examples and develop a clear, sustained argument. Worth 7 points — the highest-weighted single question on the exam.",
  },
];

const FRQ_TOTAL_RAW = 37;
const MCQ_TOTAL     = 80;

function calcComposite(mcq: number, frq: number[]): number {
  const frqRaw = frq.reduce((a, b) => a + b, 0);
  return Math.round(((mcq / MCQ_TOTAL) * 50 + (frqRaw / FRQ_TOTAL_RAW) * 50) * 10) / 10;
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
    5: "Outstanding — you've demonstrated mastery of formal analysis, contextual reasoning, and art historical argument across global traditions.",
    4: "Strong result. A 4 on AP Art History shows genuine command of visual analysis and the ability to situate works in their cultural and historical contexts.",
    3: "You're in qualifying territory. Sharpen your long essay argument structure and contextual analysis to push into a 4.",
    2: "You're building the foundation. Focus on the required 250 works and practice formal analysis — these drive both the MCQ and every FRQ.",
    1: "Don't be discouraged. Systematic study of the required works and daily formal analysis practice will build your score quickly.",
  } as Record<number, string>)[score] ?? "";
}
function getThresholdRange(score: number): string {
  return ({ 5: "≥72", 4: "57–71", 3: "42–56", 2: "28–41", 1: "0–27" } as Record<number, string>)[score] ?? "";
}

interface SavedAttempt { id: string; mcq: number; frq: number[]; composite: number; apScore: number; savedAt: number; label: string; }
const DB_NAME = "lunora_ap_art_history"; const DB_VERSION = 1; const STORE = "attempts";
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function saveAttempt(a: SavedAttempt): Promise<void> {
  try { const db = await openDB(); await new Promise<void>((res, rej) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).put(a); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); } catch { /* silent */ }
}
async function loadAttempts(): Promise<SavedAttempt[]> {
  try { const db = await openDB(); return new Promise((res, rej) => { const tx = db.transaction(STORE, "readonly"); const req = tx.objectStore(STORE).getAll(); req.onsuccess = () => res(req.result || []); req.onerror = () => rej(req.error); }); } catch { return []; }
}
async function deleteAttempt(id: string): Promise<void> {
  try { const db = await openDB(); await new Promise<void>((res, rej) => { const tx = db.transaction(STORE, "readwrite"); tx.objectStore(STORE).delete(id); tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); }); } catch { /* silent */ }
}

function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const svgSizes = { sm: 90, md: 120, lg: 140 }; const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size]; const ts = textSizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
      <svg viewBox="0 0 100 100" style={{ width: s, height: s, transform: "rotate(40deg)", flexShrink: 0 }}>
        <defs><mask id={`lm-${light ? "l" : "d"}`}><rect width="100" height="100" fill="white" /><circle cx="57" cy="50" r="40" fill="black" /></mask></defs>
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
      <div style={{ maxHeight: open ? 480 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s" }}>
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

function ScoreSlider({ label, sublabel, value, max, onChange, color = "#203567" }: { label: string; sublabel?: string; value: number; max: number; onChange: (v: number) => void; color?: string; }) {
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

export default function APArtHistoryScoreCalculator() {
  const [mcq, setMcq] = useState(48);
  const [frq, setFrq] = useState<number[]>([4, 4, 4, 4, 4, 5]);
  const [savedAttempts, setSavedAttempts] = useState<SavedAttempt[]>([]);
  const [justSaved, setJustSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const frqRaw = frq.reduce((a, b) => a + b, 0);
  const composite = calcComposite(mcq, frq);
  const apScore = calcAPScore(composite);
  const scoreColor = getScoreColor(apScore);
  const scoreBg = getScoreBg(apScore);
  const mcqComponent = Math.round((mcq / MCQ_TOTAL) * 50 * 10) / 10;
  const frqComponent = Math.round((frqRaw / FRQ_TOTAL_RAW) * 50 * 10) / 10;

  useEffect(() => {
    loadAttempts().then(setSavedAttempts);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const updateFrq = (i: number, val: number) => { const copy = [...frq]; copy[i] = Math.max(0, Math.min(FRQ_CONFIG[i].max, val)); setFrq(copy); };
  const handleSave = async () => {
    const attempt: SavedAttempt = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), mcq, frq: [...frq], composite, apScore, savedAt: Date.now(), label: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) };
    await saveAttempt(attempt); setSavedAttempts(await loadAttempts()); setJustSaved(true); setShowHistory(true); setTimeout(() => setJustSaved(false), 2200);
  };
  const handleDelete = async (id: string) => { await deleteAttempt(id); setSavedAttempts(await loadAttempts()); };
  const handleReset = () => { setMcq(0); setFrq([0, 0, 0, 0, 0, 0]); };
  const loadAttemptIntoCalc = (a: SavedAttempt) => { setMcq(a.mcq); setFrq([...a.frq]); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const faqs = [
    {
      q: "How is the AP Art History exam scored in 2026?",
      a: "The AP Art History exam has two sections, each worth 50% of the composite score. Section 1 is 80 multiple choice questions completed in 1 hour, covering all 10 content areas from global prehistory to contemporary art. Section 2 is 6 free response questions completed in 2 hours — five questions worth 6 points each and one long essay worth 7 points, for a total FRQ raw score of 37. Composite = (MCQ/80 × 50) + (FRQ/37 × 50), producing a score out of 100 that maps to an AP score of 1–5.",
    },
    {
      q: "What are the 250 required works for AP Art History?",
      a: "The College Board specifies 250 required works of art that all AP Art History students are expected to know. These span the 10 content areas: Global Prehistory, Ancient Mediterranean, Early Europe and Colonial Americas, Later Europe and Americas, Indigenous Americas, Africa, West and Central Asia, South, East, and Southeast Asia, the Pacific, and Global Contemporary. For each required work, students are expected to know the title, artist or culture, date, medium, scale, location (original and current), function, and art historical significance. While the visual analysis FRQs may feature unknown works, the contextual analysis FRQ, attribution FRQ, and long essay require specific factual knowledge of the required 250.",
    },
    {
      q: "What composite score do I need for a 5 on AP Art History?",
      a: "Based on recent College Board score distributions, you generally need a composite score of approximately 72 or above to earn a 5 on AP Art History. The 5 rate is roughly 11–14% per year — lower than many humanities AP exams. The long essay (Q6, worth 7 points) is the single most important question on the exam in terms of FRQ weighting, and the ability to construct a sustained argument using specific works as evidence is what separates 4s from 5s.",
    },
    {
      q: "What composite score do I need for a 3 on AP Art History?",
      a: "A composite score of approximately 42 or above typically earns a 3 on AP Art History. The overall passing rate (3 or higher) is roughly 63–67%. Students who know the required 250 works well enough to answer basic identification and context MCQ questions, and who can write coherent visual analyses and comparisons, consistently reach a qualifying score.",
    },
    {
      q: "What is the AP Art History long essay question (Q6)?",
      a: "Question 6 is the long essay, worth 7 points — the highest-weighted individual question on the exam. The prompt presents a thematic or comparative question about art history and asks students to construct an argument supported by at least two specific works of art as evidence. Strong responses include a clear thesis that makes a historically grounded claim, use works as evidence with specific formal and contextual details (not vague references), and develop a sustained argument across the essay rather than providing a series of disconnected descriptions. The most common reason students lose points on Q6 is treating it as a sequence of object descriptions rather than a structured argument.",
    },
    {
      q: "How is the AP Art History comparison question scored?",
      a: "Question 3 asks students to compare two works of art — one is usually a known work from the required 250 and the other may be unknown. The rubric awards points for: identifying meaningful similarities AND differences (not just listing one), analyzing how both works' formal qualities relate to meaning or function, and using specific visual evidence from both works. Students lose points when they describe each work in isolation (two mini-paragraphs) without making explicit comparative claims. Strong responses move back and forth between both works, using language like 'while both works use symmetry to convey authority, the Egyptian relief achieves this through frontal hieratic scale, whereas...'",
    },
    {
      q: "What content areas have the most questions on the AP Art History exam?",
      a: "The AP Art History exam distributes questions across all 10 content areas, but the two largest content areas — Later Europe and Americas (c. 1750–1980) and Early Europe and Colonial Americas (c. 200–1750 CE) — together account for a substantial portion of both MCQ and FRQ prompts. Global Contemporary art (c. 1980–present) has grown in emphasis in recent years. The most commonly underrepresented content areas for students are Indigenous Americas, Pacific, and West and Central Asia — these regions have fewer required works but regularly appear on the exam, making them high-leverage study targets.",
    },
    {
      q: "How can I improve my AP Art History score?",
      a: "Three habits drive the highest score improvements. First, systematic review of the required 250 works: for each work, practice writing one sentence of formal description and one sentence of contextual significance without looking at your notes. Second, daily formal analysis practice: pick any image and write a timed 5-minute paragraph describing its formal elements and explaining what they communicate — this is the core skill tested by Q1, Q2, Q3, and Q5. Third, long essay structure: practice writing full Q6-style essays that open with an arguable thesis, use at least two works as specific evidence with formal details and context, and conclude with a broader claim about the period or theme. Use tools like Lunora to generate unlimited AP Art History practice questions from your notes and image sets, organized by content area, so every region and period is locked in.",
    },
  ];

  const otherExams = [
    { name: "AP English Language",     href: "/tools/ap-english-language-score-calculator"    },
    { name: "AP English Literature",   href: "/tools/ap-english-literature-score-calculator"  },
    { name: "AP US History",           href: "/tools/ap-us-history-score-calculator"          },
    { name: "AP World History",        href: "/tools/ap-world-history-score-calculator"       },
    { name: "AP Human Geography",      href: "/tools/ap-human-geography-score-calculator"     },
    { name: "AP Psychology",           href: "/tools/ap-psychology-score-calculator"          },
    { name: "AP Gov & Politics",       href: "/tools/ap-us-government-score-calculator"       },
    { name: "AP Macroeconomics",       href: "/tools/ap-macroeconomics-score-calculator"      },
    { name: "AP Biology",              href: "/tools/ap-biology-score-calculator"             },
    { name: "AP Chemistry",            href: "/tools/ap-chemistry-score-calculator"           },
    { name: "AP Statistics",           href: "/tools/ap-statistics-score-calculator"          },
    { name: "AP Calculus AB",          href: "/tools/ap-calculus-ab-score-calculator"         },
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "AP Art History Score Calculator",
        "description": "Free AP Art History score calculator for 2026. Enter your MCQ and free response scores to instantly calculate your composite score and predicted AP score of 1–5.",
        "url": "https://lunora.app/tools/ap-art-history-score-calculator",
        "applicationCategory": "EducationApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" }
      }) }} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "How is the AP Art History exam scored?", "acceptedAnswer": { "@type": "Answer", "text": "AP Art History has two sections each worth 50%. Section 1 is 80 MCQ in 1 hour. Section 2 is 6 FRQs in 2 hours — five worth 6 pts each and one long essay worth 7 pts (37 raw total). Composite out of 100 maps to AP score 1–5." } },
          { "@type": "Question", "name": "What are the 250 required works for AP Art History?", "acceptedAnswer": { "@type": "Answer", "text": "The College Board specifies 250 required works spanning 10 content areas from global prehistory to contemporary art. For each work, students must know title, artist/culture, date, medium, scale, location, function, and significance." } },
          { "@type": "Question", "name": "What composite score do I need for a 5 on AP Art History?", "acceptedAnswer": { "@type": "Answer", "text": "You generally need a composite score of approximately 72 or above for a 5. The 5 rate is roughly 11–14% per year." } },
          { "@type": "Question", "name": "What is the AP Art History long essay question?", "acceptedAnswer": { "@type": "Answer", "text": "Q6 is a long essay worth 7 points — the highest-weighted question. Students must respond to a thematic prompt using at least two specific works of art as evidence to support a historical or cultural argument." } },
          { "@type": "Question", "name": "What content areas are on the AP Art History exam?", "acceptedAnswer": { "@type": "Answer", "text": "AP Art History covers 10 content areas: Global Prehistory, Ancient Mediterranean, Early Europe and Colonial Americas, Later Europe and Americas, Indigenous Americas, Africa, West and Central Asia, South/East/Southeast Asia, the Pacific, and Global Contemporary." } }
        ]
      }) }} />

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
          <h1 style={{ fontSize: "clamp(30px,5vw,56px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
            AP Art History{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>Score Calculator</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 20px" }}>
            Enter your <strong style={{ color: "#1a1a1a" }}>Multiple Choice</strong> and <strong style={{ color: "#1a1a1a" }}>Free Response</strong> scores to instantly see your predicted AP score of 1–5 and composite out of 100.
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
            {/* MCQ */}
            <div className="score-card" style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BarChart2 size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Section 1: Multiple Choice</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>80 questions · <strong style={{ color: "#203567" }}>50%</strong> of total score · 1h · image-based sets</p>
                </div>
              </div>
              <div style={{ marginBottom: 18, padding: "12px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, border: "1px solid rgba(32,53,103,0.08)" }}>
                <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, margin: 0 }}>
                  Questions are organized into image-based sets. Covers all <strong>10 content areas</strong> from Global Prehistory to Global Contemporary. Tests identification, formal analysis, contextual knowledge, and comparison of the required 250 works and beyond.
                </p>
              </div>
              <ScoreSlider label="Multiple Choice Score" sublabel="no guessing penalty" value={mcq} max={MCQ_TOTAL} onChange={setMcq} color="#203567" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>MCQ contributes to composite (50% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>{mcqComponent} / 50</span>
              </div>
            </div>

            {/* FRQ */}
            <div className="score-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Section 2: Free Response</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>6 questions · 37 pts total · <strong style={{ color: "#203567" }}>50%</strong> of total score · 2h</p>
                </div>
              </div>

              <div style={{ marginTop: 16, marginBottom: 24, padding: "12px 14px", background: "rgba(74,124,199,0.06)", borderRadius: 10, border: "1px solid rgba(74,124,199,0.15)" }}>
                <p style={{ fontSize: 12, color: "#4a7cc7", lineHeight: 1.6, margin: 0 }}>
                  <strong>Q6 (Long Essay) is worth 7 pts — the most heavily weighted question.</strong> Always write a defensible thesis and support it with at least two specific works as evidence. Q1–Q5 are each worth 6 pts. Formal analysis and contextual knowledge drive every question.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
                {FRQ_CONFIG.map((q, i) => (
                  <div key={i}>
                    <div style={{ marginBottom: 6, display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#203567" }}>{q.label}</span>
                      {i === 5 && (
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#1a7a4a", background: "rgba(26,122,74,0.1)", padding: "2px 8px", borderRadius: 100, flexShrink: 0 }}>Highest weight · 7 pts</span>
                      )}
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 3, lineHeight: 1.4, width: "100%" }}>{q.desc}</div>
                    </div>
                    <ScoreSlider label="" sublabel={`${q.max} pts`} value={frq[i]} max={q.max} onChange={v => updateFrq(i, v)} color={i === 5 ? "#1a7a4a" : "#4a7cc7"} />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>FRQ raw total ({frqRaw}/{FRQ_TOTAL_RAW}) contributes (50% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>{frqComponent} / 50</span>
              </div>

              <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
                <button onClick={handleReset} style={{ flex: 1, padding: "11px", border: "1.5px solid #eef0f8", borderRadius: 12, background: "white", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "#888", fontFamily: "'DM Sans', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "border-color 0.2s, color 0.2s" }} onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#203567"; (e.currentTarget as HTMLButtonElement).style.color = "#203567"; }} onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "#eef0f8"; (e.currentTarget as HTMLButtonElement).style.color = "#888"; }}>
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

              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase", display: "block", marginBottom: 12 }}>Score Breakdown</span>
                <BreakdownBar label="Multiple Choice" score={mcq} max={MCQ_TOTAL} color="#203567" />
                <BreakdownBar label="Q1 Visual" score={frq[0]} max={FRQ_CONFIG[0].max} color="#4a7cc7" />
                <BreakdownBar label="Q2 Visual" score={frq[1]} max={FRQ_CONFIG[1].max} color="#4a7cc7" />
                <BreakdownBar label="Q3 Compare" score={frq[2]} max={FRQ_CONFIG[2].max} color="#4a7cc7" />
                <BreakdownBar label="Q4 Context" score={frq[3]} max={FRQ_CONFIG[3].max} color="#4a7cc7" />
                <BreakdownBar label="Q5 Attribution" score={frq[4]} max={FRQ_CONFIG[4].max} color="#4a7cc7" />
                <BreakdownBar label="Q6 Long Essay" score={frq[5]} max={FRQ_CONFIG[5].max} color="#1a7a4a" />
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
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>How the AP Art History score is calculated</h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 540, margin: "0 auto" }}>MCQ and FRQ each carry 50% — but within the FRQ section, the 7-point long essay is the single highest-weighted question and the clearest differentiator between a 4 and a 5.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { Icon: BarChart2, color: "#203567", title: "Section 1: MCQ", sub: "50% of total score", body: "80 image-based questions in 1 hour across all 10 content areas. Questions are grouped into sets around a visual stimulus. Tests identification of required works, formal analysis, contextual knowledge, and the ability to compare works across cultures and periods.", formula: "MCQ / 80 × 50" },
              { Icon: Palette, color: "#4a7cc7", title: "Visual Analysis FRQs", sub: "Q1–Q2 · 6 pts each", body: "Two visual analysis questions (6 pts each) test formal analysis of individual works — describing visual elements and explaining how those choices create meaning, function, or communicate cultural values. Prior knowledge of the specific work is not required.", formula: "description + analysis" },
              { Icon: BookOpen, color: "#2d6e9e", title: "Comparison, Context & Attribution", sub: "Q3–Q5 · 6 pts each", body: "Q3 compares two works using specific visual evidence from both. Q4 requires specific contextual knowledge about a work and its circumstances of creation. Q5 asks students to attribute an unknown work to a culture or period based on formal and historical evidence.", formula: "18 pts total" },
              { Icon: Trophy, color: "#1a7a4a", title: "Long Essay (Q6)", sub: "7 pts · highest weight", body: "The long essay is worth 7 points — more than any other FRQ. Students respond to a thematic prompt using at least two specific works as evidence to build a historical argument. The most common errors: writing object descriptions instead of an argument, and using only one work as evidence.", formula: "thesis + evidence + argument" },
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
              AP Art History rewards two things above everything else: knowing the required 250 works with enough specificity to use them as evidence, and being able to look at any image — known or unknown — and write a precise formal analysis that connects visual choices to meaning. Most students underperform not because they lack knowledge, but because their FRQ responses describe works rather than analyze them. For the long essay, they list objects instead of making arguments. These are habits, and habits are trainable. Upload your AP Art History notes, image sets, and coursework into Lunora to get unlimited timed practice on formal analysis and content-area identification, so every question type — from attribution to long essay — is automatic on exam day.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
              Try Lunora for AP Art History — Free <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
            </Link>
            <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>No credit card needed</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { Icon: Sparkles, title: "Drill all 250 required works by content area", body: "Generate identification and contextual knowledge questions on every required work — organized by content area — so no region or period catches you off guard on the MCQ." },
              { Icon: Brain, title: "Build formal analysis fluency", body: "The ability to describe visual elements and immediately connect them to meaning is the core skill tested by Q1, Q2, Q3, and Q5. Practice timed formal analysis paragraphs until the analytical structure is automatic." },
              { Icon: TrendingUp, title: "Master the long essay argument structure", body: "Q6 is worth 7 points and demands a genuine historical argument — not a sequence of object descriptions. Practice writing thesis-driven long essays that use specific works as evidence to support a broader claim." },
              { Icon: Clock, title: "Target your weakest content areas", body: "AP Art History covers 10 content areas. Students who underperform on Indigenous Americas, Pacific, or West and Central Asia leave easy points on the table. Track your performance by region and close the gaps before exam day." },
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
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Palette size={13} color="#203567" strokeWidth={2} /></div>
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
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#203567", letterSpacing: "-0.025em" }}>AP Art History Score Calculator FAQ</h2>
            <p style={{ fontSize: 15, color: "#8899bb", marginTop: 10 }}>Everything you need to know about how AP Art History is scored in 2026.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16 }}>Stop estimating. Start mastering.</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>Turn your AP Art History notes and image sets into unlimited content-area practice questions. Track your progress to a 5.</p>
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