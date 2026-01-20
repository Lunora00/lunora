import React from "react";
import { ReactTyped } from "react-typed";
import {
  Loader2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";

type ContentType = "youtube" | "web";

interface Step3URLInputProps {
  contentType: ContentType;
  setContentType: (type: ContentType) => void;
  importSource: string;
  setImportSource: (value: string) => void;
  isCreating: boolean;
  urlError: string;
  setUrlError: (error: string) => void;
  processingStep: string;
  onSubmit: () => void;
  onBack: () => void;
  isUrlValidAndReady: boolean;
  PRIMARY_COLOR: string;
  ACCENT_COLOR: string;
  FEYNMAN_NAME: string;
  FEYNMAN_IMAGE_URL: string;
  TYPING_QUOTE: string;
  stars: Array<{
    id: number;
    left: string;
    top: string;
    size: string;
    delay: string;
  }>;
}

const ContentTypeButton: React.FC<{
  type: ContentType;
  currentType: ContentType;
  label: string;
  icon: React.ReactNode;
  isCreating: boolean;
  setContentType: (type: ContentType) => void;
  setImportSource: (value: string) => void;
}> = ({
  type,
  currentType,
  label,
  icon,
  isCreating,
  setContentType,
  setImportSource,
}) => (
  <button
    onClick={() => {
      setImportSource("");
      setContentType(type);
    }}
    disabled={isCreating}
    className={`flex items-center justify-center gap-2 flex-1 px-4 py-2 rounded-full font-bold transition-all duration-300 ease-in-out ${
      currentType === type
        ? "bg-white text-gray-900 shadow-md ring-2 ring-gray-100"
        : "bg-transparent text-gray-500 hover:text-gray-700"
    } ${isCreating ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
    <span className="sm:hidden">{type === "youtube" ? "Video" : "Web"}</span>
  </button>
);

const Step3URLInput: React.FC<Step3URLInputProps> = ({
  importSource,
  setImportSource,
  isCreating,
  urlError,
  setUrlError,
  onSubmit,
  onBack,
  stars,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
      {/* Container matched to Topic component: centered with mx-auto and mb-25 */}
      <div className="w-full mb-25 max-w-lg relative p-4 animate-in fade-in-0 duration-300 mx-auto">
        {/* Title - Matching Lunora Style */}
        <h3 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-white mb-10 relative z-10 drop-shadow-md">
          Import Source
        </h3>

        {/* Input Container */}
        <div className="relative z-10 group">
          <div className="relative flex items-center transition-all duration-500">
            {/* Left Icon - Ensured visibility */}
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <AlertCircle className="w-5 h-5 text-white/40 group-focus-within:text-white/80 transition-colors" />
            </div>

            <input
              type="text"
              placeholder="Paste YouTube link or Article URL..."
              value={importSource}
              onChange={(e) => {
                setImportSource(e.target.value);
                if (setUrlError) setUrlError("");
              }}
              className="w-full pl-12 pr-16 py-4 rounded-full text-lg font-medium placeholder-white/20 
            border border-white/10 bg-white/5 backdrop-blur-md
            text-white focus:outline-none focus:bg-white/10 focus:border-white/30 transition-all duration-300"
              disabled={isCreating}
              autoFocus
            />
            {/* Right Submit Button - Consistent Moonlight Glow */}
            <button
              onClick={onSubmit}
              disabled={!importSource.length || isCreating}
              className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 cursor-pointer rounded-full z-20 transition-all duration-300
            ${
              isCreating
                ? "bg-white/5 text-white/20"
                : importSource.length > 5
                  ? "bg-white text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)]"
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
        </div>
         {urlError && (
<div className="mt-2 p-2 rounded text-red-400 text-sm flex items-center gap-2 leading-tight">
  <AlertCircle className="w-4 h-4 flex-shrink-0 relative top-[1px]" />
  <span className="leading-tight">{urlError}</span>
</div>

  )}
      </div>
      
    </div>
  );
};

export default Step3URLInput;
