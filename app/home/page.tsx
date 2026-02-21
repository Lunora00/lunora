"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ─── Typing Animation Hook ────────────────────────────────────────────────────
function useTypingAnimation(
  words: string[],
  speed = 90,
  pause = 1800,
  deleteSpeed = 55
) {
  const [displayed, setDisplayed] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex % words.length];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting && displayed.length < current.length) {
      timeout = setTimeout(
        () => setDisplayed(current.slice(0, displayed.length + 1)),
        speed
      );
    } else if (!isDeleting && displayed.length === current.length) {
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && displayed.length > 0) {
      timeout = setTimeout(
        () => setDisplayed(current.slice(0, displayed.length - 1)),
        deleteSpeed
      );
    } else if (isDeleting && displayed.length === 0) {
      setIsDeleting(false);
      setWordIndex((i) => (i + 1) % words.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, isDeleting, wordIndex, words, speed, pause, deleteSpeed]);

  return displayed;
}

// ─── Intersection Observer Hook ───────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView] as const;
}

// ─── FadeUp wrapper ───────────────────────────────────────────────────────────
function FadeUp({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.75s ease ${delay}s, transform 0.75s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// ─── Moon Logo ────────────────────────────────────────────────────────────────
function LunoraLogo({
  light = false,
  size = "md",
}: {
  light?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const svgSizes = { sm: 90, md: 120, lg: 140 };
  const textSizes = { sm: 40, md: 50, lg: 60 };
  const s = svgSizes[size];
  const ts = textSizes[size];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        userSelect: "none",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: s,
          height: s,
          transform: "rotate(40deg)",
          flexShrink: 0,
        }}
      >
        <defs>
          <mask id={`lunora-mask-${light ? "light" : "dark"}`}>
            <rect width="100" height="100" fill="white" />
            <circle cx="57" cy="50" r="40" fill="black" />
          </mask>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="42"
          fill={light ? "white" : "#203567"}
          mask={`url(#lunora-mask-${light ? "light" : "dark"})`}
        />
      </svg>
      <span
        style={{
          fontSize: ts,
          fontWeight: 300,
          letterSpacing: "0.12em",
          color: light ? "white" : "#1a1a1a",
          marginLeft: -60,
          marginTop: 6,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        lunora
      </span>
    </div>
  );
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({
  title,
  description,
  image,
  align,
  index,
}: {
  title: string;
  description: string;
  image: string;
  align: "left" | "right";
  index: number;
}) {
  const [ref, inView] = useInView(0.1);
  const isLeft = align === "left";

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(50px)",
        transition: `opacity 0.8s ease ${index * 0.08}s, transform 0.8s ease ${index * 0.08}s`,
        maxWidth: 1280,
        margin: "0 auto",
        padding: "0 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 64,
        }}
        className={`feat-row ${isLeft ? "feat-row-reverse" : ""}`}
      >
        {/* Text side */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 14px",
              borderRadius: 100,
              background: "rgba(32,53,103,0.07)",
              border: "1px solid rgba(32,53,103,0.12)",
              width: "fit-content",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "#203567",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#203567",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Feature {String(index + 1).padStart(2, "0")}
            </span>
          </div>

          <h2
            style={{
              fontSize: 36,
              fontWeight: 800,
              color: "#1a1a1a",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {title}
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {description
              .split("\n\n")
              .filter(Boolean)
              .map((para, i) => (
                <p
                  key={i}
                  style={{
                    margin: 0,
                    fontSize: 15,
                    lineHeight: 1.75,
                    color: i === 0 ? "#1a1a1a" : "#666",
                    fontWeight: i === 0 ? 500 : 400,
                  }}
                >
                  {para}
                </p>
              ))}
          </div>
        </div>

        {/* Image side */}
        <div style={{ flex: 1, width: "100%" }}>
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              border: "1.5px solid #eef0f8",
              boxShadow: "0 8px 40px rgba(32,53,103,0.1)",
              transition: "transform 0.5s ease, box-shadow 0.5s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "scale(1.02) translateY(-4px)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 30px 80px rgba(32,53,103,0.18)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.transform =
                "scale(1) translateY(0)";
              (e.currentTarget as HTMLDivElement).style.boxShadow =
                "0 8px 40px rgba(32,53,103,0.1)";
            }}
          >
            <img
              src={image}
              alt={title}
              style={{ width: "100%", height: "auto", display: "block" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const typingWords = [
    "learn.",
    "master.",
    "memorize.",
    "retain.",
    "excel.",
  ];
  const typedWord = useTypingAnimation(typingWords, 90, 1800, 55);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // Scroll listener for nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);




  const handleAction = (path: string) => {
    setLoading(true);
    router.push(user ? "/main" : path);
  };

  // ── Data ──────────────────────────────────────────────────────────────────
  const features = [
    {
      title: "Generate 1,000+ Questions in One Session",
      description: `Every topic is broken into focused subtopics.\nInside each one, tap the + to generate unlimited new questions — every time from a different angle.\n\nNo repeats. No surface-level practice.\n\nEach question challenges your understanding deeper than the last, until the concept sticks for good. Move on only when you've truly mastered it.`,
      image: "/feat1.png",
      align: "right" as const,
    },
    {
      title: "Stuck? Don't skip. Go deeper.",
      description: `Tap the question mark and open a smart learning sidebar — right when you need it.\n\nGenerate flashcards for that exact weak spot. Take a mini quiz to reinforce it. Play a matching game to lock it in. Or get an instant summary of the subtopic in seconds.\n\nFix confusion on the spot — and return stronger.`,
      image: "/feat2.png",
      align: "left" as const,
    },
    {
      title: "Structured Learning Library.",
      description: `Your learning. Perfectly organized.\n\nEverything you create is saved into structured testbooks. Inside each testbook, your sheets store quizzes, practice sets, and revisions — ready anytime.\n\nSee your entire library at a glance. Know how many testbooks you've built. Track how many sheets live inside each one.`,
      image: "/feat3.png",
      align: "right" as const,
    },
    {
      title: "Every attempt. Every score. Full visibility.",
      description: `Track all your quiz attempts in one place — including best score, average score, total attempts, and your latest result.\n\nSee how you performed across subtopics in each attempt. Know exactly where you improved — and where you didn't.\n\nRe-attempt any quiz. Continue where you left off. Delete sessions you don't need.`,
      image: "/feat4a.png",
      align: "left" as const,
    },
  ];

  const steps = [
    {
      img: "/howb1.png",
      title: "Choose your subject",
      desc: "Select the subject you want to study and let Lunora set the foundation.",
    },
    {
      img: "/howb2.png",
      title: "Pick a topic",
      desc: "Focus on a lesson or subtopic you want to master without distractions.",
    },
    {
      img: "/Lunora-Ai-02-22-2026_01_11_AM.png",
      title: "Import & learn",
      desc: "Upload a PDF, DOCX, image, audio, or video — or paste a YouTube URL or web article link — and instantly turn it into structured quizzes.",
    },
  ];

  const testimonials = [
    {
      text: "Before Lunora, I would take quizzes, check my score, and forget about it. Now I can see my best score, average score, total attempts — even how I performed in each subtopic. The attempt tracking makes improvement visible. It honestly pushes me to reattempt and beat my previous self.",
      author: "Julia K.",
      role: "Student",
    },
    {
      text: "The testbook and sheet system inside Lunora completely changed how I study. I can organize topics into structured testbooks, and inside each one, I save practice sheets for revision. It feels like I built my own digital learning library — but smarter.",
      author: "Liam R.",
      role: "Content Writer",
    },
    {
      text: "The deep-dive feature is insane. If I get stuck on a question, I don't just guess and move on anymore. I click once and Lunora generates flashcards, mini quizzes, summaries — all focused on that exact concept. I fix confusion immediately without leaving the flow.",
      author: "Sophie M.",
      role: "Coder",
    },
  ];

  const faqs = [
    {
      q: "What is Lunora?",
      a: "Lunora is a focused learning system that helps you understand, quiz, and master topics with clarity and structure.",
    },
    {
      q: "Can I use Lunora for any subject?",
      a: "Yes. Lunora adapts to coding, academics, interview prep, and any structured learning content.",
    },
    {
      q: "How does progress tracking work?",
      a: "Each session tracks accuracy, improvement, and mastery so you always know where you stand.",
    },
    {
      q: "Is Lunora free to use?",
      a: "You can start for free with limited sessions and upgrade when you want deeper insights.",
    },
    {
      q: "Can I do unlimited quiz sessions?",
      a: "Yes. You can start unlimited quiz sessions anytime. Lunora allows you to generate unlimited questions from any topic or subtopic, so learning never runs out.",
    },
    {
      q: "What if I don't know a topic during a quiz?",
      a: "No problem. You can instantly switch to Learning Aids during a quiz to understand the topic using summaries, examples, flashcards, and explanations.",
    },
    {
      q: "Is Lunora suitable for advanced learners too?",
      a: "Yes. Advanced learners can dive deep into specific subtopics, attempt higher-difficulty quizzes, and refine mastery without repetition or limits.",
    },
  ];

  const stats = [
    { value: "∞", label: "Questions Generated" },
    { value: "100%", label: "Mastery Focused" },
    { value: "3×", label: "Faster Retention" },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fff",
        color: "#1a1a1a",
        fontFamily: "'DM Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* ── Global Styles ──────────────────────────────────────────────────── */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400;1,9..40,500;1,9..40,700&family=Playfair+Display:ital,wght@0,700;0,800;1,700;1,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::selection { background: #203567; color: white; }

        /* Blinking cursor */
        .typing-cursor {
          display: inline-block;
          width: 3px;
          background: #203567;
          margin-left: 3px;
          vertical-align: text-bottom;
          animation: cur-blink 1s step-end infinite;
        }
        @keyframes cur-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        /* Nav link underline */
        .nav-link {
          position: relative;
          color: #555;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0;
          width: 0; height: 1.5px;
          background: #203567;
          transition: width 0.25s ease;
        }
        .nav-link:hover { color: #203567; }
        .nav-link:hover::after { width: 100%; }

        /* Buttons */
        .btn-primary {
          background: #203567;
          color: white;
          border: none;
          border-radius: 100px;
          padding: 14px 32px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
          font-family: 'DM Sans', sans-serif;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-primary:hover {
          background: #162a54;
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(32,53,103,0.3);
        }
        .btn-primary:active { transform: scale(0.97); }

        .btn-ghost {
          background: transparent;
          color: #555;
          border: 1.5px solid #ddd;
          border-radius: 100px;
          padding: 13px 28px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-ghost:hover {
          border-color: #203567;
          color: #203567;
          transform: translateY(-1px);
        }

        /* Tag pill */
        .tag-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 14px;
          border-radius: 100px;
          background: rgba(32,53,103,0.07);
          border: 1px solid rgba(32,53,103,0.12);
          font-size: 11px;
          font-weight: 700;
          color: #203567;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-family: 'DM Sans', sans-serif;
        }

        /* Feature rows responsive */
        .feat-row {
          flex-direction: column !important;
        }
        @media(min-width: 900px) {
          .feat-row {
            flex-direction: row !important;
          }
          .feat-row-reverse {
            flex-direction: row-reverse !important;
          }
        }

        /* How it works grid */
        .steps-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
        }
        @media(min-width: 768px) {
          .steps-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* Testimonials grid */
        .testimonials-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media(min-width: 768px) {
          .testimonials-grid { grid-template-columns: repeat(3, 1fr); }
        }

        /* Step card hover */
        .step-card-wrap {
          border-radius: 20px;
          overflow: hidden;
          border: 1.5px solid #eef0f8;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          transition: transform 0.4s ease, box-shadow 0.4s ease;
        }
        .step-card-wrap:hover {
          transform: translateY(-6px);
          box-shadow: 0 24px 60px rgba(32,53,103,0.14);
        }

        /* Testimonial card */
        .testimonial-card {
          background: white;
          border-radius: 24px;
          padding: 36px;
          border: 1.5px solid #eef0f8;
          transition: transform 0.3s, box-shadow 0.3s;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .testimonial-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 60px rgba(32,53,103,0.1);
        }

        /* FAQ item */
        .faq-item {
          border-radius: 16px;
          border: 1.5px solid #eef0f8;
          overflow: hidden;
          margin-bottom: 12px;
          transition: box-shadow 0.2s;
        }
        .faq-item:hover {
          box-shadow: 0 4px 20px rgba(32,53,103,0.08);
        }

        /* Stats row */
        .stats-row {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0;
          margin-top: 56px;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
        }
        .stat-item {
          padding: 24px 48px;
          text-align: center;
          border-right: 1px solid #eee;
        }
        .stat-item:last-child { border-right: none; }

        /* Hide on mobile by default */
        .hide-mobile {
          display: none !important;
        }
        @media(min-width: 769px) {
          .hide-mobile {
            display: flex !important;
          }
        }

        /* Responsive hero title */
        .hero-h1 {
          font-size: 72px;
        }
        .hero-typing {
          font-size: 72px;
          min-height: 1.2em;
        }
        @media(max-width: 768px) {
          .hero-h1 { font-size: 44px; }
          .hero-typing { font-size: 44px; }
          .stat-item { padding: 16px 24px; border-right: none; border-bottom: 1px solid #eee; }
          .stat-item:last-child { border-bottom: none; }
        }

        /* Video container */
        .video-wrap {
          position: relative;
          width: 100%;
          border-radius: 20px;
          overflow: hidden;
          aspect-ratio: 16/9;
          box-shadow: 0 30px 80px rgba(32,53,103,0.18);
          border: 1.5px solid rgba(32,53,103,0.08);
        }
        .video-wrap iframe {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          border: none;
        }

        /* Loading spinner in button */
        .btn-loading {
          opacity: 0.7;
          cursor: not-allowed;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* ── NAVIGATION ──────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: scrolled
            ? "rgba(255,255,255,0.95)"
            : "rgba(255,255,255,1)",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled
            ? "1px solid rgba(32,53,103,0.08)"
            : "1px solid transparent",
          transition: "all 0.3s ease",
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 24px",
            height: 120,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <LunoraLogo size="sm" />

          <div
            className="hide-mobile"
            style={{ display: "flex", gap: 32, alignItems: "center" }}
          >
            <a href="#features" className="nav-link">
              Features
            </a>
            <a href="#how-it-works" className="nav-link">
              How it works
            </a>
            <a href="#faq" className="nav-link">
              FAQ
            </a>
          </div>

          <button
            className={`btn-primary${loading ? " btn-loading" : ""}`}
            onClick={() => handleAction("/signin")}
            style={{ padding: "10px 24px", fontSize: 14 }}
            disabled={loading}
          >
            {loading ? (
              <span
                style={{
                  display: "inline-block",
                  width: 14,
                  height: 14,
                  border: "2px solid rgba(255,255,255,0.5)",
                  borderTopColor: "white",
                  borderRadius: "50%",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            ) : user ? (
              "Go to App"
            ) : (
              "Get Started"
            )}
          </button>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 140, paddingBottom: 80, padding: "140px 24px 80px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>

          <FadeUp>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
              <div className="tag-pill">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#203567",
                    display: "inline-block",
                  }}
                />
                AI-Powered Study System
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.1}>
            <h1
              className="hero-h1"
              style={{
                fontWeight: 800,
                lineHeight: 1.1,
                letterSpacing: "-0.03em",
                color: "#1a1a1a",
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 8,
              }}
            >
              The study tool that
              <br />
              helps you{" "}
              <span
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  color: "#203567",
                }}
              >
                actually
              </span>
            </h1>

            {/* Typing animated word */}
            <div
              className="hero-typing"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  lineHeight: 1.1,
                  letterSpacing: "-0.03em",
                  fontFamily: "'Playfair Display', serif",
                  fontStyle: "italic",
                  color: "#203567",
                }}
              >
                {typedWord}
                <span
                  className="typing-cursor"
                  style={{
                    height: "0.85em",
                  }}
                />
              </span>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <p
              style={{
                fontSize: 18,
                color: "#666",
                lineHeight: 1.7,
                maxWidth: 560,
                margin: "0 auto 40px",
                fontWeight: 400,
              }}
            >
              Turn any link, video, or document into a structured learning path.
              Built for students who want 100% mastery and long-term retention.
            </p>
          </FadeUp>

          <FadeUp delay={0.3}>
            <div
              style={{
                display: "flex",
                gap: 14,
                justifyContent: "center",
                flexWrap: "wrap",
              }}
            >
              <button
                className="btn-primary"
                onClick={() => handleAction("/signin")}
                style={{ fontSize: 16, padding: "16px 36px" }}
              >
                Start learning for free
              </button>
              <a href="#how-it-works" className="btn-ghost" style={{ fontSize: 16, padding: "15px 30px" }}>
                See how it works →
              </a>
            </div>
          </FadeUp>

          {/* Stats */}
          <FadeUp delay={0.42}>
            <div className="stats-row">
              {stats.map((s, i) => (
                <div key={i} className="stat-item">
                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: "#203567",
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {s.value}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#888",
                      marginTop: 4,
                      fontWeight: 500,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>

        {/* Hero video */}
        <FadeUp delay={0.5}>
          <div style={{ maxWidth: 1100, margin: "64px auto 0" }}>
            <div className="video-wrap">
              <iframe
                src="https://player.vimeo.com/video/1165609478?background=1&autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0"
                allow="autoplay; fullscreen"
                allowFullScreen
              />
            </div>
          </div>
        </FadeUp>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section
        id="features"
        style={{ paddingTop: 100, paddingBottom: 100, background: "#fafbfd" }}
      >
        <FadeUp>
          <div
            style={{
              textAlign: "center",
              marginBottom: 70,
              padding: "0 24px",
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
            >
              <div className="tag-pill">Platform Features</div>
            </div>
            <h2
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "#1a1a1a",
                letterSpacing: "-0.025em",
                lineHeight: 1.15,
              }}
            >
              Built for real mastery
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "#777",
                marginTop: 12,
                maxWidth: 480,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Every feature is designed to move you from surface understanding
              to deep retention.
            </p>
          </div>
        </FadeUp>

        <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} index={i} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section
        id="how-it-works"
        style={{ paddingTop: 100, paddingBottom: 100, background: "#fff" }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 70 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <div className="tag-pill">Simple Process</div>
              </div>
              <h2
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: "#1a1a1a",
                  letterSpacing: "-0.025em",
                }}
              >
                Go from content to clarity
              </h2>
              <p
                style={{
                  fontSize: 17,
                  color: "#777",
                  marginTop: 12,
                  maxWidth: 420,
                  marginLeft: "auto",
                  marginRight: "auto",
                }}
              >
                Three steps to transform any material into mastered knowledge.
              </p>
            </div>
          </FadeUp>

          <div className="steps-grid">
            {steps.map((s, i) => (
              <FadeUp key={i} delay={i * 0.12}>
                <div>
                  <div className="step-card-wrap">
                    <img
                      src={s.img}
                      alt={s.title}
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                  </div>
                  <div style={{ padding: "24px 4px 0" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: "#203567",
                        color: "white",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 800,
                        marginBottom: 12,
                      }}
                    >
                      {i + 1}
                    </div>
                    <h3
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "#1a1a1a",
                        marginBottom: 8,
                      }}
                    >
                      {s.title}
                    </h3>
                    <p style={{ fontSize: 15, color: "#777", lineHeight: 1.6 }}>
                      {s.desc}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section style={{ paddingTop: 100, paddingBottom: 100, background: "#fafbfd" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <div className="tag-pill">Early Access</div>
              </div>
              <h2
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: "#1a1a1a",
                  letterSpacing: "-0.025em",
                }}
              >
                What early users are saying
              </h2>
            </div>
          </FadeUp>

          <div className="testimonials-grid">
            {testimonials.map((t, i) => (
              <FadeUp key={i} delay={i * 0.1}>
                <div className="testimonial-card">
                  <div
                    style={{
                      fontSize: 56,
                      lineHeight: 1,
                      color: "#203567",
                      opacity: 0.12,
                      fontFamily: "Georgia, serif",
                      marginBottom: -12,
                    }}
                  >
                    "
                  </div>
                  <p
                    style={{
                      fontSize: 15,
                      lineHeight: 1.75,
                      color: "#444",
                      fontStyle: "italic",
                    }}
                  >
                    "{t.text}"
                  </p>
                  <div>
                    <div
                      style={{
                        width: 32,
                        height: 2,
                        background: "#203567",
                        borderRadius: 2,
                        marginBottom: 14,
                      }}
                    />
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#1a1a1a",
                      }}
                    >
                      {t.author}
                    </div>
                    <div style={{ fontSize: 13, color: "#999", marginTop: 2 }}>
                      {t.role}
                    </div>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────────── */}
      <section
        id="faq"
        style={{ paddingTop: 100, paddingBottom: 100, background: "#fff" }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <div className="tag-pill">FAQ</div>
              </div>
              <h2
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: "#203567",
                  letterSpacing: "-0.025em",
                }}
              >
                Frequently asked questions
              </h2>
              <p style={{ fontSize: 15, color: "#8899bb", marginTop: 10 }}>
                Quick answers to common questions about Lunora.
              </p>
            </div>
          </FadeUp>

          <div>
            {faqs.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <FadeUp key={i} delay={i * 0.05}>
                  <div className="faq-item">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "20px 24px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 15,
                          color: "#203567",
                          paddingRight: 16,
                        }}
                      >
                        {item.q}
                      </span>
                      <span
                        style={{
                          flexShrink: 0,
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: isOpen ? "#203567" : "#f0f3fa",
                          color: isOpen ? "white" : "#203567",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 18,
                          fontWeight: 300,
                          transition: "all 0.25s",
                          transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        }}
                      >
                        +
                      </span>
                    </button>
                    <div
                      style={{
                        overflow: "hidden",
                        maxHeight: isOpen ? 240 : 0,
                        opacity: isOpen ? 1 : 0,
                        transition: "max-height 0.35s ease, opacity 0.3s ease",
                      }}
                    >
                      <p
                        style={{
                          padding: "0 24px 20px",
                          fontSize: 14,
                          color: "#555",
                          lineHeight: 1.7,
                        }}
                      >
                        {item.a}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#203567" }}>
        <FadeUp>
          <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <h2
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: "white",
                letterSpacing: "-0.025em",
                marginBottom: 16,
              }}
            >
              Ready to actually learn?
            </h2>
            <p
              style={{
                fontSize: 17,
                color: "rgba(255,255,255,0.65)",
                marginBottom: 36,
                lineHeight: 1.65,
              }}
            >
             Master every concept deeply — one subtopic at a time.
            </p>
            <button
              className="btn-primary"
              onClick={() => handleAction("/signin")}
              style={{
                background: "white",
                color: "#203567",
                fontSize: 16,
                padding: "16px 40px",
              }}
            >
              Start learning for free →
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer style={{ background: "#16254a", padding: "48px 24px" }}>
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <LunoraLogo light size="sm" />

          <div style={{ display: "flex", gap: 28 }}>
            <Link
              href="/privacy-policy"
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.85)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.45)")
              }
            >
              Privacy
            </Link>
            <Link
              href="/terms-and-conditions"
              style={{
                fontSize: 13,
                color: "rgba(255,255,255,0.45)",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.85)")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLAnchorElement).style.color =
                  "rgba(255,255,255,0.45)")
              }
            >
              Terms
            </Link>
          </div>

          <p
            style={{
              fontSize: 13,
              color: "rgba(255,255,255,0.35)",
              margin: 0,
            }}
          >
            © 2026 Lunora. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}