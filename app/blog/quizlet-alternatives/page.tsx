"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Zap, BarChart2, RefreshCw, Star,
  Trophy, Medal, Award, Users, Layers,
  CheckCircle, XCircle, ArrowRight,
  Brain, Repeat,
  TrendingUp, Target, Shield,
  ThumbsUp, ThumbsDown, BadgeCheck,
  GraduationCap, Lock, Unlock,
} from "lucide-react";

// ─── Intersection Observer Hook ───────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setInView(true); },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

function FadeUp({
  children, delay = 0, className = "",
}: { children: React.ReactNode; delay?: number; className?: string }) {
  const [ref, inView] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(28px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

// ─── Moon Logo ────────────────────────────────────────────────────────────────
function LunoraLogo({ light = false, size = "md" }: { light?: boolean; size?: "sm" | "md" | "lg" }) {
  const svgSizes = { sm: 90, md: 120, lg: 140 };
  const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size];
  const ts = textSizes[size];
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
      <span style={{
        fontSize: ts, fontWeight: 300, letterSpacing: "0.12em",
        color: light ? "white" : "#1a1a1a", marginLeft: -60, marginTop: 6,
        fontFamily: "'DM Sans', sans-serif",
      }}>lunora</span>
    </div>
  );
}

// ─── Star Rating ──────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={13}
          fill={i <= rating ? "#203567" : "none"}
          color={i <= rating ? "#203567" : "#d0d5e8"}
          strokeWidth={1.5}
        />
      ))}
      <span style={{ fontSize: 12, color: "#888", fontWeight: 600, marginLeft: 4 }}>{rating}.0</span>
    </div>
  );
}

// ─── Free Badge ───────────────────────────────────────────────────────────────
function FreeBadge({ label }: { label: string }) {
  const isFree = label.toLowerCase().includes("free");
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 100,
      background: isFree ? "rgba(32,53,103,0.07)" : "rgba(200,50,50,0.06)",
      border: `1px solid ${isFree ? "rgba(32,53,103,0.15)" : "rgba(200,50,50,0.15)"}`,
    }}>
      {isFree
        ? <Unlock size={11} color="#203567" strokeWidth={2} />
        : <Lock size={11} color="#c83232" strokeWidth={2} />}
      <span style={{
        fontSize: 12, fontWeight: 700,
        color: isFree ? "#203567" : "#c83232",
        fontFamily: "'DM Sans', sans-serif",
      }}>{label}</span>
    </div>
  );
}

// ─── Alt Card ─────────────────────────────────────────────────────────────────
function AltCard({
  RankIcon, name, tagline, rating, best, worst, free, verdict, highlight = false,
}: {
  RankIcon: React.ElementType; name: string; tagline: string; rating: number;
  best: string; worst: string; free: string; verdict: string; highlight?: boolean;
}) {
  return (
    <div style={{
      borderRadius: 20,
      border: highlight ? "2px solid #203567" : "1.5px solid #eef0f8",
      background: highlight ? "linear-gradient(135deg,rgba(32,53,103,0.03) 0%,rgba(32,53,103,0.06) 100%)" : "#fff",
      padding: "28px 32px", position: "relative",
      transition: "box-shadow 0.2s, transform 0.2s",
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 12px 40px rgba(32,53,103,0.12)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {highlight && (
        <div style={{
          position: "absolute", top: -14, left: 28,
          background: "#203567", color: "white",
          fontSize: 11, fontWeight: 800, letterSpacing: "0.08em",
          textTransform: "uppercase", padding: "4px 14px", borderRadius: 100,
          fontFamily: "'DM Sans', sans-serif",
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <BadgeCheck size={12} color="white" strokeWidth={2.5} />
          Best Free Quizlet Alternative
        </div>
      )}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: highlight ? "#203567" : "rgba(32,53,103,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <RankIcon size={15} color={highlight ? "white" : "#203567"} strokeWidth={2} />
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: "#1a1a1a", margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{name}</h3>
          </div>
          <p style={{ fontSize: 14, color: "#666", margin: 0, lineHeight: 1.55, maxWidth: 480 }}>{tagline}</p>
        </div>
        <Stars rating={rating} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "rgba(32,53,103,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <ThumbsUp size={11} color="#203567" strokeWidth={2.5} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#203567", letterSpacing: "0.08em", textTransform: "uppercase" }}>Best for</span>
          </div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.55 }}>{best}</div>
        </div>
        <div style={{ background: "rgba(200,50,50,0.04)", borderRadius: 10, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <ThumbsDown size={11} color="#c83232" strokeWidth={2.5} />
            <span style={{ fontSize: 10, fontWeight: 800, color: "#c83232", letterSpacing: "0.08em", textTransform: "uppercase" }}>Watch out for</span>
          </div>
          <div style={{ fontSize: 13, color: "#444", lineHeight: 1.55 }}>{worst}</div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <FreeBadge label={free} />
        <span style={{ fontSize: 13, color: "#666", fontStyle: "italic", lineHeight: 1.5, maxWidth: "65%", textAlign: "right" }}>{verdict}</span>
      </div>
    </div>
  );
}

// ─── Comparison Table Row ─────────────────────────────────────────────────────
function CompRow({ label, quizlet, lunora }: { label: string; quizlet: string | boolean; lunora: string | boolean }) {
  const Cell = ({ v }: { v: string | boolean }) => {
    if (v === true) return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <CheckCircle size={14} color="#203567" strokeWidth={2} />
        <span style={{ fontSize: 13, color: "#203567", fontWeight: 600 }}>Yes</span>
      </div>
    );
    if (v === false) return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <XCircle size={14} color="#c83232" strokeWidth={2} />
        <span style={{ fontSize: 13, color: "#c83232", fontWeight: 500 }}>No</span>
      </div>
    );
    return <span style={{ fontSize: 13, color: "#444" }}>{v}</span>;
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderBottom: "1px solid #f0f3fa" }}>
      <div style={{ padding: "13px 16px", color: "#1a1a1a", fontWeight: 600, fontSize: 13, borderRight: "1px solid #f0f3fa" }}>{label}</div>
      <div style={{ padding: "13px 16px", borderRight: "1px solid #f0f3fa" }}><Cell v={quizlet} /></div>
      <div style={{ padding: "13px 16px" }}><Cell v={lunora} /></div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function QuizletAlternativesBlogPage() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tableOfContents = [
    { id: "why-alternatives", label: "Why look for Quizlet alternatives?" },
    { id: "best-alternatives", label: "Best Quizlet alternatives (2026)" },
    { id: "free-alternatives", label: "Free Quizlet alternatives — what works" },
    { id: "free-comparison", label: "Free tier comparison table" },
    { id: "quizlet-vs-lunora", label: "Quizlet vs Lunora" },
    { id: "which-is-best", label: "Which alternative is right for you?" },
    { id: "verdict", label: "Final verdict" },
    { id: "faq", label: "FAQ" },
  ];

  const alternatives = [
    {
      rank: 1, RankIcon: Trophy, name: "Lunora",
      tagline: "AI-powered mastery system — turns any PDF, document, or video into unlimited structured quizzes with full free progress tracking.",
      rating: 5, best: "Students who want to genuinely master a subject, not just flip cards",
      worst: "Not a passive review tool — you will be actively tested",
      free: "Free to start — no card needed",
      verdict: "The only free Quizlet alternative built for deep retention, not just memorization.", highlight: true,
    },
    {
      rank: 2, RankIcon: Medal, name: "Anki",
      tagline: "The gold-standard spaced repetition flashcard app. Completely free and open-source on desktop and Android.",
      rating: 4, best: "Long-term memory retention via spaced repetition scheduling",
      worst: "Steep learning curve, no AI, all card creation is manual",
      free: "Free (desktop + Android) — $24.99 one-time on iOS",
      verdict: "Powerful free Quizlet alternative if you put the setup time in.", highlight: false,
    },
    {
      rank: 3, RankIcon: Award, name: "Brainscape",
      tagline: "Confidence-based flashcard platform with shared decks and study analytics.",
      rating: 3, best: "Quick flashcard sessions with a confidence-rating system",
      worst: "Best decks and most features locked behind an expensive paid tier",
      free: "Free tier available — limited content",
      verdict: "Solid free Quizlet alternative for basic flashcards. Limited depth.", highlight: false,
    },
    {
      rank: 4, RankIcon: Users, name: "Kahoot!",
      tagline: "Game-based quiz platform built for classroom group engagement.",
      rating: 3, best: "Group learning, classroom energy, engagement",
      worst: "Not built for solo self-study or serious exam prep",
      free: "Free for basic classroom use",
      verdict: "Great in a classroom. Not a solo study tool.", highlight: false,
    },
    {
      rank: 5, RankIcon: Layers, name: "Quizizz",
      tagline: "Multiplayer quiz platform with self-paced modes and teacher assignment tools.",
      rating: 3, best: "Self-paced quizzes and teacher-assigned practice sets",
      worst: "No retention system, limited depth for independent study",
      free: "Free with ads",
      verdict: "Better than Quizlet for quizzes. Weaker for mastery.", highlight: false,
    },
    {
      rank: 6, RankIcon: BookOpen, name: "Cram",
      tagline: "Simple flashcard maker with a public deck library and no-frills interface.",
      rating: 2, best: "Quick and simple flashcards with zero learning curve",
      worst: "Outdated interface, no AI, no tracking whatsoever",
      free: "Free with limitations",
      verdict: "Bare-bones free Quizlet alternative. Does the basics, nothing more.", highlight: false,
    },
    {
      rank: 7, RankIcon: GraduationCap, name: "StudyBlue / Chegg Prep",
      tagline: "Flashcard and notes platform with a large library of pre-made shared content.",
      rating: 2, best: "Finding pre-made decks for popular textbooks and courses",
      worst: "Key features paywalled, no real learning or mastery system",
      free: "Free with heavy limitations",
      verdict: "Fine for pre-made content. Weak for building your own mastery.", highlight: false,
    },
  ];

  const summaryItems = [
    { Icon: Trophy, color: "#203567", bg: "rgba(32,53,103,0.07)", label: "Best overall", value: "Lunora — unlimited AI questions + free mastery tracking" },
    { Icon: Unlock, color: "#203567", bg: "rgba(32,53,103,0.07)", label: "Best free Quizlet alternative", value: "Lunora (free plan) or Anki (completely free, desktop)" },
    { Icon: Users, color: "#555", bg: "rgba(0,0,0,0.04)", label: "Best for classrooms", value: "Kahoot! or Quizizz" },
    { Icon: BookOpen, color: "#555", bg: "rgba(0,0,0,0.04)", label: "Best for pure flashcards", value: "Anki or Brainscape" },
    { Icon: Target, color: "#203567", bg: "rgba(32,53,103,0.07)", label: "Best for deep exam mastery", value: "Lunora — by a wide margin" },
  ];

  const lunoraCoreFeatures = [
    { Icon: Zap, title: "Unlimited free questions", desc: "Every subtopic, from every angle. Generate as many questions as you need — no deck limits, no paywalls." },
    { Icon: BarChart2, title: "Full attempt tracking", desc: "Best score, average score, subtopic breakdown — every quiz session logged automatically." },
    { Icon: Brain, title: "Deep-dive sidebar", desc: "Get stuck? Tap once for flashcards, mini quizzes, and concept summaries on that exact weak spot." },
    { Icon: RefreshCw, title: "Works with your own content", desc: "Upload any PDF, DOCX, video, or paste a YouTube link — questions generated from your actual material." },
  ];

  const choiceGuide = [
    { Icon: Target, label: "You want the best free Quizlet alternative for serious exam prep", answer: "Use Lunora. Free plan, unlimited questions, full tracking.", highlight: true },
    { Icon: Repeat, label: "You want pure spaced repetition and don't mind building decks manually", answer: "Use Anki. Free, proven, powerful.", highlight: false },
    { Icon: Users, label: "You want to make studying feel like a game in a classroom", answer: "Use Kahoot! or Quizizz.", highlight: false },
    { Icon: BookOpen, label: "You just need simple flashcards with a cleaner UI than Quizlet's free tier", answer: "Try Brainscape.", highlight: false },
    { Icon: TrendingUp, label: "You want to genuinely master a subject — not just review it", answer: "Lunora. Nothing else on this list is built for this.", highlight: true },
  ];

  const faqs = [
    {
      q: "What is the best free Quizlet alternative?",
      a: "The best free Quizlet alternative in 2026 is Lunora. Its free plan includes unlimited AI-generated questions from your own study material, a structured topic and subtopic system, deep-dive learning tools, and full attempt tracking — no credit card required. Anki is also completely free on desktop and Android and is excellent for spaced repetition, but requires you to create all cards manually.",
    },
    {
      q: "Is there a Quizlet alternative that is completely free?",
      a: "Yes. Anki is completely free with no paywall on desktop and Android. Lunora has a generous free tier with unlimited question generation and full progress tracking. Of all the Quizlet free alternatives, these two offer the most value without paying anything.",
    },
    {
      q: "What are the best Quizlet alternatives for college students?",
      a: "For college students, Lunora is the strongest option. You upload your actual lecture PDFs, course notes, or video lectures and Lunora turns them directly into structured practice questions — far more useful than a generic flashcard app for complex academic content.",
    },
    {
      q: "Can I use Lunora as a free Quizlet alternative?",
      a: "Yes. Lunora's free plan is fully functional for most students. You get unlimited question generation, a structured learning path, the deep-dive sidebar, and complete attempt history — all without entering payment details.",
    },
    {
      q: "What's better than Quizlet for actually learning?",
      a: "For genuine long-term retention, Lunora is better than Quizlet. Quizlet shows you flashcards. Lunora actively tests you, tracks your performance across subtopics, and identifies where you're still weak — then helps you fix it with targeted practice. That is how real mastery is built.",
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#fff", color: "#1a1a1a", fontFamily: "'DM Sans', sans-serif", overflowX: "hidden" }}>

      {/* ── Styles ──────────────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }

        .nav-link {
          color: #555; text-decoration: none; font-size: 14px; font-weight: 500;
          transition: color 0.2s; font-family: 'DM Sans', sans-serif; position: relative;
        }
        .nav-link::after {
          content: ''; position: absolute; bottom: -2px; left: 0;
          width: 0; height: 1.5px; background: #203567; transition: width 0.25s ease;
        }
        .nav-link:hover { color: #203567; }
        .nav-link:hover::after { width: 100%; }

        .btn-primary {
          background: #203567; color: white; border: none; border-radius: 100px;
          padding: 14px 32px; font-size: 15px; font-weight: 700; cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex; align-items: center; justify-content: center;
          text-decoration: none;
        }
        .btn-primary:hover {
          background: #162a54; transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(32,53,103,0.3);
        }

        .tag-pill {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 14px; border-radius: 100px;
          background: rgba(32,53,103,0.07); border: 1px solid rgba(32,53,103,0.12);
          font-size: 11px; font-weight: 700; color: #203567;
          letter-spacing: 0.08em; text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
        }

        .toc-link {
          display: block; padding: 8px 14px; border-radius: 8px;
          font-size: 13px; color: #666; text-decoration: none; font-weight: 500;
          transition: background 0.15s, color 0.15s;
        }
        .toc-link:hover { background: rgba(32,53,103,0.06); color: #203567; }

        .article-body h2 {
          font-size: 28px; font-weight: 800; color: #1a1a1a;
          letter-spacing: -0.02em; line-height: 1.2;
          margin: 52px 0 20px; padding-top: 16px;
          font-family: 'DM Sans', sans-serif;
        }
        .article-body h3 {
          font-size: 20px; font-weight: 700; color: #203567;
          margin: 32px 0 14px; font-family: 'DM Sans', sans-serif;
        }
        .article-body p {
          font-size: 16px; line-height: 1.85; color: #444; margin-bottom: 20px;
        }
        .article-body strong { color: #1a1a1a; font-weight: 700; }
        .article-body a { color: #203567; text-decoration: underline; }
        .article-body a:hover { text-decoration: none; }

        .hide-mobile { display: none !important; }
        @media(min-width: 769px) { .hide-mobile { display: flex !important; } }

        .layout-grid {
          display: grid; grid-template-columns: 1fr;
          gap: 48px; max-width: 1200px; margin: 0 auto; padding: 0 24px;
        }
        @media(min-width: 900px) {
          .layout-grid { grid-template-columns: 1fr 320px; align-items: start; }
        }

        .cta-card {
          background: #203567; border-radius: 24px; padding: 36px;
          position: sticky; top: 140px;
        }
        @media(max-width: 899px) { .cta-card { position: static; } }

        .feature-mini-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 32px 0;
        }
        @media(max-width: 599px) { .feature-mini-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* ── JSON-LD Article ──────────────────────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "7 Best Free Quizlet Alternatives in 2026 — Ranked for Real Learning",
        "description": "Looking for free Quizlet alternatives? We ranked every major Quizlet alternative free and paid in 2026 — so you know exactly which one is worth your time.",
        "author": { "@type": "Organization", "name": "Lunora" },
        "datePublished": "2026-03-01", "dateModified": "2026-03-01",
        "publisher": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" },
        "mainEntityOfPage": { "@type": "WebPage", "@id": "https://lunora.app/blog/quizlet-alternatives" },
        "keywords": "quizlet alternatives, quizlet alternatives free, quizlet free alternatives, free quizlet alternative",
      })}} />

      {/* ── JSON-LD FAQ ──────────────────────────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "What is the best free Quizlet alternative?", "acceptedAnswer": { "@type": "Answer", "text": "The best free Quizlet alternative in 2026 is Lunora. Its free plan includes unlimited AI-generated questions, structured topics, deep-dive learning tools, and full attempt tracking — no credit card required." } },
          { "@type": "Question", "name": "Is there a Quizlet alternative that is completely free?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Anki is completely free on desktop and Android. Lunora has a generous free tier with unlimited question generation and full progress tracking. Both are the strongest Quizlet free alternatives available." } },
          { "@type": "Question", "name": "What are the best Quizlet alternatives for studying?", "acceptedAnswer": { "@type": "Answer", "text": "For serious studying, Lunora is the best Quizlet alternative. Upload your own PDFs, notes, or videos and Lunora generates unlimited practice questions, tracks your scores across every subtopic, and helps you fix weak spots in real time." } },
        ],
      })}} />

      {/* ── NAV ──────────────────────────────────────────────────────────────── */}
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
            <Link href="/#features" className="nav-link">Features</Link>
            <Link href="/#how-it-works" className="nav-link">How it works</Link>
            <Link href="/#faq" className="nav-link">FAQ</Link>
          </div>
          <Link href="/signin" className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>Get Started</Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section style={{ padding: "160px 24px 64px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <FadeUp>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div className="tag-pill">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#203567", display: "inline-block" }} />
                Study Tools · 2026
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 style={{
              fontSize: "clamp(34px, 5.5vw, 56px)", fontWeight: 800,
              lineHeight: 1.1, letterSpacing: "-0.03em", color: "#1a1a1a",
              fontFamily: "'DM Sans', sans-serif", marginBottom: 20,
            }}>
              7 Best{" "}
              <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567" }}>
                Free Quizlet Alternatives
              </span>{" "}
              in 2026 — Ranked
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 600, margin: "0 auto 36px" }}>
              Quizlet locked its best features behind a paywall. We tested every major <strong style={{ color: "#1a1a1a" }}>Quizlet alternative free</strong> and paid — so you know exactly which one is worth your time.
            </p>
          </FadeUp>
          <FadeUp delay={0.25}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#203567,#4a6dd4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ color: "white", fontWeight: 800, fontSize: 14 }}>L</span>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>Lunora Team</div>
                  <div style={{ fontSize: 12, color: "#999" }}>Mar 2026 · 10 min read</div>
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: "#e0e4ee" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["#quizlet-alternatives", "#free", "#study-tools"].map(tag => (
                  <span key={tag} style={{ fontSize: 12, color: "#203567", background: "rgba(32,53,103,0.07)", padding: "3px 10px", borderRadius: 100, fontWeight: 600 }}>{tag}</span>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 64, paddingBottom: 100 }}>
        <div className="layout-grid">

          {/* ── ARTICLE ────────────────────────────────────────────────────── */}
          <article className="article-body">

            {/* Quick Summary */}
            <FadeUp>
              <div style={{ background: "#fafbfd", border: "1.5px solid #eef0f8", borderRadius: 20, padding: "28px 32px", marginBottom: 48 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#203567", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>Quick Summary</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {summaryItems.map(({ Icon, color, bg, label, value }, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                        <Icon size={15} color={color} strokeWidth={2} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: 14, color: "#333", lineHeight: 1.5, fontWeight: 500 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>

            {/* Section 1 — Why */}
            <FadeUp>
              <h2 id="why-alternatives">Why are students searching for Quizlet alternatives in 2026?</h2>
              <p>
                Quizlet used to be the default study app for millions of students. Free flashcards, shared sets, a clean interface. Then the paywall expanded. Core features — Learn mode, advanced testing, offline access — moved behind <strong>Quizlet Plus</strong> at $35.99 per year. For a student on a tight budget, that matters.
              </p>
              <p>
                But even setting the price aside, Quizlet has a deeper problem: it is a <strong>memorization tool, not a mastery tool</strong>. You flip cards. You see answers. You move on. There is no mechanism that forces you to prove you can recall something without a prompt. No system that tracks whether you genuinely understood a concept or just saw it enough times to recognize it.
              </p>
              <p>
                That is why searches for <strong>Quizlet alternatives</strong>, <strong>Quizlet alternatives free</strong>, and <strong>Quizlet free alternatives</strong> have kept growing. Students want something that does more — at no cost, or in a way that actually moves the needle on how well they learn. We tested every major option. Here is the honest breakdown.
              </p>
            </FadeUp>

            {/* Section 2 — Ranked list */}
            <FadeUp>
              <h2 id="best-alternatives">The 7 best Quizlet alternatives in 2026 — ranked</h2>
              <p>
                We ranked these on four criteria: how well they build genuine retention rather than surface review, whether there is a usable free tier, the quality of the learning system, and how well the product holds up in 2026.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 20, margin: "32px 0" }}>
                {alternatives.map((alt, i) => (
                  <FadeUp key={i} delay={i * 0.05}>
                    <AltCard {...alt} />
                  </FadeUp>
                ))}
              </div>
            </FadeUp>

            {/* Section 3 — Free */}
            <FadeUp>
              <h2 id="free-alternatives">Free Quizlet alternatives — what actually works without paying</h2>
              <p>
                Most so-called <strong>Quizlet free alternatives</strong> give you just enough to get started, then lock the useful features away. A few are genuinely strong on their free tier.
              </p>

              <h3>Lunora — best free Quizlet alternative for real studying</h3>
              <p>
                Lunora's free plan gives you unlimited question generation from any PDF, document, YouTube video, or link you upload. No credit card. No trial countdown. The structured topic and subtopic system, deep-dive learning sidebar, and full attempt tracking are all part of the free experience.
              </p>
              <p>
                For any student looking for a <strong>free Quizlet alternative</strong> that goes beyond flashcards, Lunora is the clearest answer. You bring your actual study material — lecture notes, a textbook chapter, a recorded lecture — and Lunora generates unlimited practice questions from it. When it detects what you are struggling with, it goes deeper there automatically.
              </p>

              <h3>Anki — best free Quizlet alternative for spaced repetition</h3>
              <p>
                Anki is completely free on desktop and Android (iOS is a one-time $24.99 purchase). It has been around for nearly two decades and has a large community of shared decks. The spaced repetition algorithm schedules cards at the exact moment you are about to forget them — making it arguably the most scientifically grounded memorization tool available.
              </p>
              <p>
                The tradeoff is real: Anki requires significant setup time, all card creation is manual, and the interface is dated. If you are willing to invest the time, it is one of the most powerful <strong>Quizlet alternatives free</strong> on the market. If you want something modern that works the moment you upload your notes, it is not the right fit.
              </p>

              <h3>Brainscape — decent free tier, heavy paywall</h3>
              <p>
                Brainscape lets you create and study your own flashcard decks on the free plan. The confidence-based repetition system is genuinely smart. The problem is that most high-quality pre-made decks sit behind a paid tier. As a <strong>Quizlet alternative free</strong> option, it is workable but not exceptional.
              </p>
            </FadeUp>

            {/* Section 4 — Free comparison */}
            <FadeUp>
              <h2 id="free-comparison">Free tier comparison: Quizlet vs Lunora</h2>
              <p>Here is exactly what you get on each free plan — no marketing spin.</p>
              <div style={{ margin: "24px 0 36px", borderRadius: 20, border: "1.5px solid #eef0f8", overflow: "hidden" }}>
                <div style={{ background: "#203567", padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
                  <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 700, fontSize: 13 }}>Feature</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Quizlet (free)</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>Lunora (free)</span>
                </div>
                <CompRow label="Flashcards / questions" quizlet="Basic flashcards only" lunora="AI-generated questions" />
                <CompRow label="Question generation" quizlet={false} lunora="Unlimited" />
                <CompRow label="Progress tracking" quizlet={false} lunora={true} />
                <CompRow label="Upload your own content" quizlet="Limited" lunora="PDF, video, link, DOCX" />
                <CompRow label="Spaced repetition" quizlet="Paid only" lunora={true} />
                <CompRow label="Deep-dive on weak spots" quizlet={false} lunora={true} />
                <CompRow label="Structured topic system" quizlet={false} lunora={true} />
                <CompRow label="Ads on free plan" quizlet={true} lunora={false} />
                <CompRow label="Mastery tracking" quizlet={false} lunora={true} />
                <CompRow label="Credit card required to start" quizlet={false} lunora={false} />
              </div>
            </FadeUp>

            {/* Section 5 — vs Lunora */}
            <FadeUp>
              <h2 id="quizlet-vs-lunora">Quizlet vs Lunora — the real difference</h2>
              <p>
                The clearest way to frame it: <strong>Quizlet is a review tool. Lunora is a learning system.</strong>
              </p>
              <p>
                With Quizlet, you create or find a deck, flip through cards, and call it studying. There is no mechanism that pushes you from surface recognition to actual recall under pressure. You see a card enough times and think you know it. Cognitive science calls this the <em>fluency illusion</em> — familiarity mistaken for knowledge.
              </p>
              <p>
                With Lunora, you upload your actual study material and it creates a structured learning path: a topic broken into subtopics, each with unlimited questions covering that concept from multiple angles. When you get stuck, the deep-dive sidebar does not just show the answer — it generates flashcards, mini quizzes, and concept summaries targeting that exact weakness. Then it sends you back in.
              </p>
              <p>
                The result is not just recognizing an answer when you see it. It is being able to produce it yourself, from scratch, under exam pressure.
              </p>
              <div className="feature-mini-grid">
                {lunoraCoreFeatures.map(({ Icon, title, desc }, i) => (
                  <div key={i} style={{
                    padding: "20px", borderRadius: 16, border: "1.5px solid #eef0f8", background: "#fafbfd",
                    transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(32,53,103,0.10)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                    }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, marginBottom: 12, background: "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={18} color="#203567" strokeWidth={1.75} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 5 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Section 6 — Which is best */}
            <FadeUp>
              <h2 id="which-is-best">Which Quizlet alternative is right for you?</h2>
              <p>Different students need different tools. Here is the direct guide:</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, margin: "24px 0 36px" }}>
                {choiceGuide.map(({ Icon, label, answer, highlight }, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 16,
                    padding: "18px 20px", borderRadius: 14,
                    border: highlight ? "1.5px solid rgba(32,53,103,0.2)" : "1.5px solid #eef0f8",
                    background: highlight ? "rgba(32,53,103,0.03)" : "#fafbfd",
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, background: highlight ? "rgba(32,53,103,0.08)" : "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon size={16} color={highlight ? "#203567" : "#666"} strokeWidth={2} />
                    </div>
                    <div>
                      <p style={{ fontSize: 15, color: "#1a1a1a", fontWeight: 500, marginBottom: 6 }}>{label}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <ArrowRight size={13} color="#203567" strokeWidth={2.5} />
                        <span style={{ fontSize: 14, color: "#203567", fontWeight: 700 }}>{answer}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Inline CTA */}
            <FadeUp>
              <div style={{ background: "linear-gradient(135deg, #203567 0%, #2a4580 100%)", borderRadius: 24, padding: "40px 36px", margin: "40px 0", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 14px", borderRadius: 100, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)" }}>
                    <Unlock size={11} color="rgba(255,255,255,0.8)" strokeWidth={2} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Free to start — no card needed</span>
                  </div>
                </div>
                <h3 style={{ fontSize: 28, fontWeight: 800, color: "white", marginBottom: 12, fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
                  The free Quizlet alternative that actually builds mastery.
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 28, fontSize: 15, lineHeight: 1.65 }}>
                  Upload any PDF, YouTube video, or document. Get unlimited questions. Track your progress across every subtopic — all free.
                </p>
                <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}>
                  Try Lunora for free
                  <ArrowRight size={15} color="#203567" strokeWidth={2.5} />
                </Link>
              </div>
            </FadeUp>

            {/* Section 7 — Verdict */}
            <FadeUp>
              <h2 id="verdict">Final verdict — the best free Quizlet alternative in 2026</h2>
              <p>
                Most tools in this list are Quizlet with a different interface. They show you flashcards. Maybe with a game element. Maybe spaced repetition. But the underlying design is the same: present content, hope it sticks.
              </p>
              <p>
                That model works for basic vocabulary or low-stakes review. It breaks completely when you need to understand, apply, and recall under exam pressure — for questions you have never seen before.
              </p>
              <p>
                The best <strong>Quizlet alternative free</strong> in 2026 is Lunora — not because it is the most popular, but because it is the only one built around how learning actually works. Active recall over passive review. Structured progression over random deck shuffling. Tracked improvement over "I feel like I know this." It is free to start, and most students notice the difference within one session.
              </p>
            </FadeUp>

            {/* Section 8 — FAQ */}
            <FadeUp>
              <h2 id="faq">Frequently asked questions about Quizlet alternatives</h2>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {faqs.map(({ q, a }, i) => (
                  <div key={i} style={{ padding: "24px 0", borderBottom: i < faqs.length - 1 ? "1px solid #f0f3fa" : "none" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", flexShrink: 0, background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Target size={13} color="#203567" strokeWidth={2} />
                      </div>
                      <h3 style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{q}</h3>
                    </div>
                    <p style={{ fontSize: 15, color: "#555", lineHeight: 1.8, margin: 0, paddingLeft: 42 }}>{a}</p>
                  </div>
                ))}
              </div>
            </FadeUp>

          </article>

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          <aside>
            <FadeUp>
              {/* Table of Contents */}
              <div style={{ border: "1.5px solid #eef0f8", borderRadius: 20, padding: "24px", marginBottom: 24, background: "#fafbfd" }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#203567", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>In this article</div>
                {tableOfContents.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="toc-link">{item.label}</a>
                ))}
              </div>

              {/* Quick rankings */}
              <div style={{ border: "1.5px solid #eef0f8", borderRadius: 20, padding: "24px", marginBottom: 24, background: "#fff" }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#203567", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Quick Rankings</div>
                {[
                  { Icon: Trophy, name: "Lunora", note: "Best overall — free" },
                  { Icon: Medal, name: "Anki", note: "Best free spaced repetition" },
                  { Icon: Award, name: "Brainscape", note: "Best basic flashcards" },
                  { Icon: Users, name: "Kahoot!", note: "Best for classrooms" },
                  { Icon: Layers, name: "Quizizz", note: "Best for quizzes" },
                ].map(({ Icon, name, note }, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < 4 ? "1px solid #f0f3fa" : "none" }}>
                    <div style={{ width: 28, height: 28, borderRadius: 7, background: i === 0 ? "#203567" : "rgba(32,53,103,0.07)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={13} color={i === 0 ? "white" : "#203567"} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{name}</div>
                      <div style={{ fontSize: 12, color: "#888" }}>{note}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sticky CTA */}
              <div className="cta-card">
                <div style={{ marginBottom: 20 }}><LunoraLogo light size="sm" /></div>
                <h3 style={{ fontSize: 21, fontWeight: 800, color: "white", lineHeight: 1.25, marginBottom: 12, fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em" }}>
                  The{" "}
                  <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>smarter</span>{" "}
                  free Quizlet alternative.
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
                  Upload any content. Unlimited questions. Track mastery across every subtopic — free.
                </p>
                {[
                  { Icon: Zap, text: "Unlimited questions from your content" },
                  { Icon: Brain, text: "Deep-dive on any weak spot" },
                  { Icon: BarChart2, text: "Full attempt and score tracking" },
                  { Icon: Unlock, text: "Free to start — no card needed" },
                ].map(({ Icon, text }, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 11 }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon size={10} color="white" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{text}</span>
                  </div>
                ))}
                <Link href="/signin" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "white", color: "#203567", fontWeight: 800, fontSize: 14, padding: "13px 24px", borderRadius: 100, textDecoration: "none", marginTop: 24 }}>
                  Start for free
                  <ArrowRight size={14} color="#203567" strokeWidth={2.5} />
                </Link>
                <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>No credit card needed</div>
              </div>
            </FadeUp>
          </aside>

        </div>
      </section>

      {/* ── BOTTOM CTA ───────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <FadeUp>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{ fontSize: "clamp(32px,5vw,44px)", fontWeight: 800, color: "white", letterSpacing: "-0.025em", marginBottom: 16, fontFamily: "'DM Sans', sans-serif" }}>
              Ready to actually learn?
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>
              The best free Quizlet alternative — built for mastery, not memorization.
            </p>
            <Link href="/signin" style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "white", color: "#203567", fontWeight: 800, fontSize: 16, padding: "16px 40px", borderRadius: 100, textDecoration: "none" }}>
              Start learning for free
              <ArrowRight size={16} color="#203567" strokeWidth={2.5} />
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
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