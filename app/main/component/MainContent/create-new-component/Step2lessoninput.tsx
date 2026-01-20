import React from "react";
import { ChevronDown, AlertCircle, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";

interface Step2LessonInputProps {
  lessonTopic: string;
  setLessonTopic: (value: string) => void;
  showPrevSubjects: boolean;
  setShowPrevSubjects: (show: boolean) => void;
  prevTopics: string[];
  isSubjectsLoading: boolean;
  isCreating: boolean;
  urlError: string;
  setUrlError: (error: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  ACCENT_COLOR: string;
  stars: Array<{
    id: number;
    left: string;
    top: string;
    size: string;
    delay: string;
  }>;
}

const Step2LessonInput: React.FC<Step2LessonInputProps> = ({
  lessonTopic,
  setLessonTopic,
  showPrevSubjects,
  setShowPrevSubjects,
  prevTopics,
  isSubjectsLoading,
  isCreating,
  urlError,
  setUrlError,
  onSubmit,
  onBack,
  ACCENT_COLOR,
  stars,
}) => {
  const isLessonReady = lessonTopic.trim() !== "" && !isCreating;

  return (
<div className="w-full mb-25 max-w-lg relative p-4 animate-in fade-in-0 duration-300">
  {/* Title - Matches Lunora Style */}
  <h3 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-white mb-10 relative z-10 drop-shadow-md">
    What lesson or topic are you focusing on?
  </h3>

  {/* Input Container */}
  <div className="relative z-10">
    {/* Left Icon – Minimal Glass */}
    <button
      onClick={() => setShowPrevSubjects(!showPrevSubjects)}
      disabled={isCreating || isSubjectsLoading}
      className={`absolute left-3 cursor-pointer top-1/2 -translate-y-1/2 p-2 rounded-full z-20 
        transition-all duration-300
        ${showPrevSubjects ? "rotate-180 bg-white/20" : "rotate-0 bg-transparent"}
        ${
          isCreating || isSubjectsLoading
            ? "text-white/20"
            : "text-white/50 hover:text-white"
        }
      `}
    >
      <ChevronDown className="w-5 h-5" />
    </button>

    {/* Input - Clean Lunar Glass */}
    <input
      type="text"
      placeholder="Data structures"
      value={lessonTopic}
      onChange={(e) => {
        setLessonTopic(e.target.value);
        setUrlError("");
        if (showPrevSubjects) setShowPrevSubjects(false);
      }}
      className="w-full pl-14 pr-24 py-4 rounded-full text-lg font-medium placeholder-white/20
        border border-white/10 bg-white/5 backdrop-blur-md
        text-white transition-all duration-300
        focus:outline-none focus:bg-white/10 focus:border-white/30"
      disabled={isCreating}
      autoFocus
    />
     {urlError && (
      <div className="mt-4 p-2 bg-red-500/10 border border-red-500/40 rounded text-red-400 text-sm flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /> {urlError}
      </div>
    )}

    {/* Right Submit Button - White Glow Style */}
    <button
      onClick={onSubmit}
      disabled={!isLessonReady}
      className={`absolute right-3 cursor-pointer top-1/2 -translate-y-1/2 p-3 rounded-full z-20 transition-all duration-300
        ${
          isCreating
            ? "bg-white/5 text-white/20"
            : isLessonReady
            ? "bg-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
            : "bg-white/10 text-white/20 opacity-50"
        }`}
    >
      {isCreating ? (
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      ) : (
        <ArrowRight className="w-6 h-6" />
      )}
    </button>
  </div>

  {/* Minimal Floating Dropdown - Matches Navbar Items */}
  {showPrevSubjects && (
    <div
      className="absolute left-0 right-0 mt-3 p-2 z-30     
        max-h-56 overflow-y-auto hide-scrollbar"
    >
      <div className="space-y-1">
        {isSubjectsLoading && (
          <div className="flex items-center justify-center gap-2 p-3 text-sm text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading previous topics...
          </div>
        )}

        {!isSubjectsLoading && prevTopics.length === 0 && (
          <div className="p-3 text-sm text-white/30 italic text-center">
            No past topics found. Start a new one!
          </div>
        )}

        {!isSubjectsLoading &&
          prevTopics.length > 0 &&
          prevTopics.map((prevTopic) => (
            <button
              key={prevTopic}
              onClick={() => {
                setLessonTopic(prevTopic);
                setUrlError("");
                setShowPrevSubjects(false);
              }}
              className={`w-full cursor-pointer text-left truncate px-4 py-2 rounded-full text-sm
                transition-all duration-150 
                ${
                  lessonTopic === prevTopic
                    ? " text-white font-medium"
                    : "text-white/60  hover:text-white"
                }`}
              disabled={isCreating}
              title={prevTopic}
            >
              {prevTopic}
            </button>
          ))}
      </div>
    </div>
  )}


</div>
  );
};

export default Step2LessonInput;