"use client";

import * as React from "react";
import { useMemo } from "react";
import { BookOpen, Library, LucideIcon } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { SessionEntry } from "../../hooks/useAllSessions";
import { getIconForSubject } from "./lib/subject-icons";

// Components
import LoadingScreen from "@/app/LoadingScreen";

const getLucideIconByName = (iconName?: string | null): LucideIcon => {
  if (!iconName) return BookOpen;
  const IconMap = LucideIcons as any;
  return IconMap[iconName] || BookOpen;
};

// --- PROPS INTERFACE ---
interface AllSessionsListProps {
  session: any;
  topics: SessionEntry[];
  loading: boolean;
  status: string;
  setShowSettings: (show: boolean) => void;
  router: any;
  FREE_SESSION_LIMIT: number;
  onFullScreenViewChange?: (isFull: boolean) => void;
}

// --- SUBJECT CARD COMPONENT ---
interface SubjectCardProps {
  subject: string;
  topicCount: number;
  iconName: string;
  onClick: () => void;
}

const SubjectCard: React.FC<SubjectCardProps> = ({
  subject,
  topicCount,
  iconName,
  onClick,
}) => {
  const Icon = getLucideIconByName(iconName);

  const [line1, line2] = useMemo(() => {
    const uppercaseSubject = subject.toUpperCase();
    if (uppercaseSubject.length <= 14) return [uppercaseSubject, null];
    const splitIndex =
      uppercaseSubject.substring(0, 11).lastIndexOf(" ") > 5
        ? uppercaseSubject.substring(0, 11).lastIndexOf(" ")
        : 11;
    return [
      uppercaseSubject.substring(0, splitIndex),
      uppercaseSubject.substring(splitIndex).trim(),
    ];
  }, [subject]);

  return (
    <div className="group relative flex flex-col items-center">
      <div
        className="relative w-48 sm:w-56 md:w-60 cursor-pointer transform hover:scale-[1.05] hover:-translate-y-2 transition-all duration-500 ease-out"
        onClick={onClick}
      >
        {/* Dynamic Shadow */}
        <div className="absolute inset-0 bg-black/40 translate-x-2 translate-y-3 blur-md rounded-lg group-hover:translate-y-6 group-hover:blur-xl transition-all" />

        <svg viewBox="0 0 128 128" className="w-full h-auto drop-shadow-lg">
          {/* Back Cover / Depth */}
          <path
            fill="#0A1722"
            d="M106.02 121.68H36.18c-1.66 0-1.26-1.35-1.26-3.01V14.05c0-1.66 1.35-3.01 3.01-3.01h69.36c2.72 0 4.93 2.21 4.93 4.93v99.76c0 3.86-1.83 5.95-6.2 5.95"
          />

          {/* Bottom Pages Edge */}
          <path
            fill="#E8EBEE"
            d="M18.53 115.14c0 1.94 3.07 3.57 5.01 3.57l80.39-.05c2.98 0 4.54-1.58 4.54-3.52l-.25-21.32H18.53z"
          />

          {/* Right Side Pages Edge */}
          <path
            fill="#E8EBEE"
            d="M101.47 105.88s-2.13 5.85.03 8.78c2.51 3.4 6.89 2.58 6.89.99V16.44c0-.66-.61-1.14-1.25-1c-1.39.3-3.89.31-7.21-1.89z"
          />

          {/* Main Cover Body */}
          <path
            fill="#0a1722"
            d="M94.16 110.85H23.64V6.45h72.25c2.27 0 3.87.61 4.62 1.62c.98 1.31 1.5 3.3 1.5 5.48V103a7.85 7.85 0 0 1-7.85 7.85"
          />

          {/* Cover Front Panel (Slightly Lighter for Depth) */}
          <path
            fill="#314d67"
            d="M92.01 107.78H25.54c-2.76 0-4.99-2.24-4.99-4.99V11.45c0-2.76 2.24-4.99 4.99-4.99h66.47c3.82 0 6.92 2.18 6.92 6.92v87.49c-.01 3.81-3.1 6.91-6.92 6.91"
          />

          {/* Spine Decoration */}
          <path
            fill="#13202B"
            d="M34.43 109.75L34.38 6.46h-11.2s-2.31-.4-3.85 0c-2.79.73-3.56 2.76-3.56 6.07v94.41c0 6.7.41 9.6 2.44 11.72c-.12-1.54.87-6.83 1.68-8.28c.72-1.28 14.54-.63 14.54-.63"
          />

          {/* Detail Lines & Enhanced Bottom/Left Curves */}
          {/* Vertical Spine Line */}
          <path
            fill="none"
            stroke="#000000"
            strokeWidth="2"
            d="M23.18 6.45v104.4"
            opacity="0.6"
          />

          {/* Bottom Spine Curve - Now thicker and lighter to match page edges */}
          <path
            fill="none"
            stroke="#0A1722"
            strokeWidth="3"
            d="m34.38 109.34l-11.3.22c-3.77 0-5.06 4.04-4.39 6.71c.84 3.37 4.32 3.92 5.18 3.92h12.65"
          />

          {/* Top Label */}
          <text
            x="66"
            y="20"
            textAnchor="middle"
            fill="#8d9cab"
            fontSize="5"
            fontWeight="600"
            letterSpacing="2"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            TESTBOOK
          </text>

          {/* Center Icon Circle */}
          <circle
            cx="64"
            cy="42"
            r="14"
            fill="#bac4cc"
            className="group-hover:fill-white transition-colors duration-300"
          />
        </svg>

        {/* Content Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Icon
            size={22}
            className="absolute text-[#0a1722] transition-all duration-300"
            style={{
              top: "33%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
          <div
            className="absolute text-center text-white text-[11px] font-black tracking-widest leading-tight"
            style={{ top: "55%" }}
          >
            {line1.toUpperCase()}
          </div>
          {line2 && (
            <div
              className="absolute text-center text-white text-[11px] font-black tracking-widest leading-tight"
              style={{ top: "63%" }}
            >
              {line2.toUpperCase()}
            </div>
          )}
          <div
            className="absolute text-center text-[#8d9cab] text-[10px] font-bold"
            style={{ top: line2 ? "73%" : "67%" }}
          >
            {topicCount} SHEETS
          </div>
        </div>
      </div>
    </div>
  );
};

// --- PRIMARY COMPONENT ---
const AllSessionsList: React.FC<AllSessionsListProps> = ({
  session,
  topics,
  loading,
  status,
  setShowSettings,
  router,
  FREE_SESSION_LIMIT,
}) => {
const groupedTopics = useMemo(() => {
  if (!Array.isArray(topics)) return {}; 
  return topics.reduce((acc, topic) => {
    const subject = topic.subject || "Uncategorized";
    if (!acc[subject]) acc[subject] = [];
    acc[subject].push(topic);
    return acc;
  }, {} as Record<string, SessionEntry[]>);
}, [topics]);

  

  const subjectKeys = Object.keys(groupedTopics).sort();
 const [pageLoading, setPageLoading] = React.useState(false);
const [showEmpty, setShowEmpty] = React.useState(false);
const [dataLoaded, setDataLoaded] = React.useState(false); 


React.useEffect(() => {
  if (!loading && topics !== undefined && topics !== null) {
    setDataLoaded(true);
  }
}, [loading, topics]);

// Delay empty state only after data is loaded and topics are truly empty
React.useEffect(() => {
  if (dataLoaded && topics && topics.length === 0) {
    const timer = setTimeout(() => setShowEmpty(true), 500);
    return () => clearTimeout(timer);
  } else {
    setShowEmpty(false);
  }
}, [topics, dataLoaded]);

const handleNavigation = (path: string) => {
  if (pageLoading) return; // prevent double clicks
  setPageLoading(true); // show loader
  router.push(path);
};


  return (
    <div className="flex h-screen overflow-hidden relative">
      {pageLoading && <LoadingScreen />}
      <div className="fixed inset-0 z-0" />
      {/* SUBTLE NOISE / GRADIENT LAYER */}
     <div className="pointer-events-none absolute inset-0 overflow-hidden">
  {/* Gradient layer */}
  <div className="absolute inset-0 bg-gradient-to-b from-[#1A3956] via-[#13202B] to-[#0A1722] opacity-90" />
</div>


      <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 lg:p-14 relative z-10">
        {/* HERO HEADER */}
        <header className="mb-10 sm:mb-12 md:mb-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.05]">
              My Library
            </h1>
            <p className="mt-2 sm:mt-3 text-sm sm:text-base text-white/60 font-medium">
              From first attempt to improvement — all in one place.
            </p>
          </div>

          {/* Top Right Navigation Buttons */}
          <div className="flex mt-5 [@media(max-width:314px)]:flex-col items-center gap-2 sm:gap-3 md:gap-4 w-full md:w-auto">
            <button
              onClick={() => handleNavigation("/main")}
              className={`
      flex-1 md:flex-none px-5 md:px-6 py-2.5 sm:py-3 rounded-full
      font-bold text-xs sm:text-sm cursor-pointer backdrop-blur-md transition-transform
      bg-white/30 text-white scale-[1.03]
      flex items-center justify-center gap-2
      hover:scale-[1.05] hover:bg-white/40 active:scale-95
      [@media(max-width:314px)]:w-full
    `}
            >
              <LucideIcons.Home
                size={16}
                className="sm:w-[18px] sm:h-[18px]"
                strokeWidth={3}
              />
              Main Page
            </button>

            <button
              onClick={() => handleNavigation("/create-new")}
              className={`flex-1 md:flex-none px-5 md:px-6 py-2.5 sm:py-3 rounded-full bg-white text-[#1A3956]
    hover:bg-white/90 active:scale-95
    font-black text-xs sm:text-sm cursor-pointer
    shadow-xl shadow-black/20
    transition-all flex items-center justify-center gap-2
    [@media(max-width:314px)]:w-full
    `}
            >
              <LucideIcons.Plus
                size={16}
                className="sm:w-[18px] sm:h-[18px]"
                strokeWidth={3}
              />
              Create New
            </button>
          </div>
        </header>

        {/* GRID */}
        <section>
          <div className="grid xs-grid-1 grid-cols-2  md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 gap-x-6 gap-y-12 sm:gap-x-8 sm:gap-y-14 md:gap-x-10 md:gap-y-16 lg:gap-x-14 lg:gap-y-20">
            {subjectKeys.map((subject) => (
              <SubjectCard
                key={subject}
                subject={subject}
                topicCount={groupedTopics[subject].length}
                iconName={getIconForSubject(
                  groupedTopics[subject][0]?.majorSubject || subject
                )}
                  onClick={() => handleNavigation(`/my-library/${encodeURIComponent(subject)}`)}
              />
            ))}


            {showEmpty && (
              <div
                className={`col-span-full pt-10 sm:pt-14 md:pt-16 flex flex-col items-center justify-center text-center`}
              >
                {/* Animated Loading Circle */}
                <div className="mb-8 sm:mb-10 md:mb-12">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32">
                    {/* Inner circle */}
                    <div className="absolute inset-3 sm:inset-4 rounded-full border border-white/10" />
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Library size={32} className="text-white/40 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                    </div>
                  </div>
                </div>

                <p className="text-white/70 font-bold text-sm sm:text-base md:text-lg mb-3">No Testbook Yet</p>
                <p className="text-white/50 font-medium text-xs sm:text-sm mb-8 max-w-sm">
                  Create your first testbook to start studying
                </p>

               <button
  onClick={() => handleNavigation("/create-new")}
  className={`px-8 sm:px-10 md:px-12 py-3 sm:py-3.5 md:py-4 rounded-full
    bg-white text-[#1A3956]
    font-black text-xs sm:text-sm tracking-wide
    hover:bg-white/90 hover:shadow-xl hover:shadow-black/20 hover:scale-105
    active:scale-95 transition-all cursor-pointer
    flex items-center gap-2 sm:gap-3`}
>
  <LucideIcons.Plus
    size={16}
    className="sm:w-[18px] sm:h-[18px] md:w-5 md:h-5"
    strokeWidth={3}
  />
  Create First Testbook
</button>

              </div>
            )}
          </div>
        </section>
      </main>

      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(0, 71, 56, 0.15);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 71, 56, 0.25);
        }
      `}</style>
    </div>
  );
};

export default AllSessionsList;
