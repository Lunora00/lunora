"use client";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Check, RotateCcw, Zap, Loader2, Bomb } from "lucide-react";
import { GeminiService } from "@/services/geminiService";

// --- Configuration ---
const DISPLAY_PAIR_COUNT = 6;
const CORRECT_FEEDBACK_DURATION = 500;
const INCORRECT_FEEDBACK_DURATION = 1000;

interface Pair {
  term: string;
  definition: string;
}

const useShuffledPairs = (pairs: Pair[]) => {
  const termItems = pairs.map((p) => p.term);
  const defItems = pairs.map((p) => p.definition);
  const shuffle = (array: string[]) =>
    [...array].sort(() => Math.random() - 0.5);

  return {
    shuffledTerms: useMemo(() => shuffle(termItems), [pairs]),
    shuffledDefinitions: useMemo(() => shuffle(defItems), [pairs]),
  };
};

interface MatchingItemProps {
  text: string;
  isTerm: boolean;
  isSelected: boolean;
  isFeedback: boolean;
  feedbackType: "correct" | "incorrect" | null;
  onClick: (text: string) => void;
}

const dummyPairs = [
  { term: "CPU", definition: "Processing Unit" },
  { term: "RAM", definition: "Temporary Memory" },
  { term: "GPU", definition: "Graphics Processor" },
  { term: "API", definition: "Service Bridge" },
  { term: "HTTP", definition: "Web Protocol" },
  { term: "JSON", definition: "Data Format" },
  { term: "Cache", definition: "Fast Storage" },
  { term: "Token", definition: "Access Key" },
  { term: "Cloud", definition: "Remote Server" },
  { term: "Auth", definition: "User Verification" },
];

const MatchingItem: React.FC<MatchingItemProps> = ({
  text,
  isTerm,
  isSelected,
  isFeedback,
  feedbackType,
  onClick,
}) => {
  let baseClasses =
    "p-2 sm:p-3 w-full rounded-lg sm:rounded-xl border-2 font-bold text-xs sm:text-sm md:text-base transition-all duration-300 shadow-sm cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] flex flex-col sm:flex-row items-start sm:items-center justify-between h-auto";

  // Default Style - Deep Blue & White
  baseClasses += isTerm
    ? " text-left justify-between bg-white hover:bg-sky-50 border-[#1B3358]/10 text-[#1B3358]"
    : " text-right justify-between bg-white hover:bg-sky-50 border-[#1B3358]/10 text-[#1B3358]";

  const Icon = () => {
    if (feedbackType === "correct" && isFeedback) {
      return (
        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
      );
    }
    if (feedbackType === "incorrect" && isFeedback) {
      return (
        <Bomb className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
      );
    }
    return null;
  };

  if (feedbackType === "incorrect" && isFeedback) {
    baseClasses = `p-2 sm:p-3 w-full rounded-lg sm:rounded-xl border-2 font-bold text-xs sm:text-sm md:text-base transition-all duration-300 shadow-xl cursor-not-allowed flex items-center min-h-[48px] sm:min-h-[52px] md:h-12 
                       bg-red-100 border-red-500 text-red-900 
                       animate-shake-item !shadow-red-500/30`;
  } else if (feedbackType === "correct" && isFeedback) {
    baseClasses = `p-2 sm:p-3 w-full rounded-lg sm:rounded-xl border-2 font-bold text-xs sm:text-sm md:text-base shadow-lg cursor-not-allowed flex items-center min-h-[48px] sm:min-h-[52px] md:h-12 
                       opacity-0 scale-90 translate-y-1 bg-green-100 border-green-500
                       transition-all !duration-[${CORRECT_FEEDBACK_DURATION}ms] ease-in-out`;
  } else if (isSelected) {
    baseClasses = `p-2 sm:p-3 w-full rounded-lg sm:rounded-xl border-2 font-black text-xs sm:text-sm md:text-base transition-all duration-300 shadow-xl cursor-pointer transform scale-[1.03] flex items-center min-h-[48px] sm:min-h-[52px] md:h-12 
                       bg-sky-50 border-[#1B3358] ring-4 ring-[#1B3358]/20 text-[#1B3358]`;
  }

  const content = (
    <>
      {isTerm ? (
        <>
          <span
            className="  flex-grow min-w-0
  text-left
  max-[400px]:text-left
  break-words whitespace-pre-wrap pr-1"
          >
            {text}
          </span>
          <span className="ml-1 sm:ml-2 flex-shrink-0">{Icon()}</span>
        </>
      ) : (
        <>
          <span className="mr-1 sm:mr-2 flex-shrink-0">{Icon()}</span>
          <span
            className="flex-grow min-w-0
  text-right
  max-[400px]:text-right
  break-words whitespace-normal pl-1"
          >
            {text}
          </span>
        </>
      )}
    </>
  );

  return (
    <button
      onClick={() => onClick(text)}
      disabled={feedbackType !== null}
      className={`p-2 sm:p-3 w-full rounded-lg sm:rounded-xl border-2 font-bold text-xs sm:text-sm md:text-base transition-all duration-300 shadow-sm cursor-pointer transform hover:scale-[1.01] active:scale-[0.99] flex items-start justify-between h-auto min-h-[48px] ${baseClasses}`}
    >
      {content}
    </button>
  );
};

export default function BlastModePanel({ content }: { content: string }) {
  const [allPairs, setAllPairs] = useState<Pair[] | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Pair[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(
    null
  );
  const [feedback, setFeedback] = useState<{
    type: "correct" | "incorrect" | null;
    term?: string;
    definition?: string;
  }>({ type: null });

  const geminiService = useMemo(() => new GeminiService(), []);

  const start = useCallback(async () => {
    setIsLoading(true);
    setAllPairs(null);
    setMatchedPairs([]);
    setIsCompleted(false);
    setSelectedTerm(null);
    setSelectedDefinition(null);
    setFeedback({ type: null });

    try {
      const effectiveContent = content || "No content provided.";
      const fullPairList = await geminiService.generateBlastPairs(
        effectiveContent
      );
      setAllPairs(fullPairList);
    } catch (error) {
      setAllPairs(dummyPairs);
      console.error("Failed to load pairs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [content, geminiService]);

  useEffect(() => {
    start();
  }, [start]);

  const currentDisplayPairs = useMemo(() => {
    if (!allPairs) return [];
    const required = DISPLAY_PAIR_COUNT;
    const unmatched = allPairs.filter(
      (p) => !matchedPairs.some((m) => m.term === p.term)
    );
    return unmatched.slice(0, required);
  }, [allPairs, matchedPairs.length]);

  useEffect(() => {
    if (
      allPairs &&
      matchedPairs.length === allPairs.length &&
      allPairs.length > 0
    ) {
      setIsCompleted(true);
    }
  }, [matchedPairs.length, allPairs]);

  const { shuffledTerms, shuffledDefinitions } =
    useShuffledPairs(currentDisplayPairs);
  const totalPairs = allPairs?.length || 0;

  const executeBlastPenalty = useCallback(
    (term: string, definition: string) => {
      if (currentDisplayPairs.length === 0) return;
      setFeedback({
        type: "incorrect",
        term: term,
        definition: definition,
      });

      const penaltyTimer = setTimeout(() => {
        setSelectedTerm(null);
        setSelectedDefinition(null);
        setFeedback({ type: null });
      }, INCORRECT_FEEDBACK_DURATION);

      return () => clearTimeout(penaltyTimer);
    },
    [currentDisplayPairs]
  );

  const handleCorrectMatch = useCallback(
    (term: string, definition: string) => {
      const matchedPair = currentDisplayPairs.find((p) => p.term === term);
      if (!matchedPair) return;

      setFeedback({
        type: "correct",
        term: matchedPair.term,
        definition: matchedPair.definition,
      });

      const correctTimer = setTimeout(() => {
        setMatchedPairs((prev) => [...prev, matchedPair]);
        setSelectedTerm(null);
        setSelectedDefinition(null);
        setFeedback({ type: null });
      }, CORRECT_FEEDBACK_DURATION);

      return () => clearTimeout(correctTimer);
    },
    [currentDisplayPairs]
  );

  const handleItemClick = useCallback(
    (text: string, isTerm: boolean) => {
      if (feedback.type) return;

      if (isTerm) {
        if (selectedDefinition) {
          const isCorrect = currentDisplayPairs.some(
            (p) => p.term === text && p.definition === selectedDefinition
          );
          isCorrect
            ? handleCorrectMatch(text, selectedDefinition)
            : executeBlastPenalty(text, selectedDefinition);
        } else if (selectedTerm === text) {
          setSelectedTerm(null);
        } else {
          setSelectedTerm(text);
        }
      } else {
        if (selectedTerm) {
          const isCorrect = currentDisplayPairs.some(
            (p) => p.term === selectedTerm && p.definition === text
          );
          isCorrect
            ? handleCorrectMatch(selectedTerm, text)
            : executeBlastPenalty(selectedTerm, text);
        } else if (selectedDefinition === text) {
          setSelectedDefinition(null);
        } else {
          setSelectedDefinition(text);
        }
      }
    },
    [
      selectedTerm,
      selectedDefinition,
      currentDisplayPairs,
      handleCorrectMatch,
      executeBlastPenalty,
      feedback.type,
    ]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 w-full h-full min-h-[300px] sm:min-h-[400px]">
        <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 text-[#1B3358] animate-spin" />
        <p className="mt-3 sm:mt-4 text-lg sm:text-xl font-bold text-[#1B3358] text-center px-4">
          Wiring up the knowledge...
        </p>
        <p className="text-xs sm:text-sm text-[#1B3358]/60 mt-1 uppercase tracking-widest text-[10px] sm:text-[10px]">
          Generating Blast Pairs
        </p>
      </div>
    );
  }

  if (isCompleted)
    return (
      <div className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 w-full h-full min-h-[300px] sm:min-h-[400px] text-[#1B3358]">
        <div className="bg-[#1B3358] p-4 sm:p-6 rounded-full shadow-2xl mb-4 sm:mb-6">
          <Check className="w-12 h-12 sm:w-16 sm:h-16 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black mb-2 tracking-tighter uppercase text-center px-4">
          ALL MATCHED!
        </h2>
        <p className="text-[#1B3358]/70 text-center mb-6 sm:mb-8 text-base sm:text-lg font-medium px-4 max-w-md">
          You've successfully connected all **{totalPairs}** knowledge circuits.
        </p>
        <button
          onClick={start}
          className="px-6 sm:px-8 md:px-10 py-3 sm:py-4 bg-[#1B3358] text-white font-black rounded-full flex items-center gap-2 sm:gap-3 text-base sm:text-lg shadow-xl hover:bg-[#12243d] transition transform hover:scale-[1.05] active:scale-95"
        >
          <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6" />
          Restart Matching
        </button>
      </div>
    );

  return (
    <div className="w-full max-w-xl mx-auto p-0 flex flex-col h-full min-h-[100svh] sm:min-h-[400px] relative overflow-y-auto hide-scrollbar">
      <style jsx global>{`
        .animate-shake-item {
          animation: shake-item 0.8s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes shake-item {
          10%,
          90% {
            transform: translate3d(-3px, 0, 0) scale(1.02);
            box-shadow: 0 0 10px #f87171;
          }
          20%,
          80% {
            transform: translate3d(+6px, 0, 0) scale(1.02);
          }
          30%,
          50%,
          70% {
            transform: translate3d(-12px, 0, 0) scale(1.02);
          }
          40%,
          60% {
            transform: translate3d(+12px, 0, 0) scale(1.02);
          }
        }
      `}</style>

      <div className="grid grid-cols-2  gap-3 sm:gap-4 p-3 sm:p-4 md:p-6 flex-grow rounded-t-lg">
        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#1B3358]/60 text-left">
            Section 1
          </p>
          {shuffledTerms.map((term) => (
            <MatchingItem
              key={term}
              text={term}
              isTerm={true}
              isSelected={selectedTerm === term}
              isFeedback={feedback.term === term}
              feedbackType={feedback.type}
              onClick={(t) => handleItemClick(t, true)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-2 sm:gap-3">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#1B3358]/60 text-left">
            Section 2
          </p>
          {shuffledDefinitions.map((definition) => (
            <MatchingItem
              key={definition}
              text={definition}
              isTerm={false}
              isSelected={selectedDefinition === definition}
              isFeedback={feedback.definition === definition}
              feedbackType={feedback.type}
              onClick={(d) => handleItemClick(d, false)}
            />
          ))}
        </div>
      </div>

      {allPairs && allPairs.length > 0 && (
        <div className="p-3  sm:p-4 text-[#1B3358] flex justify-center text-xs sm:text-sm font-black rounded-full mx-3 sm:mx-4 md:mx-6 mb-18 sm:mb-6 md:mb-8">
          <span className="tracking-widest uppercase">
            PROGRESS: {matchedPairs.length} / {totalPairs}
          </span>
        </div>
      )}
    </div>
  );
}
