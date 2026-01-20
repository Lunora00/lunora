import React, { useState, useEffect } from "react";

interface NavigationControlsProps {
  currentQuestion: number;
  totalQuestions: number;
  isAnswered: boolean;
  onPrevious: () => void;
  onNext: () => void;
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);
  const isLastQuestion = currentQuestion + 1 === totalQuestions;

  useEffect(() => {
    setIsConfirming(false);
  }, [currentQuestion]);

  const handleAction = () => {
    if (isLastQuestion) {
      if (!isConfirming) setIsConfirming(true);
      else onNext();
    } else {
      onNext();
    }
  };

  return (
    <div className="w-full py-3 md:py-4 bg-transparent">
      <div className="flex justify-between items-center text-[10px] md:text-[11px] uppercase tracking-[0.2em] md:tracking-[0.25em] font-black">
        {/* PREVIOUS */}
        <button
          onClick={onPrevious}
          disabled={currentQuestion === 0}
          className={`flex cursor-pointer active:scale-95 items-center gap-2 ml-3 sm:ml:0 transition-transform group
            ${
              currentQuestion === 0
                ? "opacity-0 pointer-events-none"
                : "text-slate-400 hover:text-slate-900"
            }`}
        >
          <span className="text-xl leading-none active:scale-95 transition-transform group-hover:-translate-x-1">
            ←
          </span>
          <span className="nav-text">Back</span>
        </button>

        {/* PAGE COUNTER */}
        <div className="relative">
          <div
            className="
            px-4 md:px-6 py-1.5 rounded-full
            bg-slate-50
            
            border border-slate-200
            italic normal-case font-serif tracking-normal
            text-slate-700 text-sm
          "
          >
            {/* FULL (DESKTOP) */}
            <span className="nav-page-full">
              — Page{" "}
              <span className="font-black text-blue-600">
                {currentQuestion + 1}
              </span>{" "}
              of {totalQuestions} —
            </span>

            {/* COMPACT (MOBILE) */}
            <span className="nav-page-compact font-black text-blue-600">
              {currentQuestion + 1}/{totalQuestions}
            </span>
          </div>
        </div>

        {/* NEXT / FINISH */}
        <button
          onClick={handleAction}
          className={`flex cursor-pointer
             items-center gap-2 transition-all active:scale-95 group px-3 py-1.5 rounded-md
            ${
              isConfirming
                ? "text-red-500 animate-pulse font-black"
                : "text-slate-700 hover:text-blue-600"
            }`}
        >
          <span className="nav-text active:scale-95 transition-transform cursor-pointer font-black">
            {isConfirming ? "Confirm" : isLastQuestion ? "Finish" : "Next"}
          </span>

          <span className="text-xl leading-none active:scale-95 transition-transform group-hover:translate-x-1 ">
            {isConfirming || isLastQuestion ? "■" : "→"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default NavigationControls;
