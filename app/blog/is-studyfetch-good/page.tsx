"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";

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
export default function StudyFetchReviewPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const tableOfContents = [
    { id: "what-is-studyfetch", label: "What is StudyFetch?" },
    { id: "features", label: "Features breakdown" },
    { id: "is-studyfetch-good", label: "Is StudyFetch actually good?" },
    { id: "pros-cons", label: "Pros & cons" },
    { id: "pricing", label: "Pricing — is it worth it?" },
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

        .pricing-card {
          border-radius: 20px;
          border: 1.5px solid #eef0f8;
          padding: 28px 28px;
          background: #fafbfd;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .pricing-card:hover {
          box-shadow: 0 8px 32px rgba(32,53,103,0.10);
          transform: translateY(-2px);
        }
        .pricing-card.highlight {
          border-color: #203567;
          background: linear-gradient(135deg,rgba(32,53,103,0.03) 0%,rgba(32,53,103,0.06) 100%);
        }
      `}</style>

      {/* ── SEO: JSON-LD ─────────────────────────────────────────────────── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Review",
        "name": "Is StudyFetch Good? Honest Review for Students (2026)",
        "reviewBody": "An honest, detailed review of StudyFetch covering its AI tutor, Spark.e, flashcard tools, and study features — with a comparison to Lunora for deep mastery learning.",
        "author": { "@type": "Organization", "name": "Lunora" },
        "datePublished": "2026-03-01",
        "itemReviewed": {
          "@type": "SoftwareApplication",
          "name": "StudyFetch",
          "url": "https://studyfetch.com",
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
              Is StudyFetch Good?{" "}
              <span style={{
                fontFamily: "'Playfair Display', serif", fontStyle: "italic", color: "#203567",
              }}>
                An honest student review
              </span>{" "}
              for 2026
            </h1>
          </FadeUp>
          <FadeUp delay={0.2}>
            <p style={{ fontSize: 18, color: "#666", lineHeight: 1.7, maxWidth: 580, margin: "0 auto 36px" }}>
              I put StudyFetch through its paces — AI tutor, flashcards, document upload, the whole thing. Here's the real verdict: what works, what's overhyped, and whether it's worth paying for.
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
                  <div style={{ fontSize: 12, color: "#999" }}>Mar 2026 · 9 min read</div>
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: "#e0e4ee" }} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {["#studyfetch", "#ai-tools", "#study"].map(tag => (
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

            {/* Quick verdict */}
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
                  <VerdictBadge score="✓" label="Good AI tutor chat" />
                  <VerdictBadge score="✓" label="Solid content tools" />
                  <VerdictBadge score="✗" label="Weak on retention" />
                </div>
                <p style={{ marginTop: 20, marginBottom: 0, fontSize: 15, lineHeight: 1.7, color: "#555" }}>
                  <strong>Bottom line:</strong> StudyFetch is a genuinely capable AI study tool — especially its AI tutor, Spark.e. But it's optimised for <em>consuming</em> content, not for <em>mastering</em> it. If you need to retain what you studied a month from now, you'll need something more.
                </p>
              </div>
            </FadeUp>

            {/* Section 1 */}
            <FadeUp>
              <h2 id="what-is-studyfetch">So — what exactly is StudyFetch?</h2>
              <p>
                <strong>StudyFetch</strong> is an AI-powered study platform that lets students upload their course material — PDFs, notes, slides — and then interact with it through a range of tools. At its core sits <strong>Spark.e</strong>, StudyFetch's branded AI tutor, which you can have a real back-and-forth conversation with about your uploaded content. There's also flashcard generation, practice questions, a study guide builder, and more.
              </p>
              <p>
                It's been around long enough to build a real user base, and it shows up consistently in searches for AI study tools. Students asking <em>"is StudyFetch good?"</em> are usually trying to decide whether it's worth subscribing — because the best features are paywalled pretty aggressively.
              </p>
              <p>
                The pitch is simple: stop reading passively, start interacting with your material. Upload your lecture notes, ask Spark.e questions, generate flashcards, quiz yourself. On paper, that's a compelling study loop. In practice, it's a bit more nuanced.
              </p>
            </FadeUp>

            {/* Section 2 */}
            <FadeUp>
              <h2 id="features">StudyFetch features — what you actually get</h2>

              <h3>Spark.e — the AI tutor</h3>
              <p>
                This is genuinely <strong>StudyFetch's</strong> strongest feature. Spark.e is trained on your uploaded material and lets you ask questions in natural language, request explanations, test your understanding in conversation, and work through problems. It's surprisingly good at staying contextually grounded in your actual documents rather than hallucinating generic answers.
              </p>
              <p>
                If you're the kind of learner who processes information through conversation — typing out "wait, why does that work?" and getting a clear explanation — Spark.e delivers that well. It's closer to a capable study partner than a basic chatbot.
              </p>

              <h3>Flashcard Generator</h3>
              <p>
                Upload your notes or a PDF and <strong>StudyFetch</strong> will auto-generate a flashcard set. The quality is reasonable — it picks out key terms and definitions rather than just lifting random sentences. You can edit cards after generation. It's faster than building Anki decks manually, and the output is cleaner than most auto-generation tools.
              </p>
              <p>
                The problem is familiar: flashcards are a passive recognition tool. Seeing a card enough times and knowing the answer is not the same as being able to produce the answer from scratch under pressure. StudyFetch doesn't do much to bridge that gap.
              </p>

              <h3>Practice Questions</h3>
              <p>
                <strong>StudyFetch</strong> can generate multiple-choice and short-answer practice questions from your uploaded content. This is one of its better features — having questions rooted in your actual course material beats generic practice tests. The question quality varies depending on the source material, but it's a useful addition.
              </p>

              <h3>Study Guide Builder</h3>
              <p>
                Condenses your uploaded material into a structured study guide — key concepts, summaries, important terms. Useful for getting a high-level overview of a topic quickly. Less useful for actually cementing that knowledge into long-term memory.
              </p>

              <h3>Audio Feature</h3>
              <p>
                StudyFetch has a text-to-speech / audio mode that can read your study material aloud. Useful for auditory learners, or for reviewing content while commuting. A nice differentiator, even if it's not relevant for every student.
              </p>

              {/* Feature card grid */}
              <div className="feature-grid" style={{ margin: "28px 0" }}>
                {[
                  { icon: "🤖", title: "Spark.e AI Tutor", desc: "Conversational AI tutor trained on your uploaded material. Ask questions, get explanations, test your thinking." },
                  { icon: "🃏", title: "Flashcard Generator", desc: "Auto-generates flashcard decks from PDFs and notes. Editable and reasonably high quality." },
                  { icon: "📝", title: "Practice Questions", desc: "Multiple-choice and short-answer questions generated from your actual course content." },
                  { icon: "📋", title: "Study Guide Builder", desc: "Condenses uploaded material into structured summaries and key concept overviews." },
                  { icon: "🎧", title: "Audio Mode", desc: "Text-to-speech playback of your study material. Great for auditory learners and commuting." },
                  { icon: "📁", title: "Document Upload", desc: "Supports PDFs, slides, and notes. Most of the platform's features are built around your uploaded content." },
                ].map(({ icon, title, desc }, i) => (
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
                      fontSize: 18,
                    }}>
                      {icon}
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a", marginBottom: 6 }}>{title}</div>
                    <div style={{ fontSize: 13, color: "#777", lineHeight: 1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Section 3 */}
            <FadeUp>
              <h2 id="is-studyfetch-good">So — is StudyFetch actually good?</h2>
              <p>
                The honest answer is: <strong>it depends what you mean by "good."</strong>
              </p>
              <p>
                If "good" means a polished, functional platform that makes it easy to interact with your study material and get quick explanations — then yes, <strong>StudyFetch is genuinely good</strong>. Spark.e is one of the better AI tutors in this space. The document upload is seamless. The interface is clean and modern. For a student who needs help understanding a tricky concept the night before a seminar, it delivers.
              </p>
              <p>
                But if "good" means a tool that will measurably improve how much you retain a week later — the kind of improvement that shows up in exam results rather than just in how confident you felt after a study session — the picture is less clear.
              </p>
              <p>
                <strong>StudyFetch</strong> is fundamentally a content interaction tool. It helps you understand material in the moment. What it does not do is systematically force you to retrieve that information, test you across different angles until you can answer without prompts, or track which specific gaps you still need to close. That's the difference between a study tool that feels productive and one that actually is.
              </p>
              <p>
                The research is clear on this: active recall — being forced to produce answers from memory — is dramatically more effective for long-term retention than reading, re-reading, or even chatting about content. StudyFetch's flashcard mode scratches this surface, but the platform is not fundamentally designed around that principle.
              </p>
            </FadeUp>

            {/* Section 4 */}
            <FadeUp>
              <h2 id="pros-cons">The honest pros and cons of StudyFetch</h2>
              <p>Here's the real breakdown — what genuinely impressed us and what left us wanting more.</p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, margin: "24px 0 36px" }} className="pros-cons-grid">
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#203567", marginBottom: 12 }}>What works 👍</div>
                  {[
                    "Spark.e AI tutor is genuinely impressive",
                    "Content stays grounded in your documents",
                    "Clean, modern interface",
                    "Audio mode is a useful differentiator",
                    "Practice question generation is decent",
                    "Works with a wide range of file types",
                  ].map((p, i) => <ProConItem key={i} text={p} type="pro" />)}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: "#c83232", marginBottom: 12 }}>What doesn't 👎</div>
                  {[
                    "No true mastery or retention system",
                    "Flashcards = passive review, not active recall",
                    "No progress tracking across subtopics",
                    "Key features locked behind paid plans",
                    "Free tier is heavily limited",
                    "No structured learning path or mastery detection",
                  ].map((c, i) => <ProConItem key={i} text={c} type="con" />)}
                </div>
              </div>

              <style>{`
                @media(max-width: 599px) {
                  .pros-cons-grid { grid-template-columns: 1fr !important; }
                }
              `}</style>
            </FadeUp>

            {/* Section 5 — Pricing */}
            <FadeUp>
              <h2 id="pricing">StudyFetch pricing — is it worth paying for?</h2>
              <p>
                This is where things get complicated. <strong>StudyFetch</strong> has a free tier, but it's restrictive — limited uploads, limited Spark.e conversations, limited question generation. To get meaningful use out of the platform, you're looking at a paid subscription.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, margin: "24px 0 32px" }} className="pricing-grid">
                <style>{`@media(max-width: 599px) { .pricing-grid { grid-template-columns: 1fr !important; } }`}</style>

                {[
                  {
                    name: "Free",
                    price: "$0",
                    period: "forever",
                    features: ["Limited uploads", "Limited Spark.e chats", "Basic flashcards", "No progress tracking"],
                    highlight: false,
                    cta: "Current plan",
                  },
                  {
                    name: "Plus",
                    price: "~$8",
                    period: "per month",
                    features: ["Unlimited uploads", "Full Spark.e access", "Practice questions", "Study guide builder"],
                    highlight: true,
                    cta: "Most popular",
                  },
                  {
                    name: "Pro",
                    price: "~$16",
                    period: "per month",
                    features: ["Everything in Plus", "Audio mode", "Priority support", "Advanced analytics"],
                    highlight: false,
                    cta: "Full access",
                  },
                ].map(({ name, price, period, features, highlight, cta }, i) => (
                  <div key={i} className={`pricing-card${highlight ? " highlight" : ""}`} style={{ position: "relative" }}>
                    {highlight && (
                      <div style={{
                        position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                        background: "#203567", color: "white", fontSize: 10, fontWeight: 800,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                        padding: "3px 12px", borderRadius: 100, whiteSpace: "nowrap",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>{cta}</div>
                    )}
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a", marginBottom: 8 }}>{name}</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: "#203567", fontFamily: "'DM Sans', sans-serif" }}>{price}</div>
                    <div style={{ fontSize: 12, color: "#999", marginBottom: 20 }}>{period}</div>
                    {features.map((f, j) => (
                      <div key={j} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(32,53,103,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ fontSize: 9, color: "#203567", fontWeight: 800 }}>✓</span>
                        </div>
                        <span style={{ fontSize: 13, color: "#555" }}>{f}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              <p>
                The honest assessment: if you're going to use <strong>StudyFetch</strong> seriously, the free tier will frustrate you quickly. You'll hit limits on document uploads and Spark.e chats at exactly the moments you need them most. That said, the Plus tier at around $8/month is reasonable if the platform genuinely improves your results — which comes down to whether you use it actively rather than just consuming explanations.
              </p>
              <p>
                The comparison worth noting: <strong>Lunora's free plan</strong> includes unlimited question generation and full progress tracking with no credit card required. For students weighing value, that's a meaningful difference.
              </p>
            </FadeUp>

            {/* Section 6 — Verdict */}
            <FadeUp>
              <h2 id="verdict">The verdict: is StudyFetch good?</h2>
              <p>
                <strong>StudyFetch is a good AI study tool</strong> — particularly if you value conversational AI that stays anchored to your actual notes. Spark.e is genuinely one of the better AI tutors in this space, and the overall experience is polished and purposeful.
              </p>
              <p>
                Where <strong>StudyFetch</strong> falls short is in the follow-through. Understanding something in a conversation is not the same as being able to recall it under exam conditions three weeks later. The platform gives you the former reliably. The latter is largely left up to you.
              </p>

              {/* Comparison table */}
              <div style={{ margin: "32px 0", borderRadius: 20, border: "1.5px solid #eef0f8", overflow: "hidden" }}>
                <div style={{ background: "#203567", padding: "16px 20px", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>StudyFetch</span>
                  <span style={{ color: "white", fontWeight: 700, fontSize: 14 }}>Lunora</span>
                </div>
                {[
                  ["Explains content to you", "Tests you on content until it sticks"],
                  ["Flashcards for passive review", "Unlimited active recall questions"],
                  ["No progress tracking", "Full attempt history + subtopic scores"],
                  ["No mastery detection", "Moves on only when you're ready"],
                  ["AI tutor-focused", "Retention-focused"],
                  ["Key features paywalled", "Unlimited questions free"],
                  ["Chat-based learning", "Structured path to 100% mastery"],
                ].map(([s, l], i) => (
                  <div key={i} className="comparison-row" style={{ background: i % 2 === 0 ? "#fff" : "#fafbfd" }}>
                    <div className="comparison-cell">
                      <span style={{ color: "#c83232", marginRight: 8 }}>✗</span>{s}
                    </div>
                    <div className="comparison-cell">
                      <span style={{ color: "#203567", marginRight: 8 }}>✓</span>{l}
                    </div>
                  </div>
                ))}
              </div>
            </FadeUp>

            {/* Section 7 */}
            <FadeUp>
              <h2 id="better-alternative">Want actual mastery? Try Lunora instead</h2>
              <p>
                We built <strong>Lunora</strong> because we kept running into the exact problem that <strong>StudyFetch</strong> illustrates well: AI tools that are great at explaining things but terrible at making sure they actually stick. Understanding in the moment and retention under pressure are two very different outcomes — and most AI study tools optimise for the former.
              </p>
              <p>
                With Lunora, you upload the same PDFs and documents you'd upload to <strong>StudyFetch</strong>. But instead of a chat interface, Lunora turns your material into a structured quiz system. Every topic breaks down into subtopics, and inside each one you generate unlimited questions from multiple angles until the concept is genuinely locked in — not just familiar.
              </p>
              <p>
                The feature that separates Lunora from tools like <strong>StudyFetch</strong> is the <strong>deep-dive sidebar</strong>. When you get a question wrong, you don't just see the answer. You tap the question mark and Lunora generates flashcards, mini quizzes, a matching game, or a concept summary — all targeting that exact weak spot. You fix the gap at the source, then come back stronger.
              </p>
              <p>
                And unlike <strong>StudyFetch</strong>, which has limited progress visibility, Lunora keeps a full record of every quiz session: best score, average score, subtopic breakdown, where you improved and where you haven't. You can actually <em>see</em> whether you're getting better.
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
                  Stop understanding things. Start actually knowing them.
                </h3>
                <p style={{ color: "rgba(255,255,255,0.65)", marginBottom: 28, fontSize: 15, lineHeight: 1.65 }}>
                  Upload any PDF, YouTube video, or document and turn it into a structured quiz system that tracks your progress to 100% mastery.
                </p>
                <Link href="/signin" style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  background: "white", color: "#203567", fontWeight: 800,
                  fontSize: 15, padding: "14px 32px", borderRadius: 100,
                  textDecoration: "none",
                }}>
                  Try Lunora for free →
                </Link>
              </div>
            </FadeUp>

            {/* Final thoughts */}
            <FadeUp>
              <h2>Final thoughts on StudyFetch</h2>
              <p>
                Is <strong>StudyFetch good</strong>? Yes — with a clear caveat. It's a polished, well-built platform with a genuinely impressive AI tutor in Spark.e. If you need help understanding your material, working through concepts in conversation, or generating a quick flashcard set, it delivers.
              </p>
              <p>
                Where it doesn't deliver is on the thing that actually matters most: making sure that understanding turns into long-term retention. <strong>StudyFetch</strong> is a comprehension tool. It's not a mastery system. There's a meaningful difference, and it shows up most clearly when you're sitting an exam on material you studied three weeks ago.
              </p>
              <p>
                If your goal is to ace assignments by understanding material quickly — <strong>StudyFetch</strong> is a reasonable choice. If your goal is to walk into exams with genuine, retrievable knowledge — try Lunora. That's what it's built for.
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

              {/* Quick scores */}
              <div style={{
                border: "1.5px solid #eef0f8", borderRadius: 20, padding: "24px",
                marginBottom: 24, background: "#fff",
              }}>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#203567", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                  StudyFetch at a Glance
                </div>
                {[
                  { label: "AI Tutor (Spark.e)", score: "4.5/5" },
                  { label: "Flashcard Quality", score: "3.5/5" },
                  { label: "Practice Questions", score: "3.5/5" },
                  { label: "Progress Tracking", score: "2/5" },
                  { label: "Free Plan Value", score: "2/5" },
                  { label: "Overall", score: "3.5/5" },
                ].map(({ label, score }, i) => (
                  <div key={i} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 0", borderBottom: i < 5 ? "1px solid #f0f3fa" : "none",
                  }}>
                    <span style={{ fontSize: 13, color: "#555", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#203567" }}>{score}</span>
                  </div>
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
                  The study tool that builds{" "}
                  <span style={{ fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>
                    real mastery
                  </span>
                  .
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

      {/* ── BOTTOM CTA ─────────────────────────────────────────────────────── */}
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

      {/* ── FOOTER ─────────────────────────────────────────────────────────── */}
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