import * as React from "react";
import { ArrowRight, Plus, ChevronDown } from "lucide-react";
import LoadingScreen from "@/app/LoadingScreen";
import { useRouter } from "next/navigation";

interface testbookTopic {
  id: number;
  name: string;
  sheets: number;
}

interface TopBarProps {
  selectedChapter: string;
  setSelectedChapter: (chapter: string) => void;
  testbookTopics?: testbookTopic[];
  filteredSessionsCount: number;
  onCreateNew: () => void;
  subject: string;
}

const TopBar: React.FC<TopBarProps> = ({
  selectedChapter,
  setSelectedChapter,
  testbookTopics = [],
  filteredSessionsCount,
  onCreateNew,
  subject,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [pageLoading, setPageLoading] = React.useState(false);
  const router = useRouter();

  const formattedSubject =
    subject.charAt(0).toUpperCase() + subject.slice(1).toLowerCase();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (name: string) => {
    setSelectedChapter(name);
    setIsOpen(false);
  };

  return (
    <div className="relative px-4 sm:mx-0 md:mx-0 lg:mx-4 mt-6 sm:mt-7 md:mt-9">
      {pageLoading && <LoadingScreen />}


      {/* THE testbook CONTAINER - Changed from Green to Glass Navy/Deep Blue */}
      <div className="relative bg-[#1A3956]/80 backdrop-blur-xl rounded-t-[1.5rem] sm:rounded-t-[2rem] md:rounded-t-[2.5rem] border-t border-x border-white/20 shadow-[0_-15px_60px_-15px_rgba(0,0,0,0.6)] transition-all duration-500">
        {/* PHYSICAL SPIRAL RINGS - Metallic Silver Style */}
        <div className="absolute -top-3 sm:-top-4 left-6 right-6 sm:left-8 sm:right-8 md:left-12 md:right-12 flex justify-between px-4 sm:px-6 md:px-8 pointer-events-none rings-container">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex flex-col items-center ring-item">
              <div className="w-1 h-6 sm:w-1.5 sm:h-7 md:h-8 bg-gradient-to-b from-[#8d9cab] via-[#bac4cc] to-[#8d9cab] rounded-full shadow-lg border-x border-black/20" />
              <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 bg-black/60 rounded-full -mt-1.5 sm:-mt-2 blur-[1px]" />
            </div>
          ))}
        </div>

        {/* LEFT BINDING STRIP - Darker Contrast */}
        <div className="absolute left-0 top-0 bottom-0 w-6 sm:w-8 md:w-10 bg-black/30 rounded-tl-[1.5rem] sm:rounded-tl-[2rem] md:rounded-tl-[2.5rem] border-r border-white/10 pointer-events-none" />

        {/* Inner Padding */}
        <div className="px-2 md:px-10 lg:px-14 pt-8 sm:pt-10 md:pt-12 pb-10 md:pb-8">
          {/* HEADER ROW */}
          <div className="w-full flex max-[340px]:flex-col sm:flex-row justify-between items-center sm:items-center mb-6 sm:mb-7 md:mb-8 gap-4 sm:gap-0 relative z-[10]">
            <div className="relative w-full sm:w-auto" ref={dropdownRef}>
              <div
                className="group cursor-pointer ml-8 flex flex-col items-start max-[340px]:items-center"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#8d9cab] mb-1">
                  Chapter Index
                </span>
                <button className="flex active:scale-95 transition-transform items-center gap-2 sm:gap-2.5 text-left">
                  <span className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[200px] sm:max-w-none">
                    {selectedChapter}
                  </span>
                  <div className="w-5 h-5 rounded-full cursor-pointer bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors flex-shrink-0">
                    <ChevronDown
                      className={`w-3 h-3 text-white transition-transform duration-500 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* DROPDOWN MENU - Matched to Space Theme */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-full sm:w-[280px] md:w-[320px] bg-[#0A1722]/95 border border-white/20 rounded-xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] z-[110] overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in-95 duration-300">
                  <div  className="px-4 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-white/5">
                    <div className="text-[9px] sm:text-[10px] text-white/40 tracking-wide uppercase font-bold">
                      Index
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-[#8d9cab] mt-0.5">
                      {formattedSubject}
                    </div>
                  </div>

                  <div className="max-h-[240px] sm:max-h-[280px] overflow-y-auto custom-scrollbar px-4 sm:px-5 py-2 space-y-0.5 ">
                    <div
                      className="group flex items-center text-xs text-white/70 select-none cursor-pointer hover:text-white transition-colors py-1.5"
                      onClick={() => handleSelect("All Sheets")}
                    >
                      <span
                        className={
                          selectedChapter === "All Sheets"
                            ? "font-bold text-white"
                            : ""
                        }
                      >
                        All sheets
                      </span>
                      <span className="flex-1 mx-2 text-white/5 overflow-hidden">
                        ...................................
                      </span>
                      <span className="text-[10px] text-white/30">all</span>
                    </div>

                    {testbookTopics.map((topic, idx) => (
                      <div
                        key={topic.id}
                        onClick={() => handleSelect(topic.name)}
                        className="group flex items-center text-xs text-white/70 select-none cursor-pointer hover:text-white transition-colors py-1.5"
                      >
                        <span
                          className={`max-w-[70%] sm:max-w-[75%] truncate ${
                            selectedChapter === topic.name
                              ? "font-bold text-white"
                              : ""
                          }`}
                        >
                          {(idx + 1).toString().padStart(2, "0")}. {topic.name}
                        </span>
                        <span className="mx-2 flex-1 overflow-hidden text-white/5">
                          ...............................
                        </span>
                        <span className="text-[10px] text-white/30">
                          {topic.sheets}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-end  max-[340px]:justify-center max-[309px]:item-center">
              <button
                onClick={() => {
                  if (pageLoading) return;
                  setPageLoading(true);
                  setIsOpen(false);
                  router.push("/my-library");
                }}
                className="flex items-center active:scale-95 transition-transform gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 bg-white/5 hover:bg-white/15 border border-white/10 cursor-pointer rounded-lg text-[9px] sm:text-[10px] font-black text-white uppercase tracking-widest "
              >
                All TestBooks
                <ArrowRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </button>
            </div>
          </div>

          {/* MAIN CONTENT AREA */}
          <div
            className={`flex flex-col items-center transition-all duration-700 ease-in-out ${
              isOpen
                ? "blur-lg opacity-20 scale-[0.98] "
                : "blur-0 opacity-100 scale-100"
            }`}
          >
            <div className="relative text-center px-2">
              <h1 className="max-[420px]:text-2xl max-[309px]:text-base max-[309px]:-space-x-1 text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-black tracking-tight text-white leading-none flex flex-row sm:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-5">
                <span>Your</span>
                <span className="relative inline-block">
                  <span className="italic text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
                    {formattedSubject}
                  </span>
                  <svg
                    className="absolute -bottom-1 sm:-bottom-1.5 left-0 w-full"
                    height="5"
                    viewBox="0 0 100 6"
                    fill="none"
                  >
                    <path
                      d="M1 5C20 1 80 1 99 5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      opacity="0.3"
                    />
                  </svg>
                </span>
                <span>Testbook</span>
              </h1>
            </div>

            <div className="mt-4 sm:mt-5 md:mt-6 px-4 sm:px-5 py-1.5 bg-black/30 rounded-full border border-white/10 max-[340px]:hidden">
              <p className="text-[9px] sm:text-[10px] font-bold text-white/60 uppercase tracking-[0.25em] sm:tracking-[0.3em]">
                <span className="text-white">{filteredSessionsCount}</span>{" "}
                {filteredSessionsCount === 1 ? "sheet" : "sheets"} in this
                testbook
              </p>
            </div>
          </div>

          {/* NEW SHEET LINK - Changed from absolute to relative flow */}
          <div
            className={`mt-6 sm:mt-8 md:mt-0 md:absolute md:bottom-6 md:right-10 flex justify-center md:justify-end transition-all duration-700 ${
              isOpen ? "opacity-0" : "opacity-100"
            }`}
          >
            <button
              onClick={() => {
                if (pageLoading) return;
                setPageLoading(true);
                onCreateNew();
              }}
              className="group flex cursor-pointer items-center gap-1.5 sm:gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] active:scale-95 transition-transform sm:tracking-[0.2em] text-white/80 hover:text-white "
            >
              <Plus className="w-2.5 h-2.5 transition-transform" />
              <span>Create new sheet</span>
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default TopBar;
