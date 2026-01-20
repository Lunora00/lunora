"use client";
import React, { useEffect, useId, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";
import LoadingScreen from "../LoadingScreen";

export default function LandingPage() {
  const router = useRouter();
  const uid = useId();
  const navMaskId = `lunora-moon-${uid}`;
  const [user, setUser] = useState<any>(null);
  const [pageLoading, setPageLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

  const [stars, setStars] = useState<Array<{
    id: number;
    left: string;
    top: string;
    size: string;
    delay: string;
    duration: string;
  }>>([]);
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    const starCount = 100;
    const newStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 30}%`,
      size: `${Math.random() * 2 + 1}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 4}s`,
    }));
    setStars(newStars);
  }, []);

  const screenshots = [
    {
      id: 1,
      src: "/first1.png",
      title: "Smart Analysis",
      description:
        "Break down your performance by topic, subtopic, and difficulty.",
    },
    {
      id: 2,
      src: "/third.png",
      title: "Instant Quizzing",
      description: "Start quizzes instantly from any topic or subtopic.",
    },
    {
      id: 3,
      src: "/second.png",
      title: "Progress Tracking",
      description:
        "Track improvement over time with clear progress indicators.",
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
      q: "What if I don’t know a topic during a quiz?",
      a: "No problem. You can instantly switch to Learning Aids during a quiz to understand the topic using summaries, examples, flashcards, and explanations.",
    },
    {
      q: "Is Lunora suitable for advanced learners too?",
      a: "Yes. Advanced learners can dive deep into specific subtopics, attempt higher-difficulty quizzes, and refine mastery without repetition or limits.",
    },
  ];

  return (
    <div className="relative w-full min-h-screen overflow-y-auto bg-[#020406] scroll-smooth">
      {pageLoading && <LoadingScreen />}
      {/* 1. HERO SECTION */}
      <section className="relative w-full h-screen flex items-center overflow-hidden">
        {/* Hero Background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Sky base color */}
          <div className="absolute inset-0 bg-black" />

          {/* Nebula/gradient layers */}
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(circle at 20% 30%, rgba(60,120,255,0.25), transparent 45%),
      radial-gradient(circle at 80% 40%, rgba(120,80,255,0.18), transparent 45%),
      radial-gradient(circle at 50% 80%, rgba(40,140,255,0.18), transparent 50%),
      linear-gradient(to bottom, #0b1a33, #131e41 70%, #020406 100%)`,
            }}
          />

          {/* Hero Image on top */}
          <div
            className="absolute inset-0 bg-no-repeat bg-center bg-cover"
            style={{
              backgroundImage:
                "url('/ChatGPT Image Jan 16, 2026, 10_55_35 AM.png')",
              backgroundPosition: "center 30%",
            }}
          >
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/30"></div>
          </div>
        </div>

        {/* STARS OVERLAY */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute bg-white rounded-full opacity-70"
              style={{
                left: star.left,
                top: star.top,
                width: star.size,
                height: star.size,
                animation: `breathe ${star.duration} infinite ease-in-out ${star.delay}`,
                boxShadow: "0 0 5px rgba(255,255,255,0.8)",
              }}
            />
          ))}
        </div>

        <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-4 sm:px-6 md:px-8 py-4 md:py-6">
          <div className="relative flex items-center select-none pt-2 sm:pt-4">
            <svg
              viewBox="0 0 100 100"
              className="absolute left-0 rotate-[40deg] w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] lg:w-[90px] lg:h-[90px]"
            >
              <defs>
                <mask id={navMaskId}>
                  <rect width="100" height="100" fill="white" />
                  <circle cx="56" cy="50" r="40" fill="black" />
                </mask>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="white"
                mask={`url(#${navMaskId})`}
              />
            </svg>
            <span className="text-white text-[24px] sm:text-[28px] md:text-[32px] lg:text-[40px] font-light tracking-wider pl-5 sm:pl-6 md:pl-7 lg:pl-8 pt-1 sm:pt-2">
              lunora
            </span>
          </div>
          <button
            disabled={pageLoading}
            onClick={() => {
              if (pageLoading) return;
              setPageLoading(true);
              router.push(user ? "/main" : "/signin");
            }}
            className={`
        relative flex cursor-pointer items-center justify-center gap-2
        border border-white text-white
        px-6 py-2 rounded-full font-bold
        transition-all duration-300
        hover:bg-white/10 hover:scale-105
        active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed
      `}
          >
            {user ? "Dashboard" : "Sign Up"}
          </button>
        </nav>

        <div className="relative z-20 w-full max-w-7xl mx-auto px-6 flex items-center">
          <div
            className={`relative z-20 w-full max-w-7xl mx-auto px-4 md:pt-10 lg:py-10`}
          >
            <div
              className={`
      flex flex-col-reverse md:flex-row
      min-h-[80vh]
      gap-10
      items-start md:items-center
      pt-24 sm:pt-28 md:pt-0
    `}
            >
              {/* LEFT TEXT */}
              <div
                className={`
    w-full md:w-[45%]
    text-left
    mb-0  md:pt-8 lg:pt-19
    max-[700px]:text-center
    max-[700px]:mx-auto
  `}
              >
                <h1
                  className={`
      text-white font-bold leading-tight
      text-3xl md:text-4xl lg:text-5xl
      mb-3 sm:mb-4 md:mb-6
      max-[700px]:mx-auto
    `}
                >
                  Learn it. Quiz it. Master it.
                </h1>

                <p
                  className={`
      text-white/70
      text-sm sm:text-base md:text-lg
      mb-5 sm:mb-6 md:mb-8
      max-w-sm md:max-w-md
      max-[700px]:mx-auto
    `}
                >
                  Turn any web and youtube link into quizzes and master concepts
                  faster.
                </p>

                <button
                  onClick={() => {
                    if (pageLoading) return;
                    setPageLoading(true);
                    router.push(user ? "/create-new" : "/signin");
                  }}
                  className={`
        inline-flex cursor-pointer items-center justify-center gap-2
        border-2 border-white text-white
        px-6 sm:px-8 md:px-10
        py-2.5 sm:py-3 md:py-4
        rounded-full font-semibold
        text-sm sm:text-base md:text-lg
        mx-auto max-[700px]:mx-auto

        transition-all duration-300
        hover:bg-white hover:text-[#1F3F5D] hover:scale-105
        active:scale-95

        disabled:opacity-60 disabled:cursor-not-allowed
      `}
                >
                  Create Sheet
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE SPACE */}
          <div className="hidden md:block w-[55%]" />
        </div>
      </section>
      {/* SCREENSHOT SHOWCASE */}
      <section className="relative w-full py-8 sm:py-10 md:py-12 bg-white overflow-hidden">
        {/* Space Gradient Background */}
<div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_20%_30%,#1e3a8a_0%,transparent_40%),radial-gradient(circle_at_80%_20%,#312e81_0%,transparent_45%),radial-gradient(circle_at_50%_80%,#020617_0%,#020617_60%)]" />
{/* Stars Overlay */}
<div className="absolute inset-0 z-[1] bg-[radial-gradient(white_1px,transparent_1px)] bg-[length:24px_24px] opacity-[0.15]" />


        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12 md:mb-15 mt-6 sm:mt-8 md:mt-10">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
              Experience Lunora
            </h2>
            <p className="text-white/70 text-sm sm:text-base md:text-lg">
              A beautiful learning experience built for mastery.
            </p>
          </div>

          {/* Screens */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 md:gap-16 items-center">
            {screenshots.map((item) => (
              <div key={item.id} className="flex flex-col items-center">
                <div className="mb-4 sm:mb-6 mt-8 sm:mt-12 md:mt-23 text-center">
                  <h3 className="text-white text-lg sm:text-xl font-semibold mb-2">
                    {item.title}
                  </h3>

                  <p className="text-white/60 text-xs sm:text-sm">
                    {item.description}
                  </p>
                </div>

                <img
                  src={item.src}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY LUNORA */}
      <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[#0a1020]" />
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `
        radial-gradient(circle at 25% 30%, rgba(60,120,255,0.18), transparent 45%),
        radial-gradient(circle at 75% 40%, rgba(120,80,255,0.14), transparent 45%)
      `,
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          {/* HEADER */}
          <div className="text-center mb-10 sm:mb-16 md:mb-20">
            <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Why Lunora?
            </h2>
            <p className="text-white/60 text-sm sm:text-base md:text-lg max-w-2xl mx-auto px-4">
              Built for deep learning — not shallow progress.
            </p>
          </div>

          {/* CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10 items-stretch">
            {/* LEFT */}
            <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-white/[0.06] backdrop-blur-md border border-white/10">
              <span className="absolute top-4 sm:top-6 right-4 sm:right-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white/10">
                01
              </span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-white text-lg sm:text-xl">∞</span>
              </div>
              <h3 className="text-white text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                Unlimited Question Depth
              </h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                Generate unlimited questions from any topic or subtopic during
                quizzes. Go deeper without limits — no shortage, no repetition,
                just true mastery at every root level.
              </p>
            </div>

            {/* MIDDLE */}
            <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-[#e9f0ff] border border-[#1F3F5D]/20 shadow-[0_30px_80px_rgba(31,63,93,0.25)] md:scale-[1.02]">
              <span className="absolute top-4 sm:top-6 right-4 sm:right-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#1F3F5D]/20">
                02
              </span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#1F3F5D]/15 flex items-center justify-center mb-4 sm:mb-6">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#1F3F5D]" />
              </div>
              <h3 className="text-[#1F3F5D] text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                Learning Aid Tools
              </h3>
              <p className="text-[#1F3F5D]/80 text-sm sm:text-base leading-relaxed">
                Flashcard generator, word-blast matching games, fast quizzes,
                and detailed subtopic summaries — crafted to activate memory and
                help you learn faster with just seconds of focused reading.
              </p>
            </div>

            {/* RIGHT */}
            <div className="relative rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 bg-white/[0.06] backdrop-blur-md border border-white/10">
              <span className="absolute top-4 sm:top-6 right-4 sm:right-6 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white/10">
                03
              </span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 sm:mb-6">
                <span className="text-white text-lg sm:text-xl">✉</span>
              </div>
              <h3 className="text-white text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
                Instant Human Support
              </h3>
              <p className="text-white/60 text-sm sm:text-base leading-relaxed">
                Get instant help through Telegram chat — ask questions, clear
                doubts, and stay unblocked while learning. No waiting, no
                confusion, just support when you need it.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="w-full py-12 sm:py-16 md:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* TITLE */}
          <div className="text-center mb-8 sm:mb-10 md:mb-12">
            <h2 className="text-[#1F3F5D] text-2xl sm:text-3xl md:text-4xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 sm:mt-3 text-[#1F3F5D]/60 text-xs sm:text-sm">
              Quick answers to common questions about Lunora.
            </p>
          </div>

          {/* FAQ LIST */}
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((item, i) => {
              const isOpen = open === i;
              return (
                <div
                  key={i}
                  className="bg-[#f4f7ff] rounded-lg sm:rounded-xl border border-[#1F3F5D]/10 overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="w-full flex cursor-pointer items-center justify-between px-4 sm:px-6 py-3 sm:py-4 text-left"
                  >
                    <span className="text-[#1F3F5D] font-semibold text-xs sm:text-sm md:text-base pr-4">
                      {item.q}
                    </span>
                    <span
                      className={`text-[#1F3F5D] text-xl transition-transform duration-300 flex-shrink-0 ${
                        isOpen ? "rotate-45" : ""
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className={`grid transition-all duration-300 ease-in-out ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden px-4 sm:px-6 pb-3 sm:pb-4 text-[#1F3F5D]/70 text-xs sm:text-sm leading-relaxed">
                      {item.a}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="relative w-full py-12 sm:py-16 md:py-20 lg:py-28 overflow-hidden bg-[#020406]">
        {/* Glow Background */}
        <div
          className="absolute inset-0 z-0"
          style={{
            background: `
        radial-gradient(circle at 50% 10%, rgba(31,63,93,0.45), transparent 55%),
        radial-gradient(circle at 50% 30%, rgba(120,160,255,0.15), transparent 60%)
      `,
          }}
        />

        {/* MOON SVG */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
          <svg
            width="120"
            height="120"
            viewBox="0 0 240 240"
            xmlns="http://www.w3.org/2000/svg"
            className="sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px]"
          >
            <defs>
              <filter
                id="crescentGlow"
                x="-80%"
                y="-80%"
                width="260%"
                height="260%"
              >
                <feGaussianBlur stdDeviation="16" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <mask id="crescentOnly">
                <rect width="100%" height="100%" fill="black" />
                <circle cx="120" cy="120" r="78" fill="white" />
                <circle cx="150" cy="120" r="78" fill="black" />
              </mask>
            </defs>
            <g transform="rotate(-42 120 120)">
              <circle
                cx="120"
                cy="120"
                r="78"
                fill="#ffffff"
                mask="url(#crescentOnly)"
                filter="url(#crescentGlow)"
              />
            </g>
          </svg>
        </div>

        {/* CONTENT */}
        <div className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 text-center pt-16 sm:pt-20 md:pt-24 lg:pt-30">
          <h2 className="text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
            Fill your Lunar Tonight
          </h2>
          <p className="text-white/70 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-10 max-w-xl mx-auto px-4">
            Complete your profile, unlock clarity, and start mastering topics
            with a system built for focus.
          </p>
        <button
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push(user ? "/create-new" : "/signin");
  }}
  className="bg-[#e9f0ff] cursor-pointer text-[#1F3F5D] px-10 sm:px-12 md:px-14 py-3 sm:py-3.5 md:py-4 rounded-full text-base sm:text-lg font-bold shadow-[0_20px_60px_rgba(233,240,255,0.35)] hover:shadow-[0_25px_80px_rgba(233,240,255,0.55)] hover:-translate-y-1 transition-all active:scale-95"
>
  Create New Sheet
</button>

        </div>
      </section>
      {/* FOOTER SECTION */}
      <section className="relative w-full h-[400px] sm:h-[450px] md:h-[500px] lg:h-[550px] overflow-hidden bg-gradient-to-t from-[#022244] to-[#58c8da]">
        {/* SVG Waves */}
        <svg
          className="absolute top-0 w-full h-full transform scale-y-[-1]"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <path
            fill="#ffffff10"
            d="M0,224L60,218.7C120,213,240,203,360,197.3C480,192,600,192,720,197.3C840,203,960,213,1080,202.7C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          >
            <animate
              attributeName="d"
              dur="15s"
              repeatCount="indefinite"
              values="
        M0,224L60,218.7C120,213,240,203,360,197.3C480,192,600,192,720,197.3C840,203,960,213,1080,202.7C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z;
        M0,192L60,181.3C120,171,240,149,360,138.7C480,128,600,128,720,138.7C840,149,960,171,1080,181.3C1200,192,1320,192,1380,192L1440,192L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z;
        M0,224L60,218.7C120,213,240,203,360,197.3C480,192,600,192,720,197.3C840,203,960,213,1080,202.7C1200,192,1320,160,1380,144L1440,128L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z
        "
            />
          </path>
        </svg>

        {/* FOOTER CONTENT */}
        <div className="relative z-10 max-w-7xl mx-auto pt-64 sm:pt-48 md:pt-64 lg:pt-85 flex flex-col items-center text-center px-4 sm:px-6">
          {/* BRAND LOGO */}
          <div className="relative flex items-center select-none mb-2">
            <svg
              viewBox="0 0 100 100"
              className="absolute left-[-24px] sm:left-[-10px] md:left-[-12px] lg:left-[-14px] rotate-[40deg] w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] md:w-[110px] md:h-[110px] lg:w-[130px] lg:h-[130px]"
              aria-hidden="true"
            >
              <defs>
                <mask id="footer-moon">
                  <rect width="100" height="100" fill="white" />
                  <circle cx="56" cy="50" r="40" fill="black" />
                </mask>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="white"
                mask="url(#footer-moon)"
              />
            </svg>
            <span className="text-white text-[40px] sm:text-[50px] md:text-[65px] lg:text-[80px] font-light tracking-wider pl-0 sm:pl-7 md:pl-7.5 lg:pl-8">
              lunora
            </span>
          </div>

          {/* SOCIAL + LEGAL */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-8 md:gap-12 text-white/60 text-sm sm:text-base mb-3 sm:mb-4">
            <div className="flex items-center  gap-4 sm:gap-6 text-sm sm:text-base">
             <span
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push("/terms-and-conditions");
  }}
  className="hover:text-white transition cursor-pointer"
>
  Terms
</span>
             <span
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push("/privacy-policy");
  }}
  className="hover:text-white transition cursor-pointer"
>
  Privacy
</span>
            </div>
          </div>

          {/* COPYRIGHT */}
          <p className="text-white/40 text-xs sm:text-sm md:text-base">
            © 2024 Lunora. All rights reserved.
          </p>
        </div>
      </section>

      <style jsx global>{`
        @keyframes breathe {
          0%,
          100% {
            opacity: 0.2;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        @keyframes waves {
          0%,
          100% {
            transform: translateX(0) rotate(-2deg);
          }
          50% {
            transform: translateX(-10px) rotate(2deg);
          }
        }
        .animate-waves {
          animation: waves 10s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
