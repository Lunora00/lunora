"use client";
import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  X,
  LogOut,
  Trash2,
  User,
  History,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Crown,
  Zap,
  Shield,
  ChevronRight,
  Fingerprint,
  Loader2,
  HardDrive,
  ArrowUpCircle,
  Send,
  Settings,
  Calendar,
  Award,
} from "lucide-react";
import { useSubscription } from "@/app/hooks/useSubscription";
import { Timestamp } from "firebase/firestore";


const TELEGRAM_USERNAME = "kelvinint";

type PracticeSession = {
  createdAt: Date | Timestamp;
  lastAttemptedDate?: Date | Timestamp;
};

type Session = {
  id: string;
  createdAt: Date | Timestamp;
  lastAttemptedDate?: Date | Timestamp;
  [key: string]: any;
};


const MASCOTS = {
  normal: { image: "/normal1.png", label: "Rookie", requirement: 0 },
  leader: { image: "/leader1.png", label: "Alpha", requirement: 6 },
  careless: { image: "/carefree1.png", label: "Rebel", requirement: 12 },
  nerds: { image: "/nerds1.png", label: "Scholar", requirement: 18 },
  teacherpet: { image: "/teacherpet1.png", label: "Acer", requirement: 30 },
  athelete: { image: "/athletes1.png", label: "Champ", requirement: 40 },
};

interface SettingsModalProps {
  session: any;
  usedSessions: number;
  FREE_SESSION_LIMIT: number;
  setShowSettings: (show: boolean) => void;
  handleSignOut: () => void;
  handleDeleteAccount: () => void;
  handleChangeName: (newName: string) => Promise<void>;
  handleDeleteAllSessions: () => Promise<void>;
  isFirebaseLoading: boolean;
  mascot: string;
  setMascot: (mascot: string) => void;
  handleChangeMascot: (mascot: string) => Promise<void>;
  userid: string;
  sessions: any;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  session,
  usedSessions,
  FREE_SESSION_LIMIT,
  setShowSettings,
  handleSignOut,
  handleDeleteAccount,
  handleChangeName,
  handleDeleteAllSessions,
  isFirebaseLoading,
  mascot,
  setMascot,
  sessions,
  handleChangeMascot,
  userid,
}) => {
  const { isPro, plan, dodoCustomerId, nextBillingDate } = useSubscription();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(session?.user?.name || "");
  const [isNameSaving, setIsNameSaving] = useState(false);
  const [showDeleteSessionsConfirm, setShowDeleteSessionsConfirm] =
    useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] =
    useState(false);
  const [selectedMascot, setSelectedMascot] = useState(mascot || "normal");
  const [isSavingMascot, setIsSavingMascot] = useState(false);

  // Format Creation Date
  const memberSince = useMemo(() => {
    const date = session?.user?.createdAt
      ? new Date(session.user.createdAt)
      : new Date();
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  }, [session?.user?.createdAt]);

  const billingInfo = useMemo(() => {
    if (!nextBillingDate) return { formattedDate: "N/A", daysLeft: null };
const date = (() => {
  const raw = nextBillingDate as any;
  return raw?.toDate ? raw.toDate() : new Date(raw);
})();


    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      formattedDate: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      daysLeft: diffDays > 0 ? diffDays : 0,
    };
  }, [nextBillingDate]);

  useEffect(() => {
    setSelectedMascot(mascot || "normal");
  }, [mascot]);

  const handleNameSave = useCallback(async () => {
    if (newName.trim() === session?.user?.name) {
      setIsEditingName(false);
      return;
    }
    setIsNameSaving(true);
    try {
      await handleChangeName(newName.trim());
      setIsEditingName(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsNameSaving(false);
    }
  }, [newName, session?.user?.name, handleChangeName]);

  const calculateStreak = (sessions: Session[]): number => {
    if (!sessions || sessions.length === 0) return 0;

    const practiceDates = sessions
      .map((s) => {
        const date = (s as any).lastAttemptedDate || s.createdAt;
        if (!date) return null;

        const timestamp = date.toDate ? date.toDate() : new Date(date);
        timestamp.setHours(0, 0, 0, 0);
        return timestamp.getTime();
      })
      .filter((d): d is number => d !== null);

    if (practiceDates.length === 0) return 0;

    const uniqueDates = Array.from(new Set(practiceDates)).sort(
      (a, b) => b - a
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const oneDayMs = 24 * 60 * 60 * 1000;

    const mostRecentDate = uniqueDates[0];
    const daysSinceLastPractice = Math.floor(
      (todayTime - mostRecentDate) / oneDayMs
    );

    if (daysSinceLastPractice > 1) return 0;

    let streak = 1;
    let expectedPrevDate = mostRecentDate - oneDayMs;

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = uniqueDates[i];

      if (currentDate === expectedPrevDate) {
        streak++;
        expectedPrevDate -= oneDayMs;
      } else {
        break;
      }
    }

    return streak;
  };
  const safeSessions = sessions ?? [];
  const userStreak = calculateStreak(safeSessions);

  return (
    <div
      className="fixed inset-0 z-[200] text-white flex flex-col font-sans"
      style={{
        background: "linear-gradient(to bottom, #0D1821 0%, #020406 100%)",
      }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/5 blur-[140px] rounded-full pointer-events-none" />

      {/* Header - Different behavior for mobile vs desktop */}
      <nav className="settings-header">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 rounded-xl md:rounded-2xl flex items-center justify-center border border-white/10">
            <Settings className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </div>
          <div>
            <span className="text-lg md:text-xl font-black tracking-tighter uppercase italic block leading-none">
              Setting
            </span>
            <span className="text-[8px] md:text-[9px] font-bold text-white/20 tracking-[0.2em] md:tracking-[0.3em] uppercase">
              Manage your profile
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowSettings(false)}
          className="w-9 h-9 md:w-10 md:h-10 rounded-full cursor-pointer bg-white/5 flex items-center justify-center hover:bg-white hover:text-black active:scale-95 active:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-all"
        >
          <X className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </nav>

      {/* Main Content Container - Scrollable on mobile, centered on desktop */}
      <div className="settings-content-wrapper">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-start lg:items-center px-4 sm:px-6 md:px-10 py-6 md:py-0 relative z-10">
          {/* Left Side: Identity */}
          <div className="col-span-1 lg:col-span-7 space-y-8 md:space-y-12">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 md:gap-10">
              <div className="relative shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-br from-white/10 to-transparent p-[1px]">
                  <div className="w-full h-full bg-[#0a0c10] rounded-full overflow-hidden flex items-center justify-center border border-white/5 relative">
                    {isSavingMascot && (
                      <div className="absolute inset-0 bg-white backdrop-blur-sm flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 md:w-8 md:h-8 text-orange-500 animate-spin" />
                      </div>
                    )}
                    <img
                      src={MASCOTS[selectedMascot as keyof typeof MASCOTS]?.image}
                      className="w-[75%] h-[75%] object-contain"
                      alt="Avatar"
                    />
                  </div>
                </div>
                {isPro && (
                  <div className="absolute -bottom-1 -right-1 w-10 h-10 md:w-12 md:h-12 bg-orange-500 rounded-full flex items-center justify-center border-4 border-[#020406] shadow-xl">
                    <Crown className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                )}
              </div>

              <div className="space-y-3 md:space-y-4 max-w-full overflow-hidden text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/20">
                    Student Name
                  </span>
                  {isPro && (
                    <span className="text-[8px] md:text-[9px] px-2 py-0.5 bg-orange-500 text-black font-black uppercase italic rounded-sm">
                      Pro
                    </span>
                  )}
                </div>

                {isEditingName ? (
                  <div className="w-full max-w-[300px] sm:max-w-[350px] md:max-w-[400px] mx-auto sm:mx-0">
                    <input
                      value={newName}
                      onChange={(e) => {
                        if (e.target.value.length <= 15) {
                          setNewName(e.target.value);
                        }
                      }}
                      onBlur={handleNameSave}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNameSave();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                      className="bg-transparent text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black border-b-4 border-white outline-none w-full pb-2 uppercase italic tracking-tighter truncate text-center sm:text-left"
                      autoFocus
                    />
                  </div>
                ) : (
                  <h2
                    onClick={() => setIsEditingName(true)}
                    className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black flex flex-col sm:flex-row items-center gap-3 md:gap-4 cursor-pointer group tracking-tighter uppercase italic max-w-full overflow-hidden"
                  >
                    <span className="truncate">{session?.user?.name || "Anonymous"}</span>
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white/5 group-hover:text-white transition-all shrink-0" />
                  </h2>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4">
                  <div className="px-3 py-1 bg-white/5 rounded-md border border-white/5 text-[9px] md:text-[10px] font-mono text-white/40 truncate max-w-[250px] sm:max-w-[200px]">
                    {session?.user?.email}
                  </div>
                  <div className="text-[8px] md:text-[9px] font-bold text-white/20 uppercase whitespace-nowrap">
                    Joined {memberSince}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-white/20 text-center sm:text-left">
                Persona Based On Performance
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-3 md:gap-4">
                {Object.entries(MASCOTS).map(([key, data]) => {
                  const isLocked = userStreak < data.requirement;
                  const isSelected = selectedMascot === key;

                  return (
                    <div key={key} className="flex flex-col items-center gap-2 md:gap-3">
                      <button
                        disabled={isLocked || isSavingMascot}
                        onClick={async () => {
                          setSelectedMascot(key);
                          setIsSavingMascot(true);
                          await handleChangeMascot(key);
                          setMascot(key);
                          setIsSavingMascot(false);
                        }}
                        className={`w-14 h-14 md:w-16 md:h-16 rounded-full transition-all duration-500 flex items-center justify-center relative ${
                          isLocked
                            ? "bg-black/40 cursor-not-allowed border border-white/5"
                            : isSelected
                            ? "bg-white shadow-[0_0_20px_rgba(255,255,255,0.15)] ring-4 ring-white/10"
                            : "bg-white/5 opacity-40 hover:opacity-100 hover:bg-white/10 cursor-pointer"
                        }`}
                      >
                        <img
                          src={data.image}
                          className={`w-9 h-9 md:w-10 md:h-10 object-contain transition-all ${
                            isLocked ? "grayscale blur-[2px] opacity-30" : ""
                          }`}
                          alt={data.label}
                        />

                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Shield className="w-4 h-4 md:w-5 md:h-5 text-white/40" />
                          </div>
                        )}
                      </button>

                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`text-[8px] md:text-[9px] font-black uppercase ${
                            isSelected ? "text-white" : "text-white/20"
                          }`}
                        >
                          {data.label}
                        </span>
                        {isLocked && (
                          <span className="text-[7px] md:text-[7px] font-bold text-orange-500/60 uppercase whitespace-nowrap">
                            {data.requirement} Day Streak
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Side: Action Console */}
          <div className="col-span-1 lg:col-span-5 space-y-6 md:space-y-10">
            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              {!isPro && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-white/20">
                    <Zap className="w-3 h-3" />
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                      Sessions Creation
                    </span>
                  </div>
                  <div className="text-3xl md:text-4xl font-black italic tracking-tighter">
                    {usedSessions}/{FREE_SESSION_LIMIT}
                  </div>
                </div>
              )}

              {isPro && (
                <div className="col-span-2 pt-3 md:pt-5 space-y-2 md:space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-white/30">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">
                        Subscription
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        const customerId = dodoCustomerId;
                        if (customerId) {
                          window.location.href = `/api/portal?customer_id=${customerId}`;
                        } else {
                          alert("Customer ID not found. Please refresh.");
                        }
                      }}
                      className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 bg-white/5 hover:bg-white/10 border active:scale-95 transition-all duration-300 border-white/10 rounded-full cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-white/70" />
                      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight text-white/80">
                        Manage Billing
                      </span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3">
                    <div className="flex flex-col leading-none">
                      <span className="text-[8px] md:text-[9px] uppercase tracking-widest text-white/30 mb-1">
                        Expire On
                      </span>
                      <span className="text-lg md:text-xl font-black italic tracking-tight text-white">
                        {billingInfo.formattedDate}
                      </span>
                    </div>

                    {billingInfo.daysLeft !== null && (
                      <div className="flex items-center gap-2 px-2.5 py-1">
                        <span className="text-[8px] md:text-[9px] font-black uppercase tracking-tight text-gray-500">
                          {billingInfo.daysLeft} Days Left
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Support & Utility */}
            <div className="space-y-3">
              <button
                onClick={() => setShowDeleteSessionsConfirm(true)}
                className="w-full cursor-pointer flex items-center justify-between px-4 md:px-6 py-3 md:py-4 rounded-full  bg-white/5 hover:bg-white/10 border border-white/5 active:scale-[0.98] active:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 transition-all group"
              >
                <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">
                  Wipe Session History
                </span>
                <History className="w-3.5 h-3.5 md:w-4 md:h-4 text-white/20 group-hover:text-white transition-all" />
              </button>

              <button
                onClick={() =>
                  window.open(`https://t.me/${TELEGRAM_USERNAME}`, "_blank")
                }
                className="w-full active:scale-95 transition-transform flex cursor-pointer items-center gap-3 md:gap-4 p-4 md:p-5 bg-[#38A1F3] hover:bg-[#2e8bd3] rounded-2xl md:rounded-3xl shadow-xl shadow-blue-500/10 group"
              >
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/10 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5 md:w-6 md:h-6 text-white" /> 
                </div>
                <div className="text-left">
                  <h4 className="text-sm md:text-base font-black text-white uppercase italic">
                    Need Any Help ?
                  </h4>
                  <p className="text-[8px] md:text-[9px] font-bold text-white/60 uppercase tracking-tighter">
                    Message us on Telegram
                  </p>
                </div>
              </button>
            </div>

            {/* Exit Actions */}
            <div className="pt-4  md:pt-6 space-y-3 md:space-y-4">
              <button
                onClick={() => setShowSignOutConfirm(true)}
                className="w-full py-4 md:py-5 rounded-full bg-white text-black font-black text-[10px] md:text-[11px] tracking-[0.25em] md:tracking-[0.3em] uppercase flex items-center justify-center gap-2 md:gap-3 cursor-pointer hover:bg-white/10 hover:text-white active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 transition-all duration-300 group"
              >
                <span>Sign Out</span>
                <LogOut className="w-3.5 h-3.5 md:w-4 md:h-4 transition-transform group-hover:translate-x-1 group-active:translate-x-0.5" />
              </button>

              <button
                onClick={() => setShowDeleteAccountConfirm(true)}
                className="w-full py-2 text-rose-500/40 cursor-pointer hover:text-rose-500  font-black text-[8px] active:scale-95 transition-transform md:text-[9px] tracking-[0.3em] md:tracking-[0.4em] uppercase flex items-center justify-center gap-2 group"
              >
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Overlays */}
      {(showSignOutConfirm ||
        showDeleteAccountConfirm ||
        showDeleteSessionsConfirm) && (
        <div className="absolute inset-0 z-[210] bg-[#020406]/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 md:p-8 animate-in fade-in duration-500">
          <div className="max-w-sm md:max-w-md w-full text-center space-y-8 md:space-y-12">
            <div className="space-y-4 md:space-y-6">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                {showSignOutConfirm && (
                  <LogOut className="w-7 h-7 md:w-8 md:h-8 text-white" />
                )}
                {showDeleteAccountConfirm && (
                  <Trash2 className="w-7 h-7 md:w-8 md:h-8 text-white" />
                )}
                {showDeleteSessionsConfirm && (
                  <History className="w-7 h-7 md:w-8 md:h-8 text-white" />
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">
                  {showSignOutConfirm && "Sign Out?"}
                  {showDeleteAccountConfirm && "Delete Account?"}
                  {showDeleteSessionsConfirm && "Clear History?"}
                </h3>
                <p className="text-white/40 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.25em] md:tracking-[0.3em] px-4">
                  {showSignOutConfirm &&
                    "You will need to log in again to access your data."}
                  {showDeleteAccountConfirm &&
                    "This action is permanent and cannot be undone."}
                  {showDeleteSessionsConfirm &&
                    "All your past session data will be wiped."}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:gap-4 max-w-[260px] md:max-w-[280px] mx-auto">
              <button
                onClick={() => {
                  if (showSignOutConfirm) handleSignOut();
                  if (showDeleteAccountConfirm) handleDeleteAccount();
                  if (showDeleteSessionsConfirm) {
                    handleDeleteAllSessions();
                    setShowDeleteSessionsConfirm(false);
                  }
                }}
                className={`relative py-4 md:py-5 font-black rounded-full tracking-[0.2em] text-[10px] md:text-[11px] uppercase transition-all duration-150 cursor-pointer overflow-hidden
                  ${
                    isFirebaseLoading
                      ? "bg-white/20 text-white/40 animate-pulse pointer-events-none"
                      : "bg-white text-black hover:bg-neutral-200 active:scale-90 active:bg-neutral-400"
                  }`}
              >
                <span
                  className={isFirebaseLoading ? "opacity-50" : "opacity-100"}
                >
                  {isFirebaseLoading ? "Processing..." : "Confirm Action"}
                </span>
              </button>

              <button
                disabled={isFirebaseLoading}
                onClick={() => {
                  setShowSignOutConfirm(false);
                  setShowDeleteAccountConfirm(false);
                  setShowDeleteSessionsConfirm(false);
                }}
                className="py-2 md:py-3 text-white/30 font-bold text-[9px] md:text-[10px] tracking-[0.2em] uppercase hover:text-white transition-all active:scale-95 cursor-pointer disabled:opacity-0"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* Header styling */
        .settings-header {
          position: sticky;
          top: 0;
          width: 100%;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 50;
          backdrop-filter: blur(24px);
          background: rgba(13, 24, 33, 0.8);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
@media (min-width: 1200px) {
  .settings-header {
    position: absolute;
    backdrop-filter: none;
    background: transparent;
    border-bottom: none;
    padding: 2rem;
  }
}


        /* Content wrapper */
        .settings-content-wrapper {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          display: flex;
          align-items: flex-start;
          justify-content: center;
        }

        @media (min-width: 768px) {
          .settings-content-wrapper {
            overflow-y: visible;
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsModal;