import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  RefreshCcw,
  Loader2,
  Trash2,
  AlertTriangle,
  ClipboardList,
  Info,
  BookOpen,
  Play,
  Trophy,
  BookMarked,
} from "lucide-react";
import { useState } from "react";
import LoadingScreen from "@/app/LoadingScreen";

interface SubtopicPerformance {
  name: string;
  scored: number;
  total: number;
}

interface LastPracticeMetrics {
  lastScorePercentage: number;
  lastScoreCorrect: number;
  lastScoreTotal: number;
  lastPracticeDate: any;
  historicalSubtopicPerformance: Record<string, SubtopicPerformance>;
}

interface SessionEntry {
  id: string;
  topic: string;
  subject: string;
  isCompleted: boolean;
  totalQuestions: number;
  score: number;
  allAttempts: LastPracticeMetrics[];
  createdAt?: any;
}

interface SessionsDetailSidebarProps {
  selectedTopic: SessionEntry | null;
  onClose: () => void;
   setPageLoading: (value: boolean) => void;
  resetSessionForTraining: (
    sessionToReset: SessionEntry
  ) => Promise<string | null>;
  deleteSession: (sessionId: string) => Promise<boolean>;
}

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
  const SECONDS_IN_DAY = 60 * 60 * 24;
  const diffInDays = Math.floor(diffInSeconds / SECONDS_IN_DAY);


  if (diffInSeconds < 0) {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
    });
  }

  if (diffInDays === 0) {
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 1) return "Just now";
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 1)
      return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  if (diffInDays === 1) return "Yesterday";
  if (diffInDays <= 100) return `${diffInDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
};

const getMedalEmoji = (percentage: number): string | null => {
  if (percentage >= 90) return "🥇";
  if (percentage >= 75) return "🥈";
  if (percentage >= 50) return "🥉";
  return null;
};

const FailTag = () => (
  <span
    className="
      px-3 py-1 text-xs font-bold rounded-full 
      bg-red-600 text-white 
      shadow-md border border-red-800
      tracking-wide
    "
  >
    ❌ FAIL
  </span>
);

const SessionsDetailSidebar = ({
  selectedTopic,
  onClose,
  resetSessionForTraining,
  deleteSession,
  setPageLoading
}: SessionsDetailSidebarProps) => {
  const router = useRouter();
  const [isReAttemptLoading, setIsReAttemptLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    


  if (!selectedTopic) return null;

const handleReAttempt = async () => {
  if (!selectedTopic) return;

  setPageLoading(true);
  setIsReAttemptLoading(true);

  const sessionId = await resetSessionForTraining(selectedTopic);

  if (sessionId) {
    router.push(`/training/${sessionId}`);
  } else {
    alert("Failed to prepare session for a new attempt. Please try again.");
    setIsReAttemptLoading(false);
    setPageLoading(false);
  }
};


  const handleDelete = async () => {
    if (!selectedTopic || isDeleteLoading) return;

    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true);
      return;
    }

    setIsDeleteLoading(true);
    const success = await deleteSession(selectedTopic.id);
    setIsDeleteLoading(false);

    if (success) {
      onClose();
    } else {
      alert("Failed to delete the session. Please try again.");
      setIsConfirmingDelete(false);
    }
  };

  const completedAttempts = selectedTopic.allAttempts.filter(
    (a) => (a.lastScoreTotal || 0) > 0
  );



  const scores = completedAttempts.map((a) =>
    Math.round(((a.lastScoreCorrect || 0) / (a.lastScoreTotal || 1)) * 100)
  );

  const totalAttempts = completedAttempts.length;

  let averageScore = 0;
  let highestScore = 0;
  let lowestScore = 0;
  let lastPracticeDateFormatted = "N/A";

  const createdAtDate: string = formatDate(selectedTopic.createdAt);

  if (totalAttempts > 0) {
    const scoreSum = scores.reduce((sum, score) => sum + score, 0);
    averageScore = Math.round(scoreSum / totalAttempts);
    highestScore = Math.max(...scores);
    lowestScore = Math.min(...scores);

    const latestAttempt = [...selectedTopic.allAttempts].reverse()[0];
    lastPracticeDateFormatted = formatDate(latestAttempt.lastPracticeDate);
  }

  const performanceSummary = {
    avg: `${averageScore}%`,
    best: `${highestScore}%`,
    worst: `${lowestScore}%`,
    lastAttempt: lastPracticeDateFormatted,
  };

  let icon = null;
  let text = "";
  const isAnyLoading = isReAttemptLoading || isDeleteLoading;

  // *** START: MODIFIED LOGIC FOR MAIN ACTION BUTTON TEXT AND ICON ***
  const currentSessionScore = selectedTopic.score; // Score is out of 100
  const isCompleted = selectedTopic.isCompleted;

  if (isReAttemptLoading) {
    icon = <Loader2 className="w-4 h-4 animate-spin" />;
    text = isCompleted ? "Preparing Review..." : "Loading Session...";
  } else if (!isCompleted) {
    icon = <ArrowRight className="w-4 h-4" />;
    text = "Continue Session";
  } else if (isCompleted && currentSessionScore >= 90) {
    // Mastered / A+ category
    icon = <CheckCircle2 className="w-4 h-4" />;
    text = "Mastered (Re-Attempt)";
  } else if (isCompleted && currentSessionScore < 90) {
    // Less than Mastered, offer review/retry
    icon = <RefreshCcw className="w-4 h-4" />;
    text = "Review & Improve";
  }
  // *** END: MODIFIED LOGIC FOR MAIN ACTION BUTTON TEXT AND ICON ***

  const baseClasses = `w-full flex items-center cursor-pointer justify-center gap-2 px-5 py-4 text-sm font-semibold rounded-full transition-all active:scale-95 duration-100 ease-out disabled:opacity-50 disabled:cursor-not-allowed`;
  let dynamicClasses = "";

  if (!selectedTopic.isCompleted) {
    dynamicClasses = "bg-[#004738] text-white hover:bg-[#004738]/90";
  } else if (selectedTopic.score >= 90) {
    // Changed 100 to 90 for 'Mastered' styling
    dynamicClasses = "bg-green-100 text-green-700 hover:bg-green-200";
  } else {
    dynamicClasses = "hover:bg-red-200/50 text-red-600 bg-red-100/50";
  }

  const metadataValueClasses = "font-medium text-sm text-gray-800";

  return (
    <>

      {/* Overlay */}
      <div
        className="fixed inset-0 backdrop-blur-[1px] z-40"
        onClick={onClose}
      />

      {/* SIDEBAR */}
      <div
        className="
          fixed inset-y-0 right-0 w-full max-w-md z-50
          bg-[#FFFFFC]
          flex flex-col
          overflow-hidden
        "
      >
<div className="[@media(min-width:600px)]:hidden sticky top-0 z-50 bg-[#F3F4F6] ">
  <div className="flex items-center justify-between px-4 pt-1">
    <span className="text-sm font-semibold text-gray-700">
      Session Details
    </span>

    <button
      onClick={onClose}
      className="p-2 rounded-full  hover:bg-black/5 active:scale-95 transition"
      aria-label="Close"
    >
      ✕
    </button>
  </div>
</div>


        {/* HEADER */}
        <div
          className="
            flex-shrink-0
            bg-[#F3F4F6]
            px-6 py-3
            flex items-start justify-between
          "
        >
          <div>
            <h2 className="text-lg font-extrabold text-[#2E2E2E]">
              {selectedTopic.topic}
            </h2>
            <p className="text-xs text-[#6B6B6B]">
              Subject · {selectedTopic.subject}
            </p>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-xs text-[#9CA3AF] mt-1">
              {totalAttempts} attempts
            </span>
            {/* START: ADDED CREATED DATE HERE */}
            <p className="text-xs text-[#9CA3AF] mt-1">
              Created: {createdAtDate}
            </p>
            {/* END: ADDED CREATED DATE HERE */}
          </div>
        </div>

        {/* SCROLL AREA */}
        <div className="flex-1 overflow-y-auto px-6 py-6 ">
          <div className="relative min-h-full space-y-6 ">
            <div className="relative z-20 space-y-6">
              {totalAttempts === 0 ? (
                /* EMPTY STATE FOR NO ATTEMPTS */
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-gray-200 rounded-2xl">
                  <div className="bg-gray-50 p-4 rounded-full mb-4">
                    <BookMarked className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    Ready to start?
                  </h3>
                  <p className="text-sm text-gray-500 max-w-[250px] leading-relaxed">
                    You haven't attempted <strong>{selectedTopic.topic}</strong> yet. Start your first session to see your performance here!
                  </p>
                </div>
              ) : (
                /* LIST OF ATTEMPTS */
                [...selectedTopic.allAttempts].reverse().map((attempt, idx) => {
                  const lastScoreCorrect = attempt.lastScoreCorrect || 0;
                  const lastScoreTotal = attempt.lastScoreTotal || 0;
                  const percentage = lastScoreTotal
                    ? Math.round((lastScoreCorrect / lastScoreTotal) * 100)
                    : 0;

                  const medal = getMedalEmoji(percentage);
                  const historicalSubtopicPerformance =
                    attempt.historicalSubtopicPerformance || {};

                  return (
                    <div
                      key={idx}
                      className="
                        relative bg-[#FFFFFC]
                        border-[2px] border-[#E5E7EB]
                        rounded-2xl p-5
                        shadow-[3px_4px_0_rgba(0,0,0,0.18)]
                      "
                      style={{
                        transform:
                          idx % 2 === 0 ? "rotate(-0.5deg)" : "rotate(0.5deg)",
                      }}
                    >
                      <div className="absolute -top-3 -right-3">
                        {percentage < 50 ? (
                          <FailTag />
                        ) : (
                          <span className="text-3xl">{medal}</span>
                        )}
                      </div>

                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-semibold text-[#333]">
                          Attempt {totalAttempts - idx}
                        </span>
                        <span className="text-[#777]">
                          {formatDate(attempt.lastPracticeDate)}
                        </span>
                      </div>

                      <div className="flex justify-between items-center mb-3">
                        <span className="text-2xl font-extrabold text-[#004738]">
                          {lastScoreCorrect}/{lastScoreTotal}
                        </span>
                        <span className="text-xl font-bold text-[#C59B00]">
                          {percentage}%
                        </span>
                      </div>

                      <div className="space-y-1">
                        {Object.values(historicalSubtopicPerformance).map(
                          (sub: SubtopicPerformance) => (
                            <div
                              key={sub.name}
                              className="flex justify-between text-xs text-[#444]"
                            >
                              <span>{sub.name}</span>
                              <span className="font-semibold">
                                {sub.scored}/{sub.total}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* FOOTER — CLEAN & TALLER */}
        <div
          className="
            flex-shrink-0
            px-6 py-6
            bg-[#F9FAFB]
            border-t border-[#E5E7EB]
            flex flex-col justify-center gap-4
          "
        >
          {/* METADATA — CENTERED */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-xs text-[#6B7280]">
            <div className="flex justify-between">
              <span>Avg Score</span>
              <span className="text-[#374151] font-semibold">
                {performanceSummary.avg}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Best Score</span>
              <span className="text-[#374151] font-semibold">
                {performanceSummary.best}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Lowest Score</span>
              <span className="text-[#374151] font-semibold">
                {performanceSummary.worst}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Last attempt</span>
              <span className="text-[#374151] font-semibold">
                {performanceSummary.lastAttempt}
              </span>
            </div>
          </div>

          {/* ACTIONS — LEFT / RIGHT */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReAttempt}
              disabled={isAnyLoading}
              className="
                flex items-center gap-2
                text-sm font-medium
                text-[#004738]
                cursor-pointer
                hover:opacity-80
                disabled:opacity-40
                transition
              "
            >
              {/* *** START: MODIFIED LOGIC FOR FOOTER LEFT BUTTON *** */}
              {selectedTopic.isCompleted && selectedTopic.score < 90 ? (
                <>
                  <RefreshCcw className="w-4 h-4" />
                  Re-attempt
                </>
              ) : selectedTopic.isCompleted && selectedTopic.score >= 90 ? (
                <>
                  <Trophy className="w-4 h-4" />
                  Mastered
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Continue
                </>
              )}
              {/* *** END: MODIFIED LOGIC FOR FOOTER LEFT BUTTON *** */}
            </button>

            <button
              onClick={handleDelete}
              disabled={isAnyLoading}
              className="
                flex items-center gap-2
                text-sm font-medium
                text-[#9CA3AF]
                cursor-pointer
                hover:text-[#8B2E2E]
                disabled:opacity-40
                transition
              "
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionsDetailSidebar;