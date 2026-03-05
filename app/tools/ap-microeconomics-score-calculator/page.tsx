"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Zap, BarChart2, Brain, BookOpen,
  ChevronDown, Trash2, History,
  CheckCircle, Sparkles,
  Trophy, Target, TrendingUp, Clock,
  ArrowRight, RotateCcw, Info, ShoppingCart,
} from "lucide-react";

// ─── AP Microeconomics 2026 Scoring ───────────────────────────────────────
// Section 1: 60 MCQ → 66.7% of composite · 1h 10min
// Section 2: 3 FRQ → 33.3% of composite · 1h
//   FRQ 1: Long FRQ (graph-heavy)  /10
//   FRQ 2: Short FRQ               /5
//   FRQ 3: Short FRQ               /5
//   Total FRQ raw = 20 pts
// Composite = (MCQ/60 × 66.7) + (FRQ_raw/20 × 33.3) → /100
// AP Score thresholds (approximate, College Board 2024–2025 data)
// AP Micro has a moderate-high 5 rate (~21–25%) and passing rate (~55–60%)
const AP_SCORE_BREAKPOINTS = [
  { min: 72, score: 5 },
  { min: 58, score: 4 },
  { min: 45, score: 3 },
  { min: 33, score: 2 },
  { min: 0,  score: 1 },
];

const FRQ_CONFIG = [
  {
    label: "FRQ 1 — Long Free Response",
    max: 10,
    desc: "A multi-part question requiring labeled graph construction and analysis — typically involves perfectly competitive markets, monopoly, oligopoly, or factor markets; axis labels, curve labels, and correctly shown equilibrium points are required for full credit",
  },
  {
    label: "FRQ 2 — Short Free Response",
    max: 5,
    desc: "A focused question on a specific microeconomic concept — market structures, externalities, price controls, or consumer/producer surplus; typically 3–5 parts worth 1 point each",
  },
  {
    label: "FRQ 3 — Short Free Response",
    max: 5,
    desc: "A second focused question testing a different concept — common topics include factor markets, public goods, price discrimination, tax incidence, or trade and comparative advantage",
  },
];

const FRQ_TOTAL_RAW = 20;
const MCQ_TOTAL     = 60;

function calcComposite(mcq: number, frq: number[]): number {
  const frqRaw = frq.reduce((a, b) => a + b, 0);
  const mcqPts = (mcq / MCQ_TOTAL)        * (200 / 3);
  const frqPts = (frqRaw / FRQ_TOTAL_RAW) * (100 / 3);
  return Math.round((mcqPts + frqPts) * 10) / 10;
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
    5: "Outstanding — you've mastered microeconomic models, market structures, and efficiency analysis across every major unit.",
    4: "Strong result. A 4 on AP Microeconomics shows solid command of market models and their welfare implications.",
    3: "You're in qualifying territory. Sharpen your graph labeling on the long FRQ and market failure analysis to push higher.",
    2: "You're building the foundation. Focus on supply and demand mechanics and perfect competition — the highest-yield concepts on both sections.",
    1: "Don't be discouraged. Consistent daily practice on AP Micro models and graph construction will turn this around.",
  } as Record<number, string>)[score] ?? "";
}
function getThresholdRange(score: number): string {
  return ({ 5: "≥72", 4: "58–71", 3: "45–57", 2: "33–44", 1: "0–32" } as Record<number, string>)[score] ?? "";
}

interface SavedAttempt { id: string; mcq: number; frq: number[]; composite: number; apScore: number; savedAt: number; label: string; }
const DB_NAME = "lunora_ap_micro"; const DB_VERSION = 1; const STORE = "attempts";
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
      <div style={{ maxHeight: open ? 420 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s" }}>
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

export default function APMicroeconomicsScoreCalculator() {
  const [mcq, setMcq] = useState(38);
  const [frq, setFrq] = useState<number[]>([7, 3, 3]);
  const [savedAttempts, setSavedAttempts] = useState<SavedAttempt[]>([]);
  const [justSaved, setJustSaved]         = useState(false);
  const [showHistory, setShowHistory]     = useState(false);
  const [scrolled, setScrolled]           = useState(false);

  const frqRaw     = frq.reduce((a, b) => a + b, 0);
  const composite  = calcComposite(mcq, frq);
  const apScore    = calcAPScore(composite);
  const scoreColor = getScoreColor(apScore);
  const scoreBg    = getScoreBg(apScore);
  const mcqComponent = Math.round((mcq / MCQ_TOTAL) * (200 / 3) * 10) / 10;
  const frqComponent = Math.round((frqRaw / FRQ_TOTAL_RAW) * (100 / 3) * 10) / 10;

  useEffect(() => {
    loadAttempts().then(setSavedAttempts);
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const updateFrq = (i: number, val: number) => {
    const copy = [...frq]; copy[i] = Math.max(0, Math.min(FRQ_CONFIG[i].max, val)); setFrq(copy);
  };
  const handleSave = async () => {
    const attempt: SavedAttempt = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      mcq, frq: [...frq], composite, apScore, savedAt: Date.now(),
      label: new Date().toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    };
    await saveAttempt(attempt); setSavedAttempts(await loadAttempts());
    setJustSaved(true); setShowHistory(true); setTimeout(() => setJustSaved(false), 2200);
  };
  const handleDelete = async (id: string) => { await deleteAttempt(id); setSavedAttempts(await loadAttempts()); };
  const handleReset  = () => { setMcq(0); setFrq([0, 0, 0]); };
  const loadAttemptIntoCalc = (a: SavedAttempt) => {
    setMcq(a.mcq); setFrq([...a.frq]); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const faqs = [
    {
      q: "How is the AP Microeconomics exam scored in 2026?",
      a: "The AP Microeconomics exam has two sections. Section 1 is 60 multiple choice questions completed in 1 hour 10 minutes, worth approximately 66.7% of your composite score. Section 2 is 3 free response questions completed in 1 hour, worth approximately 33.3%. FRQ 1 is a long question worth 10 points; FRQs 2 and 3 are short questions worth 5 points each, for a total raw FRQ score of 20. Your raw scores convert to a composite out of 100, which maps to an AP score of 1–5. Like AP Macroeconomics, the MCQ section carries twice the weight of the FRQ section.",
    },
    {
      q: "What composite score do I need for a 5 on AP Microeconomics?",
      a: "Based on recent College Board score distributions, you generally need a composite score of approximately 72 or above to earn a 5 on AP Microeconomics. About 21–25% of test takers score a 5 each year. The long FRQ — which requires drawing and correctly labeling market structure graphs — is the primary differentiator between a 4 and a 5, since students who miss graph labels and incorrectly identified efficiency outcomes consistently fall short of the top score.",
    },
    {
      q: "What composite score do I need for a 3 on AP Microeconomics?",
      a: "A composite score of approximately 45 or above typically earns a 3 on AP Microeconomics. About 55–60% of test takers earn a 3 or higher. Students who understand supply and demand, basic market equilibrium, and the difference between perfect competition and monopoly usually reach a 3 even without mastering factor markets and game theory.",
    },
    {
      q: "What is the long FRQ on AP Microeconomics?",
      a: "The long free response question (FRQ 1) is worth 10 points and typically runs 8–12 parts. It almost always requires drawing and correctly labeling graphs for one or more market structures — most commonly perfectly competitive markets, monopoly, and monopolistic competition. Points are awarded per element: axes must be labeled (Price on the vertical axis, Quantity on the horizontal), cost and revenue curves must be drawn and labeled (MC, ATC, AVC, MR, D), and the profit-maximizing quantity and price must be correctly identified. This question alone is worth 50% of the FRQ section — making graph mastery the single highest-leverage skill for the AP Micro exam.",
    },
    {
      q: "What graphs do I need to know for the AP Microeconomics FRQ?",
      a: "The seven core graphs tested on the AP Microeconomics FRQ are: (1) Supply and Demand — equilibrium price and quantity, consumer/producer surplus, price floors and ceilings; (2) Perfect Competition (firm and market) — MC, ATC, AVC, MR=D=P, short-run profit/loss, long-run equilibrium; (3) Monopoly — downward-sloping demand, MR below demand, MC=MR profit-maximizing output, deadweight loss triangle; (4) Monopolistic Competition — short-run profit/loss and long-run zero-profit equilibrium; (5) Oligopoly / Game Theory — kinked demand curve, Nash equilibrium in payoff matrices; (6) Factor Markets (labor market) — MRC, MRP, wage and employment determination; (7) Externalities — negative/positive externality graphs showing social vs. private curves, Pigouvian taxes/subsidies, deadweight loss. Every graph requires labeled axes, labeled curves, and correct identification of profit-maximizing output.",
    },
    {
      q: "What topics are on the AP Microeconomics exam?",
      a: "AP Microeconomics covers six units: Unit 1 (Basic Economic Concepts) — scarcity, opportunity cost, production possibilities, comparative advantage, absolute advantage, supply and demand; Unit 2 (Supply and Demand) — market equilibrium, price controls (floors and ceilings), quantity controls, consumer and producer surplus, tax incidence and deadweight loss; Unit 3 (Production, Cost, and the Perfect Competition Model) — production function, short-run and long-run costs (MC, ATC, AVC, AFC), profit maximization, perfectly competitive firm behavior, and long-run market equilibrium; Unit 4 (Imperfect Competition) — monopoly, natural monopoly, monopolistic competition, oligopoly, game theory and Nash equilibrium, price discrimination; Unit 5 (Factor Markets) — derived demand for labor, marginal revenue product, wage determination in competitive and monopsonistic labor markets; Unit 6 (Market Failure and the Role of Government) — public goods, positive and negative externalities, Pigouvian taxes and subsidies, income inequality, and the role of government in correcting market failures. Units 3 and 4 receive the highest MCQ and FRQ emphasis.",
    },
    {
      q: "What is the difference between AP Microeconomics and AP Macroeconomics?",
      a: "AP Microeconomics focuses on individual markets, firms, and consumers — supply and demand, market structures (perfect competition, monopoly, oligopoly), factor markets, externalities, and market failures. AP Macroeconomics focuses on the economy as a whole — GDP, inflation, unemployment, fiscal policy, monetary policy, and international trade. Both exams share the same format: 60 MCQ + 3 FRQ with the same 66.7%/33.3% weighting. Many students take both, but Macro is typically taken first since its aggregate supply and demand concepts build on Micro's foundational supply and demand analysis. Both are standalone exams with separate AP scores.",
    },
    {
      q: "Is AP Microeconomics harder than AP Macroeconomics?",
      a: "Most students find AP Microeconomics slightly harder than AP Macroeconomics, though both have similar 5 rates (~21–25%) and passing rates (~55–60%). Micro is harder because it requires mastering more distinct graph types — perfect competition, monopoly, monopolistic competition, factor markets, and externality graphs all appear on the FRQ — while Macro concentrates more heavily on a smaller set of interconnected models (AD/AS, money market, loanable funds, forex). Micro's long FRQ also tends to involve more graph parts and more precise welfare analysis (consumer surplus, producer surplus, deadweight loss triangles) that require careful labeling.",
    },
    {
      q: "How can I improve my AP Microeconomics score?",
      a: "Master graph construction before exam day — this is the single highest-leverage skill for the long FRQ. Practice drawing the perfectly competitive firm, monopoly, and monopolistic competition graphs from scratch until cost curve labels (MC, ATC, AVC, MR, D), profit-maximizing output (where MC=MR), and welfare areas (consumer surplus, producer surplus, deadweight loss) are automatic. For MCQ, drill the distinction between short-run and long-run firm behavior in perfect competition, the welfare effects of price controls and taxes, and MRP/MRC in factor markets. For FRQs 2 and 3, practice explaining market failure corrections: when to use a tax vs. a subsidy vs. a quantity regulation, and how to calculate the size of the deadweight loss triangle. Use tools like Lunora to generate unlimited AP Micro practice questions from your notes organized by unit.",
    },
  ];

  const otherExams = [
    { name: "AP Macroeconomics",   href: "/tools/ap-macroeconomics-score-calculator"       },
    { name: "AP US History",       href: "/tools/ap-us-history-score-calculator"           },
    { name: "AP World History",    href: "/tools/ap-world-history-score-calculator"        },
    { name: "AP Psychology",       href: "/tools/ap-psychology-score-calculator"           },
    { name: "AP Gov & Politics",   href: "/tools/ap-us-government-score-calculator"        },
    { name: "AP Human Geography",  href: "/tools/ap-human-geography-score-calculator"      },
    { name: "AP Statistics",       href: "/tools/ap-statistics-score-calculator"           },
    { name: "AP Biology",          href: "/tools/ap-biology-score-calculator"              },
    { name: "AP Chemistry",        href: "/tools/ap-chemistry-score-calculator"            },
    { name: "AP Env. Science",     href: "/tools/ap-environmental-science-score-calculator" },
    { name: "AP Calculus AB",      href: "/tools/ap-calculus-ab-score-calculator"          },
    { name: "AP English Lang",     href: "/tools/ap-english-language-score-calculator"     },
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

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "WebApplication", "name": "AP Microeconomics Score Calculator", "description": "Free AP Microeconomics score calculator for 2026. Enter your multiple choice and free response scores to instantly calculate your composite score and predicted AP score of 1–5.", "url": "https://lunora.app/tools/ap-microeconomics-score-calculator", "applicationCategory": "EducationApplication", "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" }, "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" } }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [ { "@type": "Question", "name": "How is the AP Microeconomics exam scored?", "acceptedAnswer": { "@type": "Answer", "text": "AP Micro has two sections. Section 1 is 60 MCQ worth ~66.7% (1h 10min). Section 2 is 3 FRQs worth ~33.3% (1h): FRQ 1 is 10 pts, FRQs 2 and 3 are 5 pts each (20 raw total). Scores convert to a composite out of 100, then to an AP score of 1–5." } }, { "@type": "Question", "name": "What composite score do I need for a 5 on AP Microeconomics?", "acceptedAnswer": { "@type": "Answer", "text": "You generally need a composite score of approximately 72 or above for a 5 on AP Microeconomics. About 21–25% of students score a 5 each year." } }, { "@type": "Question", "name": "What is the long FRQ on AP Microeconomics?", "acceptedAnswer": { "@type": "Answer", "text": "FRQ 1 is worth 10 points and requires drawing and labeling market structure graphs — typically perfect competition, monopoly, or monopolistic competition. Unlabeled axes or curves earn zero for those parts." } }, { "@type": "Question", "name": "What graphs do I need to know for AP Microeconomics?", "acceptedAnswer": { "@type": "Answer", "text": "The seven core graphs: supply and demand, perfectly competitive firm, monopoly, monopolistic competition, oligopoly/game theory, factor markets (labor), and externalities. Every graph requires labeled axes, labeled curves, and correct identification of profit-maximizing output." } }, { "@type": "Question", "name": "What is the difference between AP Microeconomics and AP Macroeconomics?", "acceptedAnswer": { "@type": "Answer", "text": "AP Micro covers individual markets and firms (supply/demand, market structures, factor markets, externalities). AP Macro covers the whole economy (GDP, inflation, fiscal/monetary policy, international trade). Both use the same exam format." } } ] }) }} />

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
            AP Microeconomics{" "}
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
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>60 questions · <strong style={{ color: "#203567" }}>~66.7%</strong> of total score · 1h 10min</p>
                </div>
              </div>
              <ScoreSlider label="Multiple Choice Score" sublabel="no guessing penalty" value={mcq} max={MCQ_TOTAL} onChange={setMcq} color="#203567" />
              <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>MCQ contributes to composite (66.7% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>{mcqComponent.toFixed(1)} / 66.7</span>
              </div>
            </div>

            {/* FRQ */}
            <div className="score-card">
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={17} color="#203567" strokeWidth={2} /></div>
                <div>
                  <h2 style={{ fontSize: 17, fontWeight: 800, color: "#1a1a1a", margin: 0 }}>Section 2: Free Response</h2>
                  <p style={{ fontSize: 12, color: "#aaa", marginTop: 2 }}>3 questions · 1 long (10 pts) + 2 short (5 pts each) · <strong style={{ color: "#203567" }}>~33.3%</strong> of total score · 1h</p>
                </div>
              </div>

              <div style={{ marginTop: 16, marginBottom: 24, padding: "12px 14px", background: "rgba(74,124,199,0.06)", borderRadius: 10, border: "1px solid rgba(74,124,199,0.15)" }}>
                <p style={{ fontSize: 12, color: "#4a7cc7", lineHeight: 1.6, margin: 0 }}>
                  <strong>Label every axis, curve, and equilibrium point.</strong> The long FRQ awards points per graph element — an unlabeled axis or cost curve earns zero for that part even if the profit-maximizing output is correct. Practice drawing perfect competition, monopoly, and monopolistic competition graphs until labeling is automatic.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
                {FRQ_CONFIG.map((q, i) => (
                  <div key={i}>
                    <div style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#203567" }}>{q.label}</span>
                      <div style={{ fontSize: 11, color: "#aaa", marginTop: 3, lineHeight: 1.4 }}>{q.desc}</div>
                    </div>
                    <ScoreSlider label="" sublabel={`${q.max} pts`} value={frq[i]} max={q.max} onChange={v => updateFrq(i, v)} color="#4a7cc7" />
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: "10px 14px", background: "rgba(32,53,103,0.04)", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#888" }}>FRQ raw total ({frqRaw}/{FRQ_TOTAL_RAW}) contributes (33.3% weight)</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#203567" }}>{frqComponent.toFixed(1)} / 33.3</span>
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
                <BreakdownBar label="FRQ 1 (long)" score={frq[0]} max={FRQ_CONFIG[0].max} color="#4a7cc7" />
                <BreakdownBar label="FRQ 2 (short)" score={frq[1]} max={FRQ_CONFIG[1].max} color="#4a7cc7" />
                <BreakdownBar label="FRQ 3 (short)" score={frq[2]} max={FRQ_CONFIG[2].max} color="#4a7cc7" />
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
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>How the AP Microeconomics score is calculated</h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 540, margin: "0 auto" }}>MCQ carries twice the weight of FRQ — but the long FRQ's graph labeling requirements make it the highest-leverage skill to master.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {[
              { Icon: BarChart2, color: "#203567", title: "Section 1: MCQ", sub: "~66.7% of total score", body: "60 questions in 1 hour 10 minutes covering all six units. Questions test understanding of market models, efficiency, welfare effects, and quantitative relationships like elasticity. Units 3 (costs and perfect competition) and 4 (imperfect competition) are the highest-yield units.", formula: "MCQ / 60 × 66.7" },
              { Icon: ShoppingCart, color: "#4a7cc7", title: "FRQ 1 — Long", sub: "10 pts · graph-heavy", body: "Worth 50% of the FRQ section. Typically 8–12 parts requiring drawn and labeled market structure graphs. Points are awarded per element: axis label, curve label, equilibrium point, welfare area. An unlabeled axis earns zero for that graph part regardless of correctness.", formula: "draw · label · identify" },
              { Icon: TrendingUp, color: "#2d6e9e", title: "FRQs 2 & 3 — Short", sub: "5 pts each · focused", body: "Two targeted questions on specific concepts. Common topics: externality corrections (Pigouvian taxes and subsidies), price discrimination effects, tax incidence and deadweight loss, factor market wage determination, public goods and free-rider problems.", formula: "FRQ2 + FRQ3 / 10 × 16.7" },
              { Icon: Trophy, color: "#1a7a4a", title: "AP Score", sub: "1–5", body: "Composite ≥72 → 5 · ≥58 → 4 · ≥45 → 3 · ≥33 → 2 · below → 1. About 21–25% of students earn a 5. Passing rate is ~55–60%. Graph labeling mastery on the long FRQ consistently separates 4s from 5s.", formula: "composite → 1–5" },
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
              Most AP Micro students lose points on the long FRQ not because they don't understand the market — but because they forget to label the ATC curve, draw MR separately from demand in a monopoly graph, or correctly shade the deadweight loss triangle under exam pressure. The fix is repetition: drawing the perfectly competitive firm, monopoly, and monopolistic competition graphs enough times that cost curves, equilibrium points, and welfare areas are automatic. Upload your AP Micro notes and textbook chapters into Lunora to get unlimited practice questions by unit — drilling the elasticity calculations, market structure comparisons, and externality analysis questions that appear on both the MCQ and FRQ sections.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
              Try Lunora for AP Microeconomics — Free <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
            </Link>
            <div style={{ marginTop: 14, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>No credit card needed</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { Icon: Sparkles, title: "Unlimited AP Micro practice questions", body: "Generate MCQ and FRQ-style questions on every unit — supply and demand, market structures, factor markets, externalities — directly from your own notes and textbook chapters." },
              { Icon: Brain, title: "Drill market structure graphs", body: "Struggling with monopoly vs. monopolistic competition long-run equilibrium? Get instant worked examples and graph construction practice for every market structure tested on the FRQ." },
              { Icon: TrendingUp, title: "Track mastery across all 6 units", body: "See your accuracy across all six AP Micro units. Know exactly which areas — imperfect competition, factor markets, market failure — still need work before exam day." },
              { Icon: Clock, title: "Short daily sessions that work", body: "AP Micro rewards model fluency built over time. Focused daily sessions connecting concepts across units — rather than cramming — build the understanding the 60-question MCQ tests." },
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
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><TrendingUp size={13} color="#203567" strokeWidth={2} /></div>
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
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#203567", letterSpacing: "-0.025em" }}>AP Microeconomics Score Calculator FAQ</h2>
            <p style={{ fontSize: 15, color: "#8899bb", marginTop: 10 }}>Everything you need to know about how AP Microeconomics is scored.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16 }}>Stop estimating. Start mastering.</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>Turn your AP Microeconomics notes into unlimited unit-by-unit practice questions and graph drills. Track your progress to a 5.</p>
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