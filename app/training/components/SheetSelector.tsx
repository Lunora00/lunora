import React, { useEffect, useRef } from "react";
import { X, Plus, Loader2, Lock } from "lucide-react";
import { useSubscription } from "../../hooks/useSubscription"; // Adjust path if needed
import { useState } from "react"; // Add useState for the error message

interface SheetSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  subtopics: string[];
  allSubtopicDetailedResults: any;
  questions: any[];
  currentIndex: number;
  onSubtopicClick: (subtopic: string, index: number) => void;
  onAddExtra?: (subtopic: string) => void;
  isGeneratingExtra?: string | null;
  sessionData?: any;
}

const SheetSelector: React.FC<SheetSelectorProps> = ({
  isOpen,
  onClose,
  subtopics,
  allSubtopicDetailedResults,
  onSubtopicClick,
  currentIndex,
  questions,
  onAddExtra,
  isGeneratingExtra,
  sessionData,
}) => {
  const activeElementRef = useRef<HTMLDivElement | null>(null);
  const mainTopic = sessionData?.name || sessionData?.topic || "General Training";
  const { isPro } = useSubscription(); // Get pro status
  const [proError, setProError] = useState<string | null>(null); // State for the message

  useEffect(() => {
    if (isOpen && activeElementRef.current) {
      activeElementRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isOpen, currentIndex]);

  if (!isOpen) return null;

  // Logic to determine Moon Phase based on score percentage
  const getMoonPhase = (percentage: number) => {
    if (percentage >= 0.9) return "🌕"; // Full
    if (percentage >= 0.75) return "🌖"; // Waning Gibbous
    if (percentage >= 0.5) return "🌗"; // Last Quarter
    if (percentage >= 0.25) return "🌘"; // Waning Crescent
    return "🌑"; // New Moon
  };

  const wrapText = (text: string, maxChars: number) => {
    if (!text) return ["..."];
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";
    words.forEach((word) => {
      if ((currentLine + word).length < maxChars) {
        currentLine += (currentLine ? " " : "") + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    });
    lines.push(currentLine);
    return lines.slice(0, 6);
  };

  return (
    <div className={`absolute inset-0 z-[150]
  flex flex-col
  overflow-y-auto
  bg-[#090E18]
  bg-gradient-to-b from-[#1B3B5A]/20 via-[#090E18] to-[#090E18]
  animate-in fade-in duration-300`}>
      {/* Background Stars Decoration */}
      <div className="absolute inset-0 opacity-20 pointer-events-none " />
      
      <div className="relative shrink-0 px-4 sm:px-6 md:px-10 py-4 sm:py-5 flex justify-between items-center">
        <div className="flex flex-col min-w-0 flex-1 mr-3">
          <h1 className="text-white text-lg sm:text-xl md:text-2xl font-medium tracking-tight truncate">
            {mainTopic}
          </h1>
        </div>
        
        <button 
          onClick={onClose}
          className="group p-2 sm:p-3 active:scale-95 cursor-pointer rounded-full text-white transition-transform flex-shrink-0"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
<div className="relative flex-1 p-3 sm:p-4 md:p-6 pb-20 sm:pb-32">
        <div className="max-w-[1400px] mx-auto space-y-12 sm:space-y-16 md:space-y-20">
          {subtopics.map((subtopic) => {
            const subtopicQuestions = questions.filter(
              (q) => (q.subtopic || q.subTopic || q.topic || "General").trim() === subtopic.trim()
            );

            const results = allSubtopicDetailedResults[subtopic] || [];
            const correctCount = results.filter((r: any) => r.status === "correct").length;
            const percentage = subtopicQuestions.length > 0 ? correctCount / subtopicQuestions.length : 0;
            const moonPhase = getMoonPhase(percentage);

            return (
              <div key={subtopic} className="space-y-6 sm:space-y-8 md:space-y-10">
                {/* Section Header */}
                <div className="flex items-center justify-between pl-1 sm:pl-2">
                  <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1 mr-2">
                    <div className="text-2xl sm:text-3xl md:text-4xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] flex-shrink-0">
                      {moonPhase}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-white text-base sm:text-lg md:text-xl font-bold tracking-wide truncate">{subtopic}</h3>
                      <p className="text-gray-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mt-0.5 sm:mt-1">
                         Accuracy: {Math.round(percentage * 100)}% • {correctCount}/{subtopicQuestions.length}
                      </p>
                    </div>
                  </div>

             <div className="flex flex-col items-end gap-2 flex-shrink-0">
  <button
    onClick={(e) => {
      e.stopPropagation();
      if (!isPro) {
        // Trigger the error state to show the lock/shake
        setProError(subtopic);
        setTimeout(() => setProError(null), 500); // Reset shake animation
        return;
      }
      onAddExtra?.(subtopic);
    }}
    disabled={isGeneratingExtra === subtopic}
    className={`
      flex items-center cursor-pointer active:scale-95 transition-transform justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border
      ${!isPro 
        ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/20" 
        : "bg-white/5 border-white/10 hover:bg-white/10"}
      ${proError === subtopic ? "animate-shake" : ""} 
      disabled:opacity-50 cursor-pointer
    `}
  >
    {isGeneratingExtra === subtopic ? (
      <Loader2 size={16} className="animate-spin text-white sm:w-[18px] sm:h-[18px]" />
    ) : !isPro ? (
      <Lock size={14} className="text-amber-500 sm:w-4 sm:h-4" />
    ) : (
      <Plus size={16} className="text-white sm:w-[18px] sm:h-[18px]" />
    )}
  </button>
</div>
                </div>

                {/* Grid of Sheets */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 md:gap-x-10 md:gap-y-14">
                  {subtopicQuestions.map((questionObj, i) => {
                    const currentGlobalIdx = questions.indexOf(questionObj);
                    const isCurrent = currentGlobalIdx === currentIndex;
                    const wrappedLines = wrapText(questionObj.question || "", 20);

            return (
  <div
    key={i}
    ref={isCurrent ? activeElementRef : null}
    onClick={() => {
      onSubtopicClick(subtopic, i);
      onClose();
    }}
    className={`
      relative cursor-pointer group
      transition-all duration-500
      ${isCurrent
        ? "opacity-100 z-20"
        : "opacity-60 hover:opacity-100 hover:-translate-y-1"
      }
    `}
  >
    {/* ================= Glow / Shadow (Original Flash Style) ================= */}
    <div
      className={`
        absolute inset-[-12px] sm:inset-[-14px] md:inset-[-18px]
        rounded-2xl
        bg-blue-500/20
        active:scale-95
        transition-transform
        blur-2xl
       duration-500
        ${isCurrent ? "opacity-100" : "opacity-0"}
      `}
    />

    {/* ================= Notebook Sheet ================= */}
    <svg
      viewBox="0 0 150 196"
      className="relative block w-full rounded-xl overflow-hidden shadow-2xl"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Paper */}
      <rect x="0" y="0" width="150" height="196" fill="#F8FAFC" />

      {/* Binder Line - Thicker and Darker */}
      <line
        x1="26"
        y1="0"
        x2="26"
        y2="176"
        stroke="#CBD5E1"
        strokeWidth="2.5"
      />

      {/* Binder Holes - Larger and Bold */}
      {[18, 42, 66, 90, 114, 138, 162].map((y) => (
        <circle
          key={y}
          cx="12"
          cy={y}
          r="5" 
          fill="#0F172A"
          fillOpacity="0.3"
        />
      ))}

      {/* ================= Badge Box (Larger) ================= */}
      <rect
        x="32"
        y="10"
        width="68"
        height="32"
        rx="6"
        fill={isCurrent ? "#1E293B" : "#475569"}
      />

      <text
        x="38"
        y="21"
        fontSize="7"
        fontWeight="800"
        fill={isCurrent ? "#94A3B8" : "#CBD5E1"}
      >
        SHEET
      </text>

      <text
        x="38"
        y="36"
        fontSize="14"
        fontWeight="bold"
        fill="#FFFFFF"
      >
        #{String(currentGlobalIdx + 1).padStart(2, "0")}
      </text>

      {/* ================= Content Lines (Thicker/More Visible) ================= */}
      {[64, 84, 104, 124, 144, 164].map((y) => (
        <line
          key={y}
          x1="32"
          y1={y}
          x2="120"
          y2={y}
          stroke="#E2E8F0"
          strokeWidth="1.5"
        />
      ))}

      {/* ================= Main Text (Bigger & Wrapped) ================= */}
      <text
        x="32"
        y="65"
        fontSize="11"
        fontWeight="700"
        fill="#1E293B"
        style={{ fontFamily: "serif" }}
      >
        {wrappedLines.map((line, idx) => (
          <tspan 
            key={idx} 
            x="32" 
            dy={idx === 0 ? 0 : 14}
          >
            {line}
          </tspan>
        ))}
      </text>
    </svg>

  </div>
);
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
      @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-4px); }
    75% { transform: translateX(4px); }
  }
  .animate-shake {
    animation: shake 0.2s ease-in-out 0s 2;
  }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.1); }
      `}</style>
    </div>
  );
};

export default SheetSelector;