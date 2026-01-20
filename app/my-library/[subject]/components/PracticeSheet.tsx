"use client";

import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import SessionsDetailSidebar from "../../components/SessionsDetailSidebar";
import TopBar from "./Topbar";
import { PracticeSheetCard } from "./Practicesheetcard";
import LoadingScreen from "@/app/LoadingScreen";

// --- TYPES ---
interface SessionEntry {
  svgTopicTitle: string;
  id: string;
  topic: string;
  subject: string;
  isCompleted: boolean;
  totalQuestions: number;
  score: number;
  allAttempts: any[];
  createdAt: any;
  urgency?: "critical" | "high" | "medium" | "low";
  lastAttempt: any;
  lessonTopic?: string;
  majorSubject?: string;
  medal?: string;
  medalLastDays?: number;
  learningToolUsed?: Record<string, any>;
}

interface PracticeSheetProps {
  subject: string;
  sessions: any[];
  onClose: () => void;
  resetSessionForTraining: (
    sessionToReset: SessionEntry
  ) => Promise<string | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
  deleteSubjectSessions: (subject: string) => Promise<boolean>;
}

// --- STAR GENERATION UTILITY ---
const createStars = (n: number, width: number, height: number) => {
  let stars = "";
  for (let i = 0; i < n; i++) {
    stars += `${Math.random() * width}px ${Math.random() * height}px #FFF${
      i === n - 1 ? "" : ","
    }`;
  }
  return stars;
};

const PracticeSheet: React.FC<PracticeSheetProps> = ({
  subject,
  sessions,
  onClose,
  resetSessionForTraining,
  deleteSession,
  deleteSubjectSessions,
}) => {
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<SessionEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<string>("All Sheets");
  const [showDeleteWarning, setShowDeleteWarning] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
  const [showEmpty, setShowEmpty] = useState(false);

React.useEffect(() => {
  if (sessions !== undefined && sessions !== null) {
    setDataLoaded(true);
  }
}, [sessions]);
React.useEffect(() => {
  if (dataLoaded && sessions.length === 0) {
    const timer = setTimeout(() => {
      setShowEmpty(true);
    }, 1200); // smooth UX delay

    return () => clearTimeout(timer);
  } else {
    setShowEmpty(false);
  }
}, [dataLoaded, sessions]);

  // Generate star shadows once
  const starShadows = useMemo(
    () => ({
      s1: createStars(1700, 2560, 2560),
      s2: createStars(700, 2560, 2560),
      s3: createStars(200, 2560, 2560),
    }),
    []
  );

  const handleCardClick = (topic:any) => {
    setSelectedTopic(topic);
    setTimeout(() => setSidebarVisible(true), 10);
  };

  const handleCreateNewtestbook = useCallback(() => {
    router.push(`/create-new`);
  }, [router]);

  const handleDeletetestbook = useCallback(async () => {
    setShowDeleteWarning(true);
  }, []);

  const testbookTopics = useMemo(() => {
    const topicCounts = sessions.reduce((acc, session) => {
      const topicName = session.topic;
      acc[topicName] = (acc[topicName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(topicCounts).map(([name, sheets], index) => ({
      id: index + 1,
      name: name,
      sheets: sheets,
    }));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (selectedChapter === "All Sheets") return sessions;
    return sessions.filter((s) => s.topic === selectedChapter);
  }, [selectedChapter, sessions]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#020107]">
      {pageLoading && <LoadingScreen />}

 
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#020107] to-[#1A3956]">
        <div className="absolute inset-0">
          <div className="stars" style={{ boxShadow: starShadows.s1 }} />
          <div className="stars1" style={{ boxShadow: starShadows.s2 }} />
          <div className="stars2" style={{ boxShadow: starShadows.s3 }} />
          <div className="shooting-stars" />
        </div>
      </div>

      {/* --- MAIN CONTENT LAYER --- */}
      <div className="relative z-10 h-screen overflow-y-auto custom-scrollbar">
        <TopBar
          selectedChapter={selectedChapter}
          filteredSessionsCount={filteredSessions.length}
          onCreateNew={handleCreateNewtestbook}
          onDeletetestbook={handleDeletetestbook}
          isDeleting={isDeleting}
          showDeleteWarning={showDeleteWarning}
          setShowDeleteWarning={setShowDeleteWarning}
          deleteSubjectSessions={deleteSubjectSessions}
          subject={subject}
          testbookTopics={testbookTopics}
          sessionsLength={sessions.length}
          onClose={onClose}
          sidebarVisible={sidebarVisible}
          setSelectedChapter={setSelectedChapter}
        />

        <div className="max-w-7xl mx-auto">
          <div className="mt-6 mb-10 overflow-hidden">
            <div className="mx-4 max-[766px]:ml-10 pb-8 pt-4">
             {dataLoaded && filteredSessions.length > 0 && (
                <div className="grid max-[292px]:grid-cols-1  grid-cols-2 md:grid-cols-3 lg:grid-cols-4 auto-rows-auto">
                  {filteredSessions.map((topic, index) => (
                    <div key={topic.id} className="min-w-[120px] flex  justify-center items-center">
                      <PracticeSheetCard
                        topic={topic}
                        onClick={handleCardClick}
                        sheetIndex={index}
                      />
                    </div>
                  ))}
                </div>
              )}
              {dataLoaded && filteredSessions.length === 0 && showEmpty && (
                <div className="py-28 flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center mb-6 backdrop-blur-md">
                    <BookOpen className="w-9 h-9 text-white/70" />
                  </div>
                  <p className="text-2xl font-extrabold text-white tracking-tight">
                    {selectedChapter === "All Sheets"
                      ? "No Practice Sheets Yet"
                      : `No Sheets found for "${selectedChapter}"`}
                  </p>
                  {sessions.length === 0 &&
                    selectedChapter === "All Sheets" && (
                      <>
                        <p className="mt-3 max-w-md text-sm text-white/60 leading-relaxed">
                          Start your first practice session for{" "}
                          <span className="font-semibold text-white">
                            {subject}
                          </span>{" "}
                          and begin training your brain.
                        </p>
                        <button
                          onClick={handleCreateNewtestbook}
                          className="mt-8 px-8 py-3 rounded-full bg-white text-[#020107] font-bold text-sm shadow-xl active:scale-95 transition-transform hover:scale-105 "
                        >
                          + Create First Sheet
                        </button>
                      </>
                    )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for Modal */}
      {selectedTopic && (
        <div
          className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${
            sidebarVisible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => {
            setSidebarVisible(false);
            setTimeout(() => setSelectedTopic(null), 300);
          }}
        />
      )}

      {/* Detail Sidebar */}
      {selectedTopic && (
        <div
          className={`fixed top-0 right-0 h-full z-50 w-[100%]  lg:w-[40%] transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${
            sidebarVisible ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <SessionsDetailSidebar
            selectedTopic={selectedTopic}
            onClose={() => {
              setSidebarVisible(false);
              setTimeout(() => setSelectedTopic(null), 300);
            }}
            resetSessionForTraining={resetSessionForTraining}
            deleteSession={deleteSession}
             setPageLoading={setPageLoading}
          />
        </div>
      )}

      {/* --- INJECTED SASS STYLES --- */}
      <style jsx global>{`
        .stars,
        .stars1,
        .stars2 {
          background: transparent;
          position: absolute;
          top: 0;
          left: 0;
        }
        .stars {
          width: 1px;
          height: 1px;
          animation: animStar 100s linear infinite;
        }
        .stars:after {
          content: "";
          position: absolute;
          top: 2560px;
          width: 1px;
          height: 1px;
          box-shadow: inherit;
        }

        .stars1 {
          width: 2px;
          height: 2px;
          animation: animStar 125s linear infinite;
        }
        .stars1:after {
          content: "";
          position: absolute;
          top: 2560px;
          width: 2px;
          height: 2px;
          box-shadow: inherit;
        }

        .stars2 {
          width: 3px;
          height: 3px;
          animation: animStar 175s linear infinite;
        }
        .stars2:after {
          content: "";
          position: absolute;
          top: 2560px;
          width: 3px;
          height: 3px;
          box-shadow: inherit;
        }

        .shooting-stars {
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 2px;
          background: white;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.1),
            0 0 0 8px rgba(255, 255, 255, 0.1), 0 0 20px rgba(255, 255, 255, 1);
          animation: animShootingStar 10s linear infinite;
        }

        @keyframes animStar {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(-2560px);
          }
        }

        @keyframes animShootingStar {
          0% {
            transform: rotate(-45deg) translateX(0) translateY(0);
            opacity: 1;
          }
          70% {
            opacity: 1;
          }
          100% {
            transform: rotate(-45deg) translateX(-2560px) translateY(2560px);
            opacity: 0;
          }
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default PracticeSheet;
