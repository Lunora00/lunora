import React, { useState } from "react";
import {
  History,
  ArrowRight,
  RotateCcw,
  Trophy,
  Loader2,
  ChevronRight,
  Plus,
} from "lucide-react";
import RealisticMoon from "./RealisticMoon";
import MasterMoon from "./MasterMoon";
import LoadingScreen from "@/app/LoadingScreen";

interface Session {
  id: string;
  topic:string;
  subject?: string;
  lessonTopic: string;
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  createdAt: { toDate: () => Date } | null | undefined;
  isCompleted: boolean;
  allAttempts?: Array<{ lastPracticeDate: any }>;
  subtopicPerformance?: Record<
    string,
    {
      name: string;
      scored: number;
      total: number;
    }
  >;
  questionlist?: Array<{
    subtopic?: string;
    [key: string]: any;
  }>;
}

interface SubtopicData {
  name: string;
  scored: number;
  total: number;
  percentage: number;
}

interface RecentSessionsProps {
  sessions: Session[];
  router: any;
  handleResetAndRedirect: (sess: Session) => Promise<void>;
  handleCreatePractice?: (params: {
    sessionId: string;
    sessionName: string;
    subtopic: string;
  }) => void;
}

const getSubtopicsFromSession = (session: Session): SubtopicData[] => {
  if (!session.subtopicPerformance) return [];
  return Object.values(session.subtopicPerformance).map((subtopic) => {
    const percentage = subtopic.total > 0 ? Math.round((subtopic.scored / subtopic.total) * 100) : 0;
    return { name: subtopic.name, scored: subtopic.scored, total: subtopic.total, percentage };
  });
};

const formatDate = (timestamp: any): string => {
  if (!timestamp) return "N/A";
  let date: Date;
  if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp.seconds && typeof timestamp.seconds === "number") {
    date = new Date(timestamp.seconds * 1000);
  } else {
    date = new Date(timestamp);
  }
  if (isNaN(date.getTime())) return "N/A";

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffInDays = Math.floor(diffInSeconds / 86400);

  if (diffInDays === 0) {
    const diffInMins = Math.floor(diffInSeconds / 60);
    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins}m ago`;
    return `${Math.floor(diffInMins / 60)}h ago`;
  }
  if (diffInDays === 1) return "Yesterday";
  if (diffInDays <= 7) return `${diffInDays}d ago`;
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric", 
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined 
  });
};

const RecentSessions: React.FC<RecentSessionsProps> = ({
  sessions,
  router,
  handleResetAndRedirect,
  handleCreatePractice,
}) => {
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
const [showEmpty, setShowEmpty] = useState(false);

React.useEffect(() => {
  if (sessions !== undefined && sessions !== null) {
    setDataLoaded(true);
  }
}, [sessions]);

React.useEffect(() => {
  if (dataLoaded && sessions && sessions.length === 0) {
    const timer = setTimeout(() => setShowEmpty(true), 1500); // 1.5s delay
    return () => clearTimeout(timer);
  } else {
    setShowEmpty(false);
  }
}, [sessions, dataLoaded]);




  const getActionId = (sessId: string, type: "card" | "reset" | "review" | "subtopic", sub?: string) => 
    `${sessId}_${type}${sub ? `_${sub}` : ""}`;



  const handleNavigation = (path: string) => {
  if (pageLoading) return;
  setPageLoading(true);
  router.push(path);
};

const handleResetAction = async (sess: Session) => {
  if (pageLoading) return;
  setPageLoading(true);

  try {
    await handleResetAndRedirect(sess);
  } catch (e) {
    console.error(e);
    setPageLoading(false);
  }
};


   const sessionIsMastered = (sess: Session): boolean => {
      if (
        sess.completedQuestions !== sess.totalQuestions ||
        sess.totalQuestions === 0
      ) {
        return false;
      }
      const accuracy = (sess.correctAnswers / sess.totalQuestions) * 100;
      return accuracy >= 90;
    };

   const sessionNeedsReattempt = (
      sess: Session & { isCompleted: boolean }
    ): boolean => {
      if (!sess.isCompleted) return false;
      if (sess.completedQuestions === 0) return true;
      const accuracy = (sess.correctAnswers / sess.totalQuestions) * 100;
      return accuracy < 90;
    };

  return (
    <div className="w-full">
      {pageLoading && (
        <LoadingScreen />
)}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white text-lg sm:text-2xl font-semibold flex items-center gap-2">
          <History className="w-5 h-5 sm:w-6 sm:h-6" />
          Recent Sessions
        </h3>
  <button
  onClick={() => sessions?.length > 0 && handleNavigation("/my-library")}
  disabled={sessions?.length === 0}
  className={`flex items-center active:scale-95 transition-transform gap-2 text-xs sm:text-sm ${
    sessions?.length === 0
      ? "opacity-30 cursor-not-allowed pointer-events-none text-white/40"
      : "cursor-pointer text-white/80 hover:text-white"
  }`}
>
  View All
  <ArrowRight className="w-4 h-4" />
</button>

      </div>

      <div className="space-y-3">
        {(sessions ?? []).slice(0, 3).map((sess) => {
          const accuracy = sess.completedQuestions > 0 ? (sess.correctAnswers / sess.totalQuestions) * 100 : 0;
          const isMastered = sessionIsMastered(sess);
          const needsReattempt = sessionNeedsReattempt(sess);
          const isIncomplete = !sess.isCompleted;
          
          const subtopics = getSubtopicsFromSession(sess);
          const latestAttempt = sess.allAttempts?.length ? [...sess.allAttempts].reverse()[0].lastPracticeDate : sess.createdAt;
          
          const cardId = getActionId(sess.id, "card");
          const resetId = getActionId(sess.id, "reset");
          const reviewId = getActionId(sess.id, "review");

          return (
            <div 
              key={sess.id}
              className="group relative  rounded-2xl p-4 sm:p-5  transition-all overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* LEFT: MasterMoon + Metadata */}
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="scale-90 sm:scale-100 flex-shrink-0">
                    <MasterMoon accuracy={accuracy} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-white font-bold text-sm sm:text-base uppercase truncate leading-tight">
                      {sess.topic}
                    </h4>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-white/50 text-[10px] sm:text-xs mt-1.5">
                      {sess.subject && (
                        <>
                          <span  className="font-bold text-white/20 opacity-90">{sess.subject}</span>
                          <span className="text-white/20">•</span>
                        </>
                      )}
                      <span>Last: {formatDate(latestAttempt)}</span>
                      <span className="text-white/20">•</span>
                      <span>Created: {formatDate(sess.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Dynamic Moons + Action Button */}
                <div className="flex items-center justify-between sm:justify-end gap-4 flex-1 min-w-0 border-t border-white/5 pt-3 sm:pt-0 sm:border-0">
                  
                  {/* Dynamic Subtopic Moons Row */}
                  {subtopics.length > 0 && (
                    <div className="flex items-center gap-2 overflow-hidden flex-1 sm:justify-end">
                      <div className="flex items-center -space-x-1 sm:space-x-1 overflow-hidden">
                        {subtopics.map((st) => {
                          const stId = getActionId(sess.id, "subtopic", st.name);
                          return (
                            <div key={st.name} className="scale-[0.7] sm:scale-90 flex-shrink-0 origin-center">
                              <RealisticMoon 
                                subtopic={st} 
                                onClick={(e?: any) => {
                                  if (e) e.stopPropagation();
                                  setActiveActionId(stId);
                                  handleCreatePractice?.({ sessionId: sess.id, sessionName: sess.lessonTopic || sess.topic || "Session", subtopic: st.name });
                                }}
                                isLoading={activeActionId === stId}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Contextual Action Button */}
                  <div className="flex-shrink-0">
                    {isMastered ? (
                      <button 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] sm:text-xs font-bold py-2 px-4 cursor-pointer  rounded-full flex items-center gap-2 transition-all active:scale-95"
                      >
                        {activeActionId === reviewId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />}
                        <span>Mastered</span>
                      </button>
                    ) : needsReattempt ? (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleResetAction(sess); }}
                        className="bg-red-500 cursor-pointer hover:bg-red-600 text-white text-[10px] sm:text-xs font-bold py-2 px-4  rounded-full flex items-center gap-2 transition-all active:scale-95"
                      >
                        {activeActionId === resetId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                        <span>Re-Attempt</span>
                      </button>
                    ) : (
                     <button
  onClick={(e) => {
    e.stopPropagation();
    handleNavigation(`/training/${sess.id}`);
  }}
  className="bg-white/10 hover:bg-white/20 border border-white/10
             text-white cursor-pointer text-[10px] sm:text-xs font-bold
             py-2 px-4 rounded-full flex items-center gap-2
             transition-all active:scale-95"
>
  <ChevronRight className="w-3.5 h-3.5" />
  <span>{isIncomplete ? "Continue" : "Start"}</span>
</button>

                    )}
                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {showEmpty && (
          <div className="flex flex-col items-center py-20 border-2 border-dashed border-white/10 rounded-3xl bg-white/[0.02]">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <Plus className="text-white/40 w-6 h-6" />
            </div>
            <p className="text-white/40 text-sm mb-6">No recent sessions found</p>
            <button
  onClick={() => handleNavigation("/create-new")}
  className="bg-white text-black px-8 py-2.5 rounded-full
             text-sm font-bold cursor-pointer hover:bg-white/90
             transition-all active:scale-95"
>
  Start New Practice
</button>

          </div>
        )}
      </div>
    </div>
  );
};

export default RecentSessions;