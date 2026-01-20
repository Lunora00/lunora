"use client";
import { useEffect, useId } from "react";

export default function LoadingScreen() {
  const uid = useId();
  const maskId = `lunora-moon-loading-${uid}`;

  // Lock scroll while loader is mounted
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#020406]
      overflow-hidden`}
    >
      {/* === BACKGROUND === */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(circle at 20% 30%, rgba(60,120,255,0.22), transparent 45%),
            radial-gradient(circle at 75% 35%, rgba(80,140,255,0.18), transparent 48%),
            radial-gradient(circle at 50% 80%, rgba(40,120,255,0.16), transparent 55%)
          `,
        }}
      />

      {/* === LOGO === */}
      <div className="relative flex items-center select-none pt-2 sm:pt-4">
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2
          w-[85px] h-[85px] md:w-[95px] md:h-[95px] lg:w-[120px] lg:h-[120px]
          rounded-full bg-blue-300/10 blur-3xl`}
        />

        <svg
          viewBox="0 0 100 100"
          className="absolute left-0 rotate-[40deg] w-[100px] h-[100px] md:w-[110px] md:h-[110px] lg:w-[120px] lg:h-[120px]"
        >
          <defs>
            <mask id={maskId}>
              <rect width="100" height="100" fill="white" />
              <circle cx="56" cy="50" r="40" fill="black" />
            </mask>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="white"
            mask={`url(#${maskId})`}
          />
        </svg>

        <span className="text-white text-[32px] md:text-[36px] lg:text-[44px] font-light tracking-wider pl-8 md:pl-8 lg:pl-10 pt-2 flex items-center">
          lunora
          <span className="ml-2 mt-3 sm:mt-5 flex gap-[4px] pt-[6px]">
            <span className="dot dot-1" />
            <span className="dot dot-2" />
            <span className="dot dot-3" />
          </span>
        </span>
      </div>

      {/* === Animations === */}
      <style jsx>{`
        .dot {
          width: 6px;
          height: 6px;
          border-radius: 9999px;
          background: white;
          opacity: 0;
          animation: dot 1.6s infinite;
        }

        .dot-1 { animation-delay: 0s; }
        .dot-2 { animation-delay: 0.25s; }
        .dot-3 { animation-delay: 0.5s; }

        @keyframes dot {
          0% { opacity: 0; }
          30% { opacity: 1; }
          60% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
