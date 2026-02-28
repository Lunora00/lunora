"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BrainCircuit, BarChart2, MessageCircle, FileText, ClipboardList, Upload } from "lucide-react";

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

function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// ─── Moon Logo (matches landing page) ────────────────────────────────────────
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

// ─── Verdict Badge ────────────────────────────────────────────────────────────
function VerdictBadge({ score, label }: { score: string; label: string }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "20px 28px", borderRadius: 16,
      background: "rgba(32,53,103,0.04)",
      border: "1.5px solid rgba(32,53,103,0.10)",
      minWidth: 120, gap: 6,
    }}>
      <span style={{ fontSize: 32, fontWeight: 800, color: "#203567", fontFamily: "'DM Sans', sans-serif" }}>{score}</span>
      <span style={{ fontSize: 12, color: "#888", fontWeight: 500, textAlign: "center", lineHeight: 1.4 }}>{label}</span>
    </div>
  );
}

// ─── Pro/Con Item ─────────────────────────────────────────────────────────────
function ProConItem({ text, type }: { text: string; type: "pro" | "con" }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "14px 0",
      borderBottom: "1px solid #f0f3fa",
    }}>
      <span style={{
        width: 22, height: 22, borderRadius: "50%", flexShrink: 0,
        background: type === "pro" ? "rgba(32,53,103,0.08)" : "rgba(200,50,50,0.08)",
        color: type === "pro" ? "#203567" : "#c83232",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 13, fontWeight: 800, marginTop: 1,
      }}>
        {type === "pro" ? "✓" : "✗"}
      </span>
      <span style={{ fontSize: 15, color: "#444", lineHeight: 1.6 }}>{text}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function GpaiAppReviewPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tableOfContents = [
    { id: "what-is-gpai", label: "What is gpai.app?" },
    { id: "features", label: "Features breakdown" },
    { id: "pros-cons", label: "Pros & cons" },
    { id: "verdict", label: "Verdict" },
    { id: "better-alternative", label: "A better alternative" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#fff", color: "#1a1a1a",
      fontFamily: "'DM Sans', sans-serif", overflowX: "hidden",
    }}>

      {/* ── Global Styles ─────────────────────────────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }

        .nav-link {
          color: #555; text-decoration: none; font-size: 14px; font-weight: 500;
          transition: color 0.2s; font-family: 'DM Sans', sans-serif;
          position: relative;
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
          margin: 48px 0 20px; padding-top: 16px;
          font-family: 'DM Sans', sans-serif;
        }
        .article-body h3 {
          font-size: 20px; font-weight: 700; color: #203567;
          margin: 32px 0 14px; font-family: 'DM Sans', sans-serif;
        }
        .article-body p {
          font-size: 16px; line-height: 1.85; color: #444;
          margin-bottom: 20px;
        }
        .article-body strong { color: #1a1a1a; font-weight: 700; }
        .article-body a { color: #203567; text-decoration: underline; }
        .article-body a:hover { text-decoration: none; }

        .feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media(min-width: 600px) {
          .feature-grid { grid-template-columns: 1fr 1fr; }
        }

        .hide-mobile { display: none !important; }
        @media(min-width: 769px) { .hide-mobile { display: flex !important; } }

        .layout-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }
        @media(min-width: 900px) {
          .layout-grid { grid-template-columns: 1fr 320px; align-items: start; }
        }

        .cta-card {
          background: #203567; border-radius: 24px; padding: 36px;
          position: sticky; top: 140px;
        }

        @media(max-width: 899px) {
          .cta-card { position: static; }
        }

        .comparison-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border-bottom: 1px solid #f0f3fa;
        }
        .comparison-row:last-child { border-bottom: none; }
        .comparison-cell {
          padding: 14px 20px; font-size: 14px; line-height: 1.5; color: #444;
        }
        .comparison-cell:first-child {
          border-right: 1px solid #f0f3fa;
          color: #1a1a1a; font-weight: 500;
        }
      `}</style>

      {/* ── SEO: JSON-LD Structured Data ─────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Review",
        "name": "GPAI App Review 2026: Honest Student Take on gpai.app",
        "reviewBody": "An honest, student-friendly review of gpai.app covering its AI solver, visualizer, and features, with a comparison to Lunora for deep learning.",
        "author": { "@type": "Organization", "name": "Lunora" },
        "datePublished": "2026-02-01",
        "itemReviewed": {
          "@type": "SoftwareApplication",
          "name": "GPAI App",
          "url": "https://gpai.app",
          "applicationCategory": "EducationApplication"
        },
        "reviewRating": { "@type": "Rating", "ratingValue": "3.5", "bestRating": "5" },
        "publisher": { "@type": "Organization", "name": "Lunora", "url": "https://lunora.app" }
      })}} />

      {/* ── NAVIGATION ───────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,1)",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(32,53,103,0.08)" : "1px solid transparent",
        transition: "all 0.3s ease",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          height: 120, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <LunoraLogo size="sm" />
          </Link>
          <div className="hide-mobile" style={{ display: "flex", gap: 32, alignItems: "center" }}>
            <Link href="/#features" className="nav-link">Features</Link>
            <Link href="/#how-it-works" className="nav-link">How it works</Link>
            <Link href="/#faq" className="nav-link">FAQ</Link>
          </div>
          <Link href="/signin" className="btn-primary" style={{ padding: "10px 24px", fontSize: 14 }}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 160, paddingBottom: 64, padding: "160px 24px 64px", background: "#fafbfd" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <FadeUp>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div className="tag-pill">
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#203567", display: "inline-block" }} />
                App Review · 2026
              </div>
            </div>
          </FadeUp>
          <FadeUp delay={0.1}>
            <h1 style={{
              fontSize: "clamp(36px, 6vw, 60px)", fontWeight: 800,
              lineHeight: 1.1, letterSpacing: "-0.03em", color: "#1a1a1a",
              fontFamily: "'DM Sans', sans-serif", marginBottom: 20,
            }}>
              GPAI App Review:{" "}
              <span style={{
                fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567",
              }}>
                Is gpai.app actually useful
              </span>{" "}
              for students?
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
              I spent a week using gpai.app for assignments and exam prep. Here's everything — what it does well, where it falls short, and whether it's worth your time.
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
                  <div style={{ fontSize: 12, color: "#999" }}>Feb 2026 · 8 min read</div>
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: "#e0e4ee" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["#gpai-app", "#ai-tools", "#study"].map(tag => (
                  <span key={tag} style={{
                    fontSize: 12, color: "#203567", background: "rgba(32,53,103,0.07)",
                    padding: "3px 10px", borderRadius: 100, fontWeight: 600,
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CONTENT + SIDEBAR ─────────────────────────────────────────────── */}
      <section style={{ paddingTop: 64, paddingBottom: 100 }}>
        <div className="layout-grid">

          {/* ── ARTICLE BODY ──────────────────────────────────────────────── */}
          <article className="article-body">

            {/* Quick verdict scores */}
            <FadeUp>
              <div style={{
                background: "#fafbfd", border: "1.5px solid #eef0f8", borderRadius: 20,
                padding: "28px 32px", marginBottom: 48,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#203567", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 20 }}>
                  Quick Verdict
                </div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <VerdictBadge score="3.5/5" label="Overall Score" />
                  <VerdictBadge score="✓" label="Good for quick answers" />
                  <VerdictBadge score="✗" label="Weak on retention" />
                  <VerdictBadge score="✗" label="No mastery tracking" />
                </div>
                <p style={{ marginTop: 20, marginBottom: 0, fontSize: 15, lineHeight: 1.7, color: "#555" }}>
                  <strong>Bottom line:</strong> gpai.app is a solid AI problem-solver for when you're stuck. But it won't help you actually <em>learn</em>. If you want to remember what you studied tomorrow, you'll need something more.
                </p>
              </div>
            </FadeUp>

            {/* Section 1 */}
            <FadeUp>
              <h2 id="what-is-gpai">So, what actually is gpai.app?</h2>
              <p>
                If you've stumbled across <strong>gpai.app</strong> searching for an AI homework helper, you're not alone — the site gets a decent amount of searches every month. The <strong>GPAI app</strong> is an AI-powered problem solver built mostly for students who need step-by-step help with tricky questions. Think of it as a smart calculator that can handle math, science, written problems, and more.
              </p>
              <p>
                When you land on <strong>gpai.app</strong>, you get a clean interface with a few main tools: an <strong>AI Solver</strong>, an <strong>AI Visualizer</strong>, an <strong>AI Chat</strong>, a <strong>Report Writer</strong>, a <strong>Cheatsheet Builder</strong>, and an <strong>AI Notes</strong> section. There's also a "GPAI Pro" cross-check feature that verifies answers. You can upload up to 5 files (JPG, PNG, PDF, DOCX, PPTX) up to 30MB each. That's pretty generous.
              </p>
              <p>
                The main pitch of the <strong>gpai app</strong>? You snap a photo or upload a problem, and it solves it. Fast. It's the "just give me the answer" tool. No fluff, no lengthy explanations unless you ask. And honestly, for what it is, it does that reasonably well.
              </p>
            </FadeUp>

            {/* Section 2 */}
            <FadeUp>
              <h2 id="features">Let's talk features — what does gpai.app actually do?</h2>

              <h3>AI Solver</h3>
              <p>
                This is the star of the <strong>gpai app</strong>. You drop in a problem — could be a maths question, a chemistry equation, an essay prompt — and the AI gives you a worked solution. The "Try demo" option is nice if you want to test it before logging in. Compared to just Googling your question, the <strong>gpai.app AI Solver</strong> is faster and more direct.
              </p>
              <p>
                It also lets you analyze multiple problems at once, which is genuinely useful during revision when you've got a pile of past paper questions to go through. The handwritten results feature is a cool touch — outputs that look like handwritten notes instead of typed text. Students who submit assignments will appreciate that.
              </p>

              <h3>AI Visualizer</h3>
              <p>
                The <strong>GPAI app's</strong> visualizer tries to turn concepts into diagrams or visual representations. For things like graphs, flowcharts, or biology diagrams, having a visual can unlock understanding in a way that text just doesn't. It's hit or miss depending on the topic, but when it works, it actually works well.
              </p>

              <h3>AI Chat</h3>
              <p>
                Standard AI chat — ask follow-up questions, dig deeper into a topic, get explanations rephrased. Nothing surprising here if you've used ChatGPT or similar tools. It's fine. Does what you'd expect.
              </p>

              <h3>Report Writer & Cheatsheet Builder</h3>
              <p>
                These are decent productivity tools. The <strong>gpai.app Report Writer</strong> helps structure written assignments, while the Cheatsheet Builder condenses content into quick-reference material. Useful for the night before an exam if you haven't prepared your own notes. Whether that's a good study habit is a separate conversation.
              </p>

              {/* Feature card grid */}
              <div className="feature-grid" style={{ margin: "28px 0" }}>
                {[
                  { Icon: BrainCircuit, title: "AI Solver", desc: "Upload problems, get step-by-step answers fast. Works for maths, science, written questions." },
                  { Icon: BarChart2, title: "AI Visualizer", desc: "Turns concepts into diagrams and visual aids. Useful for visual learners." },
                  { Icon: MessageCircle, title: "AI Chat", desc: "Standard conversational AI for follow-up questions and explanations." },
                  { Icon: ClipboardList, title: "Cheatsheet Builder", desc: "Condenses your content into quick-reference sheets. Great for last-minute cramming." },
                  { Icon: FileText, title: "Report Writer", desc: "Helps structure and write reports and essays from your notes or prompts." },
                  { Icon: Upload, title: "File Upload", desc: "Supports JPG, PNG, PDF, DOCX, PPTX up to 30MB each. Five files at a time." },
                ].map(({ Icon, title, desc }, i) => (
                  <div key={i} style={{
                    padding: "20px 22px", borderRadius: 16,
                    border: "1.5px solid #eef0f8", background: "#fafbfd",
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
                    <div style={{
                      width: 40, height: 40, borderRadius: 10, marginBottom: 14,
                      background: "rgba(32,53,103,0.07)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={20} color="#203567" strokeWidth={1.75} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Section 3 */}
            <FadeUp>
              <h2 id="pros-cons">The honest pros and cons of gpai.app</h2>
              <p>Okay, enough feature walkthrough. Here's the real talk — what's actually good about the <strong>GPAI app</strong> and what had me frustrated.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, margin: "24px 0 36px" }} className="pros-cons-grid">
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#203567", marginBottom: 12 }}>What works 👍</div>
                  {[
                    "Fast answers — no waiting around",
                    "Multi-file upload is genuinely useful",
                    "Handwritten output option is unique",
                    "AI Visualizer helps for complex topics",
                    "GPAI Pro cross-check builds confidence",
                    "Clean, no-clutter interface",
                  ].map((p, i) => <ProConItem key={i} text={p} type="pro" />)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#c83232", marginBottom: 12 }}>What doesn't 👎</div>
                  {[
                    "No retention or memory system",
                    "You get answers, but not understanding",
                    "No progress tracking across topics",
                    "Cheatsheet = shortcut, not mastery",
                    "No structured learning path",
                    "Can make you dependent on AI answers",
                  ].map((c, i) => <ProConItem key={i} text={c} type="con" />)}
                </div>
              </div>

              <style>{`
                @media(max-width: 599px) {
                  .pros-cons-grid { grid-template-columns: 1fr !important; }
                }
              `}</style>

              <p>
                The biggest issue with the <strong>gpai app</strong> isn't what it does — it's what it <em>doesn't</em> do. It gives you answers. That's genuinely useful when you're stuck on a specific problem. But learning isn't about getting answers. It's about understanding why, being able to reproduce it next week, and connecting it to other things you know.
              </p>
              <p>
                <strong>gpai.app</strong> has no quiz system, no spaced repetition, no mastery tracking, no way to know if you actually <em>got</em> something or just read through a solution and fooled yourself into thinking you understood it. We've all been there.
              </p>
            </FadeUp>

            {/* Section 4 */}
            <FadeUp>
              <h2 id="verdict">The verdict on gpai.app</h2>
              <p>
                The <strong>GPAI app</strong> is a useful tool in a specific situation: you're stuck on a problem, you need a quick nudge, and you're going to follow up by actually understanding it yourself. As a <em>supplement</em> to proper studying — it's fine, maybe even good.
              </p>
              <p>
                But if you're using <strong>gpai.app</strong> as your main study tool? You're going to walk into exams having seen answers but not having learned. The app solves things for you. That's different from you being able to solve them yourself.
              </p>
              <p>
                The <strong>GPAI app's</strong> cheatsheet builder and report writer are handy shortcuts — but shortcuts don't build the long-term retention that actually matters when you're under exam pressure three months from now.
              </p>

              {/* Comparison table */}
              <div style={{ margin: "32px 0", borderRadius: 20, border: "1.5px solid #eef0f8", overflow: "hidden" }}>
                <div style={{ background: "#203567", padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>gpai.app</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Lunora</span>
                </div>
                {[
                  ["Solves problems for you", "Teaches you to solve problems"],
                  ["No quiz or practice system", "1,000+ questions per session"],
                  ["No progress tracking", "Full attempt history + scores"],
                  ["No mastery detection", "Moves you forward only when ready"],
                  ["Answer-focused", "Retention-focused"],
                  ["No structured learning path", "Topics → Subtopics → Mastery"],
                  ["Cheatsheet builder for cramming", "Deep-dive sidebar for real understanding"],
                ].map(([g, l], i) => (
                  <div key={i} className="comparison-row" style={{ background: i % 2 === 0 ? "#fff" : "#fafbfd" }}>
                    <div className="comparison-cell">
                      <span style={{ color: "#c83232", marginRight: 8 }}>✗</span>{g}
                    </div>
                    <div className="comparison-cell">
                      <span style={{ color: "#203567", marginRight: 8 }}>✓</span>{l}
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Section 5 */}
            <FadeUp>
              <h2 id="better-alternative">Want actual mastery? Try Lunora instead</h2>
              <p>
                We built <strong>Lunora</strong> because we kept running into the same problem: AI tools that were great at giving you answers but terrible at making things stick. And we figured there had to be a better way.
              </p>
              <p>
                With Lunora, you upload the same stuff you'd upload to the <strong>gpai app</strong> — PDFs, videos, links, documents — but instead of getting answers handed to you, it turns your material into a structured quiz system. Every topic breaks down into subtopics, and inside each one you can generate unlimited questions from different angles until the concept genuinely sticks.
              </p>
              <p>
                The bit that really separates Lunora from tools like <strong>gpai.app</strong> is the <strong>deep-dive sidebar</strong>. Get stuck on a question? Instead of just being shown the answer, you tap the question mark and Lunora generates flashcards, mini quizzes, a matching game, or a concept summary — all focused on that exact weak spot. You fix the gap and come back stronger.
              </p>
              <p>
                And unlike the <strong>GPAI app</strong> which has zero tracking, Lunora keeps a full record of every quiz attempt: best score, average score, subtopic breakdowns, where you improved, where you didn't. You actually <em>know</em> if you're getting better.
              </p>

              {/* CTA in article */}
              <div style={{
                background: "linear-gradient(135deg, #203567 0%, #2a4580 100%)",
                borderRadius: 24, padding: "40px 36px", margin: "40px 0",
                textAlign: "center",
              }}>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
                  Free to start
                </div>
                <h3 style={{
                  fontSize: 28, fontWeight: 800, color: "white", marginBottom: 12,
                  fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em",
                }}>
                  Stop getting answers. Start building mastery.
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 28, fontSize: 15, lineHeight: 1.65 }}>
                  Upload any PDF, YouTube video, or document and turn it into a structured quiz system that tracks your progress to 100% mastery.
                </p>
                <Link href="/signin" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "white", color: "#203567", fontWeight: 800,
                  fontSize: 15, padding: "14px 32px", borderRadius: 100,
                  textDecoration: "none", transition: "transform 0.15s, box-shadow 0.15s",
                }}>
                  Try Lunora for free →
                </Link>
              </div>
            </FadeUp>

            {/* Final thoughts */}
            <FadeUp>
              <h2>Final thoughts on gpai.app</h2>
              <p>
                Look — the <strong>gpai app</strong> isn't bad. It solves a real problem: needing quick help on specific questions when you're stuck. The interface is clean, the multi-file upload is genuinely useful, and the handwritten output is a fun differentiator.
              </p>
              <p>
                But <strong>gpai.app</strong> is a homework helper, not a learning system. If your goal is to actually understand your subject — to be able to walk into an exam and recall, apply, and reason through problems you've never seen before — you need something that tests you, tracks you, and forces you to actively retrieve what you've learned.
              </p>
              <p>
                That's what Lunora is built for. And that's why, if you're a student who actually wants to master their subject rather than just get through the next assignment, we think it's worth at least trying.
              </p>
              <p>
                Either way — use the right tool for the right job. <strong>gpai.app</strong> for when you're stuck on a specific problem. Lunora for everything else.
              </p>
            </FadeUp>

          </article>

          {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
          <aside>
            <FadeUp>
              {/* Table of Contents */}
              <div style={{
                border: "1.5px solid #eef0f8", borderRadius: 20, padding: "24px",
                marginBottom: 24, background: "#fafbfd",
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#203567", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                  In this review
                </div>
                {tableOfContents.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="toc-link">
                    {item.label}
                  </a>
                ))}
              </div>

              {/* Sticky CTA Card */}
              <div className="cta-card">
                <div style={{ marginBottom: 20 }}>
                  <LunoraLogo light size="sm" />
                </div>
                <h3 style={{
                  fontSize: 22, fontWeight: 800, color: "white",
                  lineHeight: 1.25, marginBottom: 12,
                  fontFamily: "'DM Sans', sans-serif", letterSpacing: "-0.02em",
                }}>
                  The study tool that helps you{" "}
                  <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                    actually master
                  </span>{" "}
                  things.
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, lineHeight: 1.65, marginBottom: 24 }}>
                  Turn any PDF, video, or link into unlimited quizzes. Track your scores. Master every subtopic — one question at a time.
                </p>
                {[
                  "1,000+ questions per session",
                  "Deep-dive on any weak spot",
                  "Full attempt tracking",
                  "Works with any subject",
                ].map((feat, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 10,
                    marginBottom: 10,
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: "rgba(255,255,255,0.15)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, color: "white", flexShrink: 0,
                    }}>✓</div>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>{feat}</span>
                  </div>
                ))}
                <Link href="/signin" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: "white", color: "#203567", fontWeight: 800,
                  fontSize: 14, padding: "13px 24px", borderRadius: 100,
                  textDecoration: "none", marginTop: 24,
                  transition: "transform 0.15s, box-shadow 0.15s",
                }}>
                  Start for free →
                </Link>
                <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
                  No credit card needed
                </div>
              </div>
            </FadeUp>
          </aside>
        </div>
      </section>

      {/* ── BOTTOM CTA BANNER ─────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <FadeUp>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{
              fontSize: "clamp(32px,5vw,44px)", fontWeight: 800, color: "white",
              letterSpacing: "-0.025em", marginBottom: 16,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Ready to actually learn?
            </h2>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", marginBottom: 36, lineHeight: 1.65 }}>
              Master every concept deeply — one subtopic at a time.
            </p>
            <Link href="/signin" style={{
              display: "inline-flex", alignItems: "center",
              background: "white", color: "#203567", fontWeight: 800,
              fontSize: 16, padding: "16px 40px", borderRadius: 100,
              textDecoration: "none",
            }}>
              Start learning for free →
            </Link>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#16254a", padding: "48px 24px" }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 20,
        }}>
          <LunoraLogo light size="sm" />
          <div style={{ display: "flex", gap: 28 }}>
            <Link href="/privacy-policy" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Privacy</Link>
            <Link href="/terms-and-conditions" style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}>Terms</Link>
          </div>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
            © 2026 Lunora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}