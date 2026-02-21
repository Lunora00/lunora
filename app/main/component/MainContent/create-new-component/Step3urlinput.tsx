import React, { useRef } from "react";
import { Loader2, AlertCircle, ArrowRight, Upload, Link, X } from "lucide-react";

type ContentType = "youtube" | "web" | "file";

interface Step3URLInputProps {
  contentType: ContentType;
  setContentType: (type: ContentType) => void;
  importSource: string | File;
  setImportSource: (value: string | File) => void;
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

const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "video/mp4",
  "video/quicktime",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
];

const SUPPORTED_EXTENSIONS = [".pdf", ".mp3", ".wav", ".mp4", ".mov", ".png", ".jpg", ".jpeg", ".txt", ".docx"];

const MAX_FILE_SIZE_MB = 100;

const Step3URLInput: React.FC<Step3URLInputProps> = ({
  contentType,
  setContentType,
  importSource,
  setImportSource,
  isCreating,
  urlError,
  setUrlError,
  onSubmit,
  onBack,
  stars,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isFileMode = contentType === "file";
  const selectedFile = importSource instanceof File ? importSource : null;
  const urlValue = typeof importSource === "string" ? importSource : "";

  // Determine if ready to submit
  const canSubmit = isFileMode
    ? selectedFile !== null
    : urlValue.trim().length > 5;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    const isValidType =
      SUPPORTED_FILE_TYPES.includes(file.type) ||
      SUPPORTED_EXTENSIONS.includes(ext);

    if (!isValidType) {
      setUrlError(
        `Unsupported file type. Supported: PDF,DOCX, MP3, WAV, MP4, MOV, PNG, JPG, TXT`
      );
      return;
    }

    // Validate size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setUrlError(`File too large. Max size is ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    setUrlError("");
    setImportSource(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const fakeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleFileSelect(fakeEvent);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearFile = () => {
    setImportSource("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    setUrlError("");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[400px]">
      <div className="w-full mb-25 max-w-lg relative p-4 animate-in fade-in-0 duration-300 mx-auto">

        {/* Title */}
        <h3 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-white mb-6 relative z-10 drop-shadow-md">
          Import Source
        </h3>

        {/* Tab Switcher: URL vs File */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => {
              setContentType("youtube");
              setImportSource("");
              setUrlError("");
            }}
            disabled={isCreating}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
              ${contentType !== "file"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
              } ${isCreating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Link className="w-4 h-4" />
            URL / Link
          </button>

          <button
            onClick={() => {
              setContentType("file");
              setImportSource("");
              setUrlError("");
            }}
            disabled={isCreating}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
              ${contentType === "file"
                ? "bg-white text-slate-900 shadow-md"
                : "bg-white/10 text-white/60 hover:text-white hover:bg-white/15"
              } ${isCreating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            <Upload className="w-4 h-4" />
            Upload File
          </button>
        </div>

        {/* ── URL INPUT MODE ── */}
        {!isFileMode && (
          <div className="relative z-10 group">
            <div className="relative flex items-center transition-all duration-500">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
                <AlertCircle className="w-5 h-5 text-white/40 group-focus-within:text-white/80 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Paste YouTube link or Article URL..."
                value={urlValue}
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
              <button
                onClick={onSubmit}
                disabled={!canSubmit || isCreating}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-3 cursor-pointer rounded-full z-20 transition-all duration-300
                  ${isCreating
                    ? "bg-white/5 text-white/20"
                    : canSubmit
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
        )}

        {/* ── FILE UPLOAD MODE ── */}
        {isFileMode && (
          <div className="relative z-10">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={SUPPORTED_EXTENSIONS.join(",")}
              onChange={handleFileSelect}
              className="hidden"
              disabled={isCreating}
            />

            {selectedFile ? (
              /* File selected state */
              <div className="flex items-center gap-3 px-4 py-4 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate text-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>

                {/* Clear file */}
                {!isCreating && (
                  <button
                    onClick={clearFile}
                    className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Submit */}
                <button
                  onClick={onSubmit}
                  disabled={isCreating}
                  className={`p-3 rounded-full z-20 transition-all duration-300
                    ${isCreating
                      ? "bg-white/5 text-white/20 cursor-not-allowed"
                      : "bg-white text-slate-950 shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.6)] cursor-pointer"
                    }`}
                >
                  {isCreating ? (
                    <Loader2 className="w-5 h-5 animate-spin text-white/40" />
                  ) : (
                    <ArrowRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            ) : (
              /* Drag-and-drop / click to upload area */
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !isCreating && fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 px-6 py-10 rounded-2xl
                  border-2 border-dashed border-white/20 bg-white/5 backdrop-blur-md
                  transition-all duration-300
                  ${isCreating
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:border-white/40 hover:bg-white/10 active:scale-[0.98]"
                  }`}
              >
                <div className="p-4 rounded-full bg-white/10">
                  <Upload className="w-7 h-7 text-white/70" />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-base">
                    Click or drag file here
                  </p>
                  <p className="text-white/40 text-xs mt-1">
                    PDF,DOCX, MP3, WAV, MP4, MOV, PNG, JPG, TXT — max {MAX_FILE_SIZE_MB}MB
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {urlError && (
          <div className="mt-3 p-2 rounded text-red-400 text-sm flex items-center gap-2 leading-tight">
            <AlertCircle className="w-4 h-4 flex-shrink-0 relative top-[1px]" />
            <span className="leading-tight">{urlError}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Step3URLInput;