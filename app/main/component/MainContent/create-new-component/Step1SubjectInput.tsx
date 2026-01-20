import React from "react";
import { ChevronDown, AlertCircle, ArrowRight, Loader2 } from "lucide-react";

interface Step1SubjectInputProps {
  subject: string;
  setSubject: (value: string) => void;
  showPrevSubjects: boolean;
  setShowPrevSubjects: (show: boolean) => void;
  prevSubjects: string[];
  isSubjectsLoading: boolean;
  isCreating: boolean;
  urlError: string;
  setUrlError: (error: string) => void;
  onSubmit: () => void;
  ACCENT_COLOR: string;
  stars: Array<{
    id: number;
    left: string;
    top: string;
    size: string;
    delay: string;
  }>;
}

const Step1SubjectInput: React.FC<Step1SubjectInputProps> = ({
  subject,
  setSubject,
  showPrevSubjects,
  setShowPrevSubjects,
  prevSubjects,
  isSubjectsLoading,
  isCreating,
  urlError,
  setUrlError,
  onSubmit,
  ACCENT_COLOR,
  stars,
}) => {
  const isSubjectReady = subject.trim() !== "" && !isCreating;

  return (
<div className="w-full mb-25 max-w-lg relative p-4 animate-in fade-in-0 duration-300">

  {/* Title - Clean White */}
  <h3 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-white mb-10 relative z-10 drop-shadow-sm">
    What subject are you training on?
  </h3>

  {/* Input Container */}
  <div className="relative z-10">
    {/* Left Icon – Light Glass */}
   <button
  onClick={() => setShowPrevSubjects(!showPrevSubjects)}
  disabled={isCreating || isSubjectsLoading}
  className={`
    absolute left-3 top-1/2 -translate-y-1/2 z-20
    p-2 rounded-full
    cursor-pointer
    transition-all duration-300
    active:scale-95
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30

    ${showPrevSubjects ? "rotate-180 bg-white/20" : "rotate-0 bg-transparent"}

    ${
      isCreating || isSubjectsLoading
        ? "text-white/20 cursor-not-allowed"
        : "text-white/60 hover:text-white hover:bg-white/10"
    }
  `}
>
  <ChevronDown className="w-5 h-5" />
</button>


    {/* Input - Super Light & Clean */}
    <input
      type="text"
      placeholder="Computer science"
      value={subject}
      onChange={(e) => {
        setSubject(e.target.value);
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
    {/* Right Submit Button – Subtle Glow, No Heavy Yellow */}
  <button
  onClick={onSubmit}
  disabled={!isSubjectReady || isCreating}
  className={`
    absolute right-3 top-1/2 -translate-y-1/2 z-20
    p-3 rounded-full
    cursor-pointer
    transition-all duration-300
    active:scale-95
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30

    ${
      isCreating
        ? "bg-white/5 text-white/20 cursor-not-allowed"
        : isSubjectReady
        ? "bg-white text-slate-900 hover:bg-neutral-200"
        : "bg-white/10 text-white/20 opacity-50 cursor-not-allowed"
    }
  `}
>
  <ArrowRight className="w-6 h-6" />
</button>

  </div>

  {/* Minimal Floating Dropdown - Matching Navbar's "Home" button style */}
  {showPrevSubjects && (
    <div
      className="absolute left-0 right-0 mt-3 p-2 z-30
       
        max-h-56 overflow-y-auto hide-scrollbar"
    >
      <div className="space-y-1">
        {isSubjectsLoading && (
          <div className="flex items-center justify-center gap-2 p-3 text-sm text-white/40">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading...
          </div>
        )}

        {!isSubjectsLoading && prevSubjects.length === 0 && (
          <div className="p-3 text-sm text-white/30 italic text-center">
            No past subjects found.
          </div>
        )}

        {!isSubjectsLoading &&
          prevSubjects.length > 0 &&
          prevSubjects.map((prevSubject) => (
            <button
              key={prevSubject}
              onClick={() => {
                setSubject(prevSubject);
                setUrlError("");
                setShowPrevSubjects(false);
              }}
              className={`w-full cursor-pointer text-left truncate px-4 py-2 rounded-full text-sm
                transition-all duration-150 
                ${
                  subject === prevSubject
                    ? " text-white font-medium"
                    : "text-white/60  hover:text-white"
                }`}
              disabled={isCreating}
              title={prevSubject}
            >
              {prevSubject}
            </button>
          ))}
      </div>
    </div>
  )}

  {/* Error Box - Clean Red Tint */}
  {urlError && (
    <div className="flex items-center gap-3 text-red-200/80 bg-red-500/10  p-3 px-5 rounded-full  mt-6 relative z-10">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span className="text-xs font-medium uppercase tracking-wider">{urlError}</span>
    </div>
  )}
</div>
  );
};

export default Step1SubjectInput;