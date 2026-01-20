import React, { useState } from "react";
import {
  BookOpen,
  RotateCw,
  ArrowRight,
  ArrowLeft,
  RefreshCcw,
} from "lucide-react";
import { Flashcard } from "@/services/geminiService";

interface FlashcardsPanelProps {
  subtopicName?: string;
  flashcardContent: Flashcard[] | null;
  isGenerating: boolean;
  handleGenerateFlashcards: () => void;
}

export const FlashcardsPanel: React.FC<FlashcardsPanelProps> = ({
  subtopicName,
  flashcardContent,
  isGenerating,
  handleGenerateFlashcards,
}) => {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [slideOut, setSlideOut] = useState(false);

  const current = flashcardContent?.[index];

  const nextCard = () => {
    if (index >= flashcardContent!.length - 1) return;
    setSlideOut(true);
    setTimeout(() => {
      setIsFlipped(false);
      setSlideOut(false);
      setIndex((prev) => prev + 1);
    }, 280);
  };

  const prevCard = () => {
    if (index === 0) return;
    setSlideOut(true);
    setTimeout(() => {
      setIsFlipped(false);
      setSlideOut(false);
      setIndex((prev) => prev - 1);
    }, 280);
  };

  return (
    <div className="w-full min-h-full px-4 sm:px-6 md:px-8 py-6 flex flex-col items-center pt-8 sm:pt-10 overflow-x-hidden relative">

      {/* Loading */}
      {isGenerating && flashcardContent === null && (
        <div className="text-[#1B3358] font-bold text-center text-base sm:text-lg mb-6 flex items-center">
          <RotateCw className="animate-spin w-5 h-5 sm:w-6 sm:h-6 mr-2" />
          Generating cards...
        </div>
      )}

      {/* Empty */}
      {!isGenerating && (!flashcardContent || flashcardContent.length === 0) && (
        <div className="text-center text-[#1B3358]/70 text-sm sm:text-base mb-6 max-w-xs sm:max-w-sm font-medium">
          Click <b className="text-[#1B3358]">Generate Flashcards</b> to start a learning round.
        </div>
      )}

      {/* Flashcard */}
      {current && (
        <div className="relative w-full max-w-[22rem] sm:max-w-md h-56 sm:h-72 max-[350px]:h-48 mb-6 overflow-hidden">
          <div className="absolute inset-0 scale-95 bg-[#1B3358]/10 rounded-3xl opacity-40" />
          <div className="absolute inset-0 scale-90 bg-[#1B3358]/20 rounded-3xl opacity-20" />

          <div
            className={`absolute inset-0 bg-white rounded-3xl shadow-xl px-4 sm:px-6 text-center cursor-pointer transition-transform duration-300 border border-[#1B3358]/5
              ${slideOut ? "translate-x-[140%] opacity-0" : ""}
              ${isFlipped ? "rotate-y-180" : ""}`}
            onClick={() => setIsFlipped((f) => !f)}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* FRONT */}
            <div className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-4 sm:p-6">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#1B3358]/40 uppercase mb-3 tracking-widest">
                Question
              </span>
              <p className="font-extrabold text-lg max-[350px]:text-base sm:text-2xl text-[#1B3358] leading-snug">
                {current.term}
              </p>
              <div className="mt-4 text-[#1B3358]/30">
                <RefreshCcw size={18} />
              </div>
            </div>

            {/* BACK */}
            <div className="absolute inset-0 rotate-y-180 backface-hidden flex flex-col items-center justify-center p-4 sm:p-6">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#1B3358]/40 uppercase mb-3 tracking-widest">
                Answer
              </span>
              <p className="text-sm sm:text-lg text-[#1B3358]/90 font-medium leading-relaxed">
                {current.definition}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      {flashcardContent && flashcardContent.length > 0 && (
        <div className="flex gap-3 sm:gap-4 w-full max-w-[22rem] sm:max-w-md">
          <button
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-full font-bold border-2 transition-all
              ${
                index === 0
                  ? "opacity-30 border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-[#1B3358] text-[#1B3358] bg-white hover:bg-gray-50 active:scale-95"
              }`}
            onClick={prevCard}
            disabled={index === 0}
          >
            <ArrowLeft size={16} />
            <span className="max-[350px]:hidden">Prev</span>
          </button>

          <button
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 sm:py-3 rounded-full font-bold border-2 transition-all
              ${
                index === flashcardContent.length - 1
                  ? "opacity-30 border-gray-300 text-gray-400 cursor-not-allowed"
                  : "border-[#1B3358] text-[#1B3358] bg-white hover:bg-gray-50 active:scale-95"
              }`}
            onClick={nextCard}
            disabled={index === flashcardContent.length - 1}
          >
            <span className="max-[350px]:hidden">Next</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Restart */}
      {flashcardContent && index === flashcardContent.length - 1 && (
        <button
          className="mt-5 w-full max-w-xs py-2 sm:py-4 bg-[#1B3358] text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-[#12243d] active:scale-95 transition-all"
          onClick={handleGenerateFlashcards}
        >
          <RefreshCcw size={18} />
          <span className="max-[350px]:hidden">Restart / Generate More</span>
        </button>
      )}

      {/* Initial Generate */}
      {!flashcardContent && (
        <button
          className={`w-full max-w-xs mt-4 py-2 sm:py-4 bg-[#1B3358] text-white rounded-full font-extrabold shadow-lg transition-all active:scale-95
            ${isGenerating ? "cursor-not-allowed opacity-50" : ""}`}
          onClick={handleGenerateFlashcards}
          disabled={isGenerating}
        >
          <span className="max-[350px]:hidden">
            {isGenerating ? "Generating..." : "GENERATE FLASHCARDS"}
          </span>
          <span className="hidden max-[350px]:inline">
            <RefreshCcw size={18} className="mx-auto" />
          </span>
        </button>
      )}
    </div>
  );
};
