"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight, CheckCircle, Zap, BarChart2, Brain, BookOpen, TrendingUp, RefreshCw, Copy, Trash2, Info, Lock, PenLine, Search, Library, Shield, Lightbulb, Target, Briefcase, GraduationCap, Newspaper, Feather } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// PASSIVE VOICE DETECTION ENGINE (real regex, no AI needed)
// ─────────────────────────────────────────────────────────────────────────────

// All forms of "to be"
const TO_BE = [
  "am","is","are","was","were","be","been","being",
  "will be","shall be","would be","can be","could be",
  "may be","might be","must be","should be","ought to be",
  "has been","have been","had been",
  "will have been","would have been","could have been","should have been","might have been",
  "is being","are being","was being","were being",
];

// Irregular past participles (common ones)
const IRREGULAR_PP: Record<string, string> = {
  awoken:"awoken",beaten:"beaten",become:"become",begun:"begun",bent:"bent",bet:"bet",
  bitten:"bitten",bled:"bled",blown:"blown",broken:"broken",built:"built",burned:"burned",
  burnt:"burnt",bought:"bought",caught:"caught",chosen:"chosen",come:"come",cost:"cost",
  cut:"cut",dealt:"dealt",dug:"dug",done:"done",drawn:"drawn",dreamed:"dreamed",
  dreamt:"dreamt",driven:"driven",drunk:"drunk",eaten:"eaten",fallen:"fallen",fed:"fed",
  felt:"felt",fought:"fought",found:"found",flown:"flown",forbidden:"forbidden",
  forgotten:"forgotten",forgiven:"forgiven",frozen:"frozen",given:"given",gone:"gone",
  gotten:"gotten",grown:"grown",had:"had",heard:"heard",hidden:"hidden",hit:"hit",
  held:"held",hurt:"hurt",kept:"kept",known:"known",laid:"laid",led:"led",left:"left",
  lent:"lent",let:"let",lain:"lain",lit:"lit",lost:"lost",made:"made",meant:"meant",
  met:"met",paid:"paid",put:"put",quit:"quit",read:"read",ridden:"ridden",rung:"rung",
  risen:"risen",run:"run",said:"said",seen:"seen",sold:"sold",sent:"sent",set:"set",
  sewn:"sewn",shaken:"shaken",shone:"shone",shot:"shot",shown:"shown",shrunk:"shrunk",
  shut:"shut",sung:"sung",sunk:"sunk",sat:"sat",slept:"slept",slid:"slid",spoken:"spoken",
  spent:"spent",spun:"spun",spread:"spread",stood:"stood",stolen:"stolen",stuck:"stuck",
  stung:"stung",struck:"struck",sworn:"sworn",swum:"swum",taken:"taken",taught:"taught",
  torn:"torn",told:"told",thought:"thought",thrown:"thrown",understood:"understood",
  woken:"woken",worn:"worn",won:"won",written:"written",withdrawn:"withdrawn",
  withstood:"withstood",wound:"wound",
};

// Check if a word looks like a past participle (ends in -ed, or is irregular)
function isPastParticiple(word: string): boolean {
  const w = word.toLowerCase();
  if (IRREGULAR_PP[w]) return true;
  // Regular past participle: ends in -ed
  if (/ed$/.test(w) && w.length > 3) return true;
  return false;
}

// Build a master regex for all "to be" variants, longest first
const TO_BE_SORTED = [...TO_BE].sort((a, b) => b.length - a.length);
const TO_BE_PATTERN = TO_BE_SORTED.map(t => t.replace(/\s+/g, "\\s+")).join("|");
const PASSIVE_REGEX = new RegExp(
  `\\b(${TO_BE_PATTERN})\\b\\s+(\\w+)`,
  "gi"
);

export interface PassiveMatch {
  fullMatch: string;
  beVerb: string;
  participle: string;
  index: number;
  sentence: string;
  sentenceStart: number;
  suggestion: string;
}

function detectPassiveVoice(text: string): PassiveMatch[] {
  const results: PassiveMatch[] = [];
  const seen = new Set<number>();

  let m: RegExpExecArray | null;
  PASSIVE_REGEX.lastIndex = 0;

  while ((m = PASSIVE_REGEX.exec(text)) !== null) {
    const beVerb = m[1];
    const nextWord = m[2];
    if (!isPastParticiple(nextWord)) continue;
    if (seen.has(m.index)) continue;
    seen.add(m.index);

    // Find containing sentence
    const before = text.lastIndexOf(".", m.index);
    const after = text.indexOf(".", m.index + m[0].length);
    const sentStart = before === -1 ? 0 : before + 1;
    const sentEnd = after === -1 ? text.length : after + 1;
    const sentence = text.slice(sentStart, sentEnd).trim();

    // Build suggestion hint
    const suggestion = buildSuggestion(beVerb, nextWord, sentence);

    results.push({
      fullMatch: m[0],
      beVerb,
      participle: nextWord,
      index: m.index,
      sentence,
      sentenceStart: sentStart,
      suggestion,
    });
  }

  return results;
}

function buildSuggestion(beVerb: string, participle: string, sentence: string): string {
  // Give actionable rewrite hint
  const byMatch = sentence.match(/by\s+([\w\s]+?)(?:[.,;!?]|$)/i);
  if (byMatch) {
    const agent = byMatch[1].trim();
    return `Try making "${agent}" the subject: "[${agent}] + active verb + object"`;
  }
  return `Rewrite with an active subject performing the action: "[Subject] ${toActiveHint(participle)} [object]"`;
}

function toActiveHint(participle: string): string {
  // Strip -ed to give a rough base verb hint
  const p = participle.toLowerCase();
  if (IRREGULAR_PP[p]) {
    const baseMap: Record<string, string> = {
      written:"write", done:"do", taken:"take", given:"give", seen:"see",
      made:"make", known:"know", shown:"show", broken:"break", spoken:"speak",
      chosen:"choose", drawn:"draw", driven:"drive", eaten:"eat", fallen:"fall",
      forgotten:"forget", frozen:"freeze", grown:"grow", hidden:"hide", known:"know",
      risen:"rise", stolen:"steal", thrown:"throw", torn:"tear", worn:"wear",
    };
    return baseMap[p] || p;
  }
  if (p.endsWith("ied")) return p.slice(0, -3) + "y";
  if (p.endsWith("ed")) {
    const base = p.slice(0, -2);
    if (/[aeiou][^aeiou]$/.test(base.slice(0, -1))) return base.slice(0, -1); // doubled consonant
    return base;
  }
  return participle;
}

function getReadabilityScore(text: string, passiveCount: number): { label: string; color: string; score: number } {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  if (sentences === 0) return { label: "N/A", color: "#aaa", score: 0 };
  const rate = passiveCount / sentences;
  if (rate === 0) return { label: "Excellent — Active", color: "#1a7a4a", score: 100 };
  if (rate < 0.1) return { label: "Very Good", color: "#2d6e9e", score: 85 };
  if (rate < 0.2) return { label: "Good", color: "#4a7cc7", score: 70 };
  if (rate < 0.35) return { label: "Needs Work", color: "#8a6a00", score: 50 };
  return { label: "Heavy Passive Use", color: "#c83232", score: 25 };
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function countSentences(text: string): number {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// HIGHLIGHT ENGINE — renders text with inline highlights
// ─────────────────────────────────────────────────────────────────────────────
function HighlightedText({ text, matches, activeIdx, onSelect }: {
  text: string;
  matches: PassiveMatch[];
  activeIdx: number | null;
  onSelect: (i: number) => void;
}) {
  if (!text) return null;

  const ranges: Array<{ start: number; end: number; matchIdx: number }> = matches.map((m, i) => ({
    start: m.index,
    end: m.index + m.fullMatch.length,
    matchIdx: i,
  }));

  // Build segments
  const segments: React.ReactNode[] = [];
  let pos = 0;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);

  for (const range of sorted) {
    if (range.start < pos) continue;
    if (range.start > pos) {
      segments.push(<span key={`t-${pos}`}>{text.slice(pos, range.start)}</span>);
    }
    const isActive = activeIdx === range.matchIdx;
    segments.push(
      <mark
        key={`m-${range.start}`}
        onClick={() => onSelect(range.matchIdx)}
        style={{
          background: isActive ? "rgba(32,53,103,0.18)" : "rgba(200,80,50,0.13)",
          borderBottom: `2px solid ${isActive ? "#203567" : "#c84c1a"}`,
          borderRadius: 2,
          cursor: "pointer",
          padding: "1px 2px",
          color: "inherit",
          transition: "background 0.15s",
        }}
      >
        {text.slice(range.start, range.end)}
      </mark>
    );
    pos = range.end;
  }
  if (pos < text.length) segments.push(<span key={`t-end`}>{text.slice(pos)}</span>);

  return <>{segments}</>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LUNORA LOGO
// ─────────────────────────────────────────────────────────────────────────────
function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const svgSizes = { sm: 90, md: 120, lg: 140 };
  const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size]; const ts = textSizes[size];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, userSelect: "none" }}>
      <svg viewBox="0 0 100 100" style={{ width: s, height: s, transform: "rotate(40deg)", flexShrink: 0 }}>
        <defs>
          <mask id={`lm-pvc-${light ? "l" : "d"}`}>
            <rect width="100" height="100" fill="white" />
            <circle cx="57" cy="50" r="40" fill="black" />
          </mask>
        </defs>
        <circle cx="50" cy="50" r="42" fill={light ? "white" : "#203567"} mask={`url(#lm-pvc-${light ? "l" : "d"})`} />
      </svg>
      <span style={{ fontSize: ts, fontWeight: 300, letterSpacing: "0.12em", color: light ? "white" : "#1a1a1a", marginLeft: -60, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>lunora</span>
    </div>
  );
}

// FAQ
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: "1px solid #eef0f8" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ fontWeight: 600, fontSize: 15, color: "#203567", paddingRight: 16, lineHeight: 1.4 }}>{q}</span>
        <span style={{ color: "#203567", transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "none", flexShrink: 0 }}><ChevronDown size={18} /></span>
      </button>
      <div style={{ maxHeight: open ? 600 : 0, opacity: open ? 1 : 0, overflow: "hidden", transition: "max-height 0.35s ease, opacity 0.3s" }}>
        <p style={{ fontSize: 14, color: "#555", lineHeight: 1.8, paddingBottom: 20 }}>{a}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const DEMO_TEXT = `The experiment was conducted in a small laboratory. The equipment was arranged carefully before the test was started. Several chemicals were mixed, and the reaction was observed by the researchers. Detailed notes were taken during the process, and the results were recorded in a report. Later, the data was analyzed and conclusions were drawn. Finally, the findings were presented to the scientific community.`;

export default function PassiveVoiceCheckerPage() {
  const [text, setText] = useState(DEMO_TEXT);
  const [matches, setMatches] = useState<PassiveMatch[]>([]);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [ignored, setIgnored] = useState<Set<number>>(new Set());
  const [scrolled, setScrolled] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // Run detection whenever text changes
  useEffect(() => {
    if (!text.trim()) { setMatches([]); return; }
    const detected = detectPassiveVoice(text);
    setMatches(detected);
    setActiveIdx(null);
    setIgnored(new Set());
  }, [text]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const visibleMatches = matches.filter((_, i) => !ignored.has(i));
  const wordCount = countWords(text);
  const sentenceCount = countSentences(text);
  const readability = getReadabilityScore(text, visibleMatches.length);
  const passiveRate = sentenceCount > 0 ? Math.round((visibleMatches.length / sentenceCount) * 100) : 0;

  const handleIgnore = (i: number) => {
    setIgnored(prev => new Set([...prev, i]));
    setActiveIdx(null);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleClear = () => { setText(""); setMatches([]); setIgnored(new Set()); setActiveIdx(null); };

  const handleSelectSuggestion = (idx: number) => {
    setActiveIdx(idx);
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const faqs = [
    {
      q: "What is passive voice?",
      a: "Passive voice is a grammatical construction where the subject of a sentence is the recipient of the action rather than the performer. It uses a form of 'to be' followed by a past participle. For example: 'The report was written by Sarah' (passive) vs 'Sarah wrote the report' (active). Active voice is nearly always clearer, more direct, and more engaging for readers.",
    },
    {
      q: "Why should I avoid passive voice in my writing?",
      a: "Passive voice tends to make sentences longer, more ambiguous, and harder to read. It often hides who is responsible for the action, which creates vagueness — particularly damaging in business writing, journalism, and academic work. Style guides including APA, Chicago, and most corporate style manuals recommend minimizing passive voice. A sentence written in passive voice can almost always be rewritten more powerfully in active voice.",
    },
    {
      q: "How does this passive voice checker work?",
      a: "This passive voice checker uses a regex-based linguistic engine. It scans your text for all forms of the verb 'to be' (is, are, was, were, has been, will be, etc.) followed by past participles — both regular -ed forms and irregular forms like 'written', 'taken', 'given', and over 60 others. Each detected instance is highlighted inline with a suggested active rewrite. No AI, no server calls — it runs entirely in your browser.",
    },
    {
      q: "Is some passive voice acceptable?",
      a: "Yes. Passive voice is appropriate when the agent is unknown ('The window was broken'), unimportant ('Mistakes were made'), or deliberately withheld. Scientific writing sometimes prefers passive voice to maintain objectivity ('The samples were tested'). Legal writing uses it strategically. The goal isn't zero passive voice — it's intentional passive voice. Most writing benefits from keeping passive usage below 10–15% of sentences.",
    },
    {
      q: "What's the difference between passive voice and weak writing in general?",
      a: "Passive voice is one specific grammatical pattern — a 'to be' verb plus past participle. Weak writing also includes nominalizations ('make a decision' instead of 'decide'), overuse of adverbs, vague quantifiers ('many,' 'some'), and throat-clearing phrases ('It is worth noting that...'). This checker focuses on passive voice specifically, which is the most common and impactful single writing pattern to improve.",
    },
    {
      q: "How does this passive voice checker compare to Grammarly?",
      a: "Grammarly's passive voice detection is bundled into a broader grammar suite and often paywalled for full suggestions. This checker is completely free, runs in your browser without any account or data upload, and focuses exclusively on passive voice — giving you immediate inline highlights and actionable rewrite suggestions. For passive voice specifically, a focused tool like this is often more useful than a general grammar checker.",
    },
    {
      q: "Can I use this passive voice checker for academic writing?",
      a: "Yes — and it's especially valuable there. Academic writing has a complicated relationship with passive voice: it's common in scientific papers but often overused in humanities essays, theses, and dissertations. Many thesis advisors and journal editors explicitly require minimising passive constructions outside of method sections. Use this checker when drafting essays, lab reports, literature reviews, or any academic document to catch passive overuse before submission.",
    },
    {
      q: "Does passive voice affect SEO?",
      a: "Indirectly, yes. Google's ranking systems evaluate content quality and readability signals. Passive-heavy writing tends to produce longer, less clear sentences — increasing bounce rates and reducing time-on-page, both negative signals. The Yoast SEO plugin for WordPress explicitly flags passive voice overuse as a readability problem. For content marketing, blog posts, and landing pages, active voice directly improves engagement metrics that influence search rankings.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }

        .nav-link { color: #555; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s; position: relative; }
        .nav-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 0; height: 1.5px; background: #203567; transition: width 0.25s; }
        .nav-link:hover { color: #203567; } .nav-link:hover::after { width: 100%; }

        .btn-primary { background: #203567; color: white; border: none; border-radius: 100px; padding: 14px 32px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s, transform 0.15s, box-shadow 0.2s; font-family: 'DM Sans', sans-serif; display: inline-flex; align-items: center; justify-content: center; gap: 8px; text-decoration: none; }
        .btn-primary:hover { background: #162a54; transform: translateY(-1px); box-shadow: 0 8px 30px rgba(32,53,103,0.3); }

        .tag-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 14px; border-radius: 100px; background: rgba(32,53,103,0.07); border: 1px solid rgba(32,53,103,0.12); font-size: 11px; font-weight: 700; color: #203567; letter-spacing: 0.08em; text-transform: uppercase; font-family: 'DM Sans', sans-serif; }

        .hide-mobile { display: none !important; }
        @media(min-width: 769px) { .hide-mobile { display: flex !important; } }

        .tool-grid { display: grid; grid-template-columns: 1fr 340px; gap: 28px; max-width: 1180px; margin: 0 auto; align-items: start; }
        @media(max-width: 920px) { .tool-grid { grid-template-columns: 1fr; } }

        .card { border-radius: 20px; border: 1.5px solid #eef0f8; background: white; padding: 24px; }

        .stat-chip { display: flex; flex-direction: column; align-items: center; padding: 14px 20px; borderRadius: 14px; background: rgba(32,53,103,0.04); border: 1px solid rgba(32,53,103,0.08); gap: 3px; }

        .match-item { padding: 14px 16px; border-radius: 12px; border: 1.5px solid #eef0f8; cursor: pointer; transition: border-color 0.15s, background 0.15s, transform 0.15s; }
        .match-item:hover { border-color: rgba(32,53,103,0.25); background: rgba(32,53,103,0.02); transform: translateX(2px); }
        .match-item.active { border-color: #203567; background: rgba(32,53,103,0.04); }

        .writing-area { width: 100%; min-height: 280px; resize: vertical; padding: 20px; border: 1.5px solid #eef0f8; border-radius: 16px; font-family: 'DM Sans', sans-serif; font-size: 15px; line-height: 1.8; color: #1a1a1a; outline: none; background: #fafbfd; transition: border-color 0.2s; }
        .writing-area:focus { border-color: #203567; background: #fff; }

        .preview-area { padding: 20px; border: 1.5px solid #eef0f8; border-radius: 16px; min-height: 280px; font-size: 15px; line-height: 1.8; color: #1a1a1a; white-space: pre-wrap; word-break: break-word; background: #fafbfd; cursor: default; }

        .icon-btn { display: flex; align-items: center; gap: 6px; padding: 8px 16px; border: 1.5px solid #eef0f8; border-radius: 100px; background: white; cursor: pointer; font-size: 12px; font-weight: 600; color: #666; font-family: 'DM Sans', sans-serif; transition: border-color 0.2s, color 0.2s, background 0.2s; }
        .icon-btn:hover { border-color: #203567; color: #203567; }

        .progress-bar { height: 6px; background: #eef0f8; border-radius: 100px; overflow: hidden; margin-top: 8px; }
        .progress-fill { height: 100%; border-radius: 100px; transition: width 0.6s ease; }

        .feature-card { padding: 24px; border-radius: 18px; border: 1.5px solid #eef0f8; background: #fafbfd; transition: box-shadow 0.2s, transform 0.2s; }
        .feature-card:hover { box-shadow: 0 8px 32px rgba(32,53,103,0.10); transform: translateY(-2px); }

        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 18px; }

        .article-body h2 { font-size: 26px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.02em; line-height: 1.25; margin: 40px 0 16px; }
        .article-body h3 { font-size: 18px; font-weight: 700; color: #203567; margin: 28px 0 12px; }
        .article-body p { font-size: 15px; line-height: 1.85; color: #444; margin-bottom: 18px; }
        .article-body strong { color: #1a1a1a; font-weight: 700; }

        .promo-grid { display: grid; grid-template-columns: 1fr; gap: 48px; align-items: center; }
        @media(min-width: 768px) { .promo-grid { grid-template-columns: 1fr 1fr; } }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.5s ease both; }

        .score-ring { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid; flex-direction: column; }
      `}</style>

      {/* ── JSON-LD ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": "Free Passive Voice Checker",
        "description": "Free passive voice checker tool — instantly detects passive voice in your writing and suggests active voice alternatives. No signup, no data upload, runs in browser.",
        "url": "https://lunora.app/tools/passive-voice-checker",
        "applicationCategory": "EducationApplication",
        "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
        "author": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" },
        "featureList": ["Passive voice detection", "Active voice suggestions", "Readability score", "Word count", "Sentence analysis"],
      })}} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(f => ({ "@type": "Question", "name": f.q, "acceptedAnswer": { "@type": "Answer", "text": f.a } }))
      })}} />

      {/* ── NAV ── */}
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

      {/* ── HERO ── */}
      <section style={{ padding: "160px 24px 56px", background: "linear-gradient(180deg,#f8f9fd 0%,#fff 100%)" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div className="tag-pill"><Zap size={11} color="#203567" strokeWidth={2.5} />Free Tool · Writing</div>
          </div>
          <h1 style={{ fontSize: "clamp(32px,5.5vw,58px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", marginBottom: 16 }}>
            Free{" "}
            <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>Passive Voice Checker</span>
          </h1>
          <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 24px" }}>
            Instantly detects <strong style={{ color: "#1a1a1a" }}>passive voice</strong> in your writing and suggests stronger, active alternatives. No signup. No data upload. Runs in your browser.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {[
              { Icon: Zap, text: "Instant detection" },
              { Icon: Lock, text: "100% private — browser only" },
              { Icon: PenLine, text: "Active voice suggestions" },
            ].map(({ Icon, text }, i) => (
              <span key={i} style={{ fontSize: 13, color: "#888", display: "flex", alignItems: "center", gap: 6 }}>
                <Icon size={13} color="#203567" strokeWidth={2} /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── TOOL ── */}
      <section style={{ padding: "0 24px 80px" }}>
        <div className="tool-grid">

          {/* Left — Editor */}
          <div>
            {/* Stats bar */}
            <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
              {[
                { label: "Passive found", value: visibleMatches.length.toString(), color: visibleMatches.length === 0 ? "#1a7a4a" : "#c84c1a" },
                { label: "Words", value: wordCount.toString(), color: "#203567" },
                { label: "Sentences", value: sentenceCount.toString(), color: "#203567" },
                { label: "Passive rate", value: `${passiveRate}%`, color: passiveRate === 0 ? "#1a7a4a" : passiveRate > 20 ? "#c83232" : "#8a6a00" },
                { label: "Clarity", value: readability.label, color: readability.color },
              ].map(({ label, value, color }, i) => (
                <div key={i} style={{ padding: "8px 16px", borderRadius: 100, background: "rgba(32,53,103,0.04)", border: "1px solid rgba(32,53,103,0.08)", display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <button className="icon-btn" onClick={handleCopy}>
                {copied ? <CheckCircle size={12} color="#1a7a4a" /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy text"}
              </button>
              <button className="icon-btn" onClick={handleClear}>
                <Trash2 size={12} /> Clear
              </button>
              <button className="icon-btn" onClick={() => setText(DEMO_TEXT)}>
                <RefreshCw size={12} /> Load demo
              </button>
            </div>

            {/* Textarea */}
            <div style={{ position: "relative", marginBottom: 16 }}>
              <textarea
                ref={textareaRef}
                className="writing-area"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Paste or type your text here to check for passive voice..."
                spellCheck={false}
              />
            </div>

            {/* Highlighted preview */}
            {text.trim() && matches.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#203567", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 8 }}>
                  Highlighted Preview <span style={{ fontWeight: 400, color: "#aaa", textTransform: "none", letterSpacing: 0 }}>— click a highlight to focus</span>
                </div>
                <div className="preview-area" ref={resultRef}>
                  <HighlightedText text={text} matches={matches} activeIdx={activeIdx} onSelect={handleSelectSuggestion} />
                </div>
              </div>
            )}

            {/* No passive — success state */}
            {text.trim() && visibleMatches.length === 0 && (
              <div style={{ padding: "24px", borderRadius: 16, background: "rgba(26,122,74,0.06)", border: "1.5px solid rgba(26,122,74,0.2)", textAlign: "center", marginBottom: 16 }} className="fade-up">
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(26,122,74,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <CheckCircle size={24} color="#1a7a4a" strokeWidth={2} />
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 18, color: "#1a7a4a", marginBottom: 4 }}>No passive voice detected</div>
                <div style={{ fontSize: 14, color: "#555" }}>Your writing is clear, direct, and active. Excellent work.</div>
              </div>
            )}

            {/* SEO Article Content */}
            <div className="article-body" style={{ marginTop: 48 }}>
              <h2>What is a passive voice checker?</h2>
              <p>
                A <strong>passive voice checker</strong> is a writing tool that scans your text and identifies sentences where the grammatical subject is being acted upon rather than performing the action. Every instance of passive voice involves a form of the verb <em>to be</em> (is, are, was, were, has been, will be, etc.) followed by a past participle (written, done, taken, observed, recorded).
              </p>
              <p>
                This free <strong>passive voice detector</strong> uses a linguistic regex engine to find all passive constructions in your writing — including irregular past participles like "written," "given," "taken," and "shown" — and suggests active alternatives that make your sentences clearer and more compelling.
              </p>

              <h2>Why does passive voice weaken your writing?</h2>
              <p>
                Passive voice isn't a grammatical error, but it consistently makes writing weaker. Here's why:
              </p>
              <p>
                <strong>It hides the actor.</strong> "The decision was made" tells you nothing about who made it. "The board made the decision" is clear, accountable, and direct. In business writing, journalism, and academic prose, ambiguity about responsibility is rarely a feature.
              </p>
              <p>
                <strong>It adds unnecessary words.</strong> "The report was written by the team" (7 words) vs "The team wrote the report" (5 words). Multiply that across a 2,000-word document and the difference in reader effort is significant.
              </p>
              <p>
                <strong>It reduces engagement.</strong> Active sentences have energy. "The researchers observed the reaction" moves forward. "The reaction was observed by the researchers" is inert. For content marketing, blog posts, and any writing where engagement matters, passive overuse is a measurable problem.
              </p>

              <h2>How to use this passive voice checker</h2>
              <p>
                Paste or type your text into the editor above. The <strong>passive voice checker</strong> runs automatically — no button to press. Every passive construction is highlighted in the preview panel, colour-coded for quick scanning. Click any highlight to see the specific passive phrase and a targeted rewrite suggestion in the right-hand panel.
              </p>
              <p>
                Use the <em>Ignore</em> button on any suggestion to dismiss it — useful for intentional passive use in scientific methods sections or legal writing. The passive rate metric tracks what percentage of your sentences contain passive voice.
              </p>

              <h2>When is passive voice acceptable?</h2>
              <p>
                Not all passive voice should be eliminated. Use it intentionally when the actor is unknown ("The window was broken"), unimportant ("Vaccines are administered annually"), or when scientific objectivity is the goal ("The samples were tested at 37°C"). Style guides generally recommend keeping passive usage below 10–15% of total sentences for most writing types.
              </p>
            </div>
          </div>

          {/* Right — Suggestions Panel */}
          <div>
            <div style={{ position: "sticky", top: 140, display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Clarity gauge */}
              <div className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Writing Clarity</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 16 }}>
                  <div style={{ width: 80, height: 80, borderRadius: "50%", border: `5px solid ${readability.color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color: readability.color, lineHeight: 1 }}>{readability.score}</span>
                    <span style={{ fontSize: 9, color: "#aaa", fontWeight: 600 }}>/ 100</span>
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: readability.color }}>{readability.label}</div>
                    <div style={{ fontSize: 12, color: "#aaa", marginTop: 3 }}>{visibleMatches.length} passive {visibleMatches.length === 1 ? "instance" : "instances"}</div>
                    <div style={{ fontSize: 12, color: "#aaa" }}>{passiveRate}% of sentences</div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Words", value: wordCount },
                    { label: "Sentences", value: sentenceCount },
                    { label: "Passive", value: visibleMatches.length },
                  ].map(({ label, value }, i) => (
                    <div key={i} style={{ padding: "10px", borderRadius: 10, background: "rgba(32,53,103,0.04)", border: "1px solid rgba(32,53,103,0.08)" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#203567" }}>{value}</div>
                      <div style={{ fontSize: 10, color: "#aaa", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Suggestions list */}
              {visibleMatches.length > 0 && (
                <div className="card">
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 14 }}>
                    {visibleMatches.length} Passive {visibleMatches.length === 1 ? "Instance" : "Instances"} Found
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 420, overflowY: "auto", paddingRight: 4 }}>
                    {matches.map((m, i) => {
                      if (ignored.has(i)) return null;
                      const isActive = activeIdx === i;
                      return (
                        <div
                          key={i}
                          className={`match-item${isActive ? " active" : ""}`}
                          onClick={() => setActiveIdx(isActive ? null : i)}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              <span style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(200,76,26,0.1)", color: "#c84c1a", fontSize: 10, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</span>
                              <code style={{ fontSize: 13, fontWeight: 700, color: "#c84c1a", background: "rgba(200,76,26,0.08)", padding: "2px 8px", borderRadius: 6 }}>{m.fullMatch}</code>
                            </div>
                            <button
                              onClick={e => { e.stopPropagation(); handleIgnore(i); }}
                              style={{ fontSize: 10, color: "#ccc", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 600, padding: "2px 6px" }}
                              title="Ignore this instance"
                            >
                              Ignore
                            </button>
                          </div>
                          {isActive && (
                            <div className="fade-up" style={{ marginTop: 8 }}>
                              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, lineHeight: 1.5 }}>
                                <span style={{ fontWeight: 700, color: "#555" }}>Sentence: </span>
                                <em>"{m.sentence.slice(0, 100)}{m.sentence.length > 100 ? "…" : ""}"</em>
                              </div>
                              <div style={{ padding: "10px 12px", background: "rgba(32,53,103,0.06)", borderRadius: 8, fontSize: 12, color: "#203567", lineHeight: 1.55, borderLeft: "3px solid #203567", display: "flex", gap: 8, alignItems: "flex-start" }}>
                                <Lightbulb size={13} color="#203567" strokeWidth={2} style={{ flexShrink: 0, marginTop: 1 }} />
                                <span><span style={{ fontWeight: 700 }}>Suggestion: </span>{m.suggestion}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Lunora CTA card */}
              <div style={{ background: "#203567", borderRadius: 20, padding: "28px 24px" }}>
                <LunoraLogo light size="sm" />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: "white", lineHeight: 1.3, marginTop: 14, marginBottom: 10, fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.015em" }}>
                  Master your writing with{" "}
                  <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>Lunora</span>
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 13, lineHeight: 1.65, marginBottom: 18 }}>
                  Fix passive voice and build real writing mastery. Upload your notes, essays, or study material and generate unlimited practice questions.
                </p>
                {["Unlimited active recall questions", "Deep-dive on weak writing patterns", "Works with any subject or material"].map((f, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 9, color: "white", fontWeight: 800 }}>✓</span>
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>{f}</span>
                  </div>
                ))}
                <Link href="/signin" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 13, padding: "12px 20px", borderRadius: 100, textDecoration: "none", marginTop: 18 }}>
                  Try Lunora free <ArrowRight size={13} color="#203567" strokeWidth={2.5} />
                </Link>
                <div style={{ textAlign: "center", marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>No credit card needed</div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill"><Info size={11} strokeWidth={2.5} />How it works</div></div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>What this passive voice checker detects</h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 520, margin: "0 auto" }}>
              A full linguistic engine — not just keyword matching. It understands all passive voice patterns, regular and irregular.
            </p>
          </div>
          <div className="features-grid">
            {[
              { Icon: Search, title: "All 'to be' forms", body: "Detects is, are, was, were, been, being, has been, have been, had been, will be, can be, could be, might be, should be, would be, and all compound forms — nothing slips through." },
              { Icon: Library, title: "60+ irregular past participles", body: "Catches irregular forms like written, given, taken, seen, done, broken, chosen, drawn, driven, spoken, stolen, thrown, worn, and dozens more — not just -ed endings." },
              { Icon: Zap, title: "Instant, browser-only", body: "Zero server calls. Your text never leaves your device. The detection engine runs entirely in JavaScript with real regex patterns — instant results, maximum privacy." },
              { Icon: Lightbulb, title: "Actionable suggestions", body: "Every detected passive gets a rewrite suggestion: identify the agent from 'by [agent]' phrases where present, and provide a structural template for converting to active voice." },
              { Icon: Target, title: "Selective ignoring", body: "Not all passive voice should be rewritten. Dismiss individual instances — useful for scientific methods sections, legal writing, or stylistic choices — without losing track of the rest." },
              { Icon: BarChart2, title: "Clarity score & rate", body: "A per-sentence passive rate gives you an objective metric: how much of your writing is passive? Industry style guides recommend below 10–15% for most writing types." },
            ].map(({ Icon, title, body }, i) => (
              <div key={i} className="feature-card">
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={20} color="#203567" strokeWidth={1.75} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#1a1a1a", marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, color: "#777", lineHeight: 1.65 }}>{body}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO ── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }} className="promo-grid">
          <div>
            <LunoraLogo light size="sm" />
            <h2 style={{ fontSize: "clamp(26px,4vw,38px)", fontWeight: 800, color: "white", lineHeight: 1.2, letterSpacing: "-0.025em", marginBottom: 16, marginTop: 20 }}>
              Fix passive voice and{" "}
              <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>actually master your writing.</span>
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", lineHeight: 1.75, marginBottom: 28 }}>
              Catching passive voice is one piece of writing improvement. The harder work is building habits — understanding why certain constructions weaken prose, recognising them on instinct, and knowing how to restructure sentences on the fly. Lunora turns your study material into unlimited active recall questions that train exactly those skills. Upload your essays, notes, or writing guides and practice the patterns that make writing genuinely stronger.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
              Try Lunora for free <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
            </Link>
            <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>No credit card needed</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { Icon: Zap, title: "Unlimited writing practice questions", body: "Upload any writing guide, essay rubric, or style handbook and generate targeted questions on grammar, style, and structure — covering passive voice, nominalization, wordiness, and more." },
              { Icon: Brain, title: "Active recall beats passive reading", body: "Reading a style guide doesn't build writing instinct. Being tested on it does. Lunora's active recall system forces you to produce answers from memory — the same skill you need when drafting under pressure." },
              { Icon: TrendingUp, title: "Track mastery across writing skills", body: "See which specific writing patterns — passive voice, vague language, overlong sentences — you've genuinely fixed vs which still need work, tracked across every practice session." },
              { Icon: BookOpen, title: "Works with any subject or course", body: "Whether you're studying professional writing, academic English, journalism, or preparing for standardized tests, Lunora generates practice from your actual course material." },
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

      {/* ── USE CASES ── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill">Use Cases</div></div>
            <h2 style={{ fontSize: 34, fontWeight: 800, color: "#1a1a1a", letterSpacing: "-0.025em", marginBottom: 12 }}>Who uses a passive voice checker?</h2>
            <p style={{ fontSize: 16, color: "#777", maxWidth: 520, margin: "0 auto" }}>Any writing that will be read by someone else benefits from active, direct prose.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { Icon: Briefcase, title: "Business Writers", items: ["Emails & proposals", "Reports & strategies", "Marketing copy", "Cover letters"] },
              { Icon: GraduationCap, title: "Students", items: ["Essays & theses", "Lab reports", "Assignments", "Application letters"] },
              { Icon: Newspaper, title: "Content Writers", items: ["Blog posts", "Articles", "Social media copy", "Press releases"] },
              { Icon: Feather, title: "Creative Writers", items: ["Fiction & memoirs", "Scripts", "Short stories", "Non-fiction"] },
            ].map(({ Icon, title, items }, i) => (
              <div key={i} style={{ padding: "22px", borderRadius: 18, border: "1.5px solid #eef0f8", background: "#fafbfd" }}>
                <div style={{ width: 42, height: 42, borderRadius: 11, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Icon size={20} color="#203567" strokeWidth={1.75} />
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#203567", marginBottom: 12 }}>{title}</div>
                {items.map((item, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 7 }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#203567", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "#555" }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "80px 24px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><div className="tag-pill">FAQ</div></div>
            <h2 style={{ fontSize: 36, fontWeight: 800, color: "#203567", letterSpacing: "-0.025em", marginBottom: 8 }}>Passive Voice Checker FAQ</h2>
            <p style={{ fontSize: 15, color: "#8899bb" }}>Everything you need to know about passive voice and how to fix it.</p>
          </div>
          {faqs.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>
      </section>

      {/* ── BOTTOM CTA ── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(28px,5vw,42px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
            Good writing starts with active voice.
          </h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>
            Build the habits that make every sentence stronger — one practice session at a time.
          </p>
          <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", color: "#203567", fontWeight: 800, fontSize: 16, padding: "16px 40px", borderRadius: 100, textDecoration: "none" }}>
            Try Lunora free <ArrowRight size={16} color="#203567" strokeWidth={2.5} />
          </Link>
        </div>
      </section>

      {/* ── FOOTER ── */}
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