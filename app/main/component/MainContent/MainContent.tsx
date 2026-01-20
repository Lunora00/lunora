"use client";
import React, { useEffect, useState, useMemo } from "react";
import TopBar from "./TopBar/TopBar";
import RecentSessions from "./RecentSessions";
import { useAllSessions, SessionEntry } from "@/app/hooks/useAllSessions";
import SettingsModal from "../SettingsModal";
import Link from "next/link";
import LoadingScreen from "@/app/LoadingScreen";
import { OptimizedStarList } from "@/app/components/OptimizedStar";
import "@/app/styles/stars.css";

interface SubtopicPerformanceEntry {
  name: string;
  scored: number;
  total: number;
}

interface Session {
  id: string;
  name: string;
  createdAt: any;
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  subject?: string;
  allAttempts?: any;
  subtopicPerformance: Record<string, SubtopicPerformanceEntry>;
}

interface MainContentProps {
  session: any;
  sessions: Session[] | null | undefined;
  handleCreateNew: () => void;
  setShowSettings: (v: boolean) => void;
  router: any;
  mascot: any;
  isFirebaseLoading:any;
  setMascot: any;
  handleChangeMascot: any;
  userid?: string;
  userEmail?: string;
  usedSessions: number;
  FREE_SESSION_LIMIT: number;
  handleSignOut: () => void;
  handleDeleteAccount: () => void;
  handleChangeName: (name: string) => Promise<void>;
  handleDeleteAllSessions: () => Promise<void>;
}

const MainContent: React.FC<MainContentProps> = ({
  session,
  sessions = [],
  handleCreateNew,
  setShowSettings,
  router,
  mascot,
  setMascot,
  handleChangeMascot,
  isFirebaseLoading,
  userid,
  userEmail,
  usedSessions,
  FREE_SESSION_LIMIT,
  handleSignOut,
  handleDeleteAccount,
  handleChangeName,
  handleDeleteAllSessions,
}) => {
  const [stars, setStars] = useState<any[]>([]);
  const [footerStars, setFooterStars] = useState<any[]>([]);
  const [recentSessionStars,setrecentSessionStars] =  useState<any[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);


  useEffect(() => {
    const starCount = 120;
    const newStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 40}%`,
      size: "2px", // Fixed size for performance
      delay: `${Math.random() * 5}s`,
      duration: `${5 + Math.random() * 7}s`,
      animationClass: "star-breathe",
    }));

    setrecentSessionStars(newStars);
  }, []);

  useEffect(() => {
    const starCount = 120;
    const newStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 30}%`,
      size: `${Math.random() * 3 + 2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${5 + Math.random() * 7}s`,
      animationClass: "star-breathe",
    }));

    setFooterStars(newStars);
  }, []);

  useEffect(() => {
    const starCount = 150;
    const newStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${5 + Math.random() * 7}s`,
      animationClass: "star-breathe",
    }));
    setStars(newStars);
  }, []);

  const { resetSessionForTraining } = useAllSessions(userid);

  const handleResetAndRedirect = async (sess: SessionEntry) => {
    const newSessionId = await resetSessionForTraining(sess);
    if (newSessionId) {
      router.push(`/training/${newSessionId}`);
    } else {
      console.error("Failed to reset session.");
    }
  };

 

  return (
    <div className="relative w-full min-h-screen bg-[#020406] scroll-smooth">
      {pageLoading && (
        <LoadingScreen />
)}
        <TopBar
          session={session}
          sessions={sessions || []}
          mascot={mascot}
          usedSessions={usedSessions}
          FREE_SESSION_LIMIT={FREE_SESSION_LIMIT}
          userid={userid || ""}
          userEmail={userEmail || ""}
          setShowSettingsModal={setShowSettingsModal}
          handleCreateNew={handleCreateNew}
          handleSignOut={handleSignOut}
        />
        {showSettingsModal && (
  <SettingsModal
    session={session}
    usedSessions={usedSessions}
    FREE_SESSION_LIMIT={FREE_SESSION_LIMIT}
 setShowSettings={setShowSettingsModal}
     handleSignOut={handleSignOut}
    handleDeleteAccount={handleDeleteAccount}
    handleChangeName={handleChangeName}
    handleDeleteAllSessions={handleDeleteAllSessions}
    isFirebaseLoading={isFirebaseLoading}
    mascot={mascot}
    setMascot={setMascot}
    handleChangeMascot={handleChangeMascot}
    userid={session?.user?.uid}
    sessions={sessions}
  />
)}
    
      {/* 4 + 5. RECENT SESSIONS ON TOP OF FOOTER IMAGE */}
      <div className="relative w-full overflow-hidden">
        {/* RECENT SESSIONS BACKGROUND */}
        {/* Stars Layer */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <OptimizedStarList stars={recentSessionStars} />
        </div>
        <div
          className="relative w-full overflow-hidden"
          style={{
            backgroundImage: "url('/Lunora-Ai-01-09-2026_01_29_PM.png')",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "top center",
            backgroundSize: "cover",
            
          }}
        >
          
          <div
  className="absolute inset-0 pointer-events-none"
  style={{
    background: `
      linear-gradient(
        to bottom,
        rgba(2,4,6,0.15) 0%,
        rgba(2,4,6,0.35) 40%,
        rgba(2,4,6,0.55) 70%,
        rgba(2,4,6,0.85) 100%
      )
    `,
  }}
/>


          {/* RECENT SESSIONS CONTENT */}
          <div className="relative z-20 px-4 sm:px-6 md:px-8 pt-8 sm:pt-10 md:pt-12 pb-12 sm:pb-16 md:pb-20">
            <RecentSessions
              sessions={(sessions as any) || []}
              router={router}
              handleResetAndRedirect={handleResetAndRedirect as any}
            />
          </div>
        </div>
        

          {/* ================= FOOTER SECTION ================= */}
          <div
            className="relative w-full bg-top bg-no-repeat bg-cover"
            style={{
  backgroundImage: "url('/mainfooterbg.png')",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "bottom center",
  backgroundSize: "cover",
}}
          >
            {/* Bottom fade for text readability */}
            <div
              className="absolute inset-0 -bottom-30 pointer-events-none z-[1]"
              style={{
                background: `
        linear-gradient(
          to bottom,
          rgba(0,0,0,0) 25%,
          rgba(0,0,0,0.25) 40%,
          rgba(0,0,0,0.6) 55%,
          rgba(0,0,0,0.35) 70%,
          rgba(0,0,0,0.98) 100%
        )
      `,
              }}
            />

            {/* FOOTER CONTENT */}
            <div className="relative z-10 max-w-7xl mx-auto pt-32 sm:pt-40 md:pt-48 lg:pt-[196px] pr-6 sm:pr-10 md:pr-16 lg:pr-20 pb-6 sm:pb-7 md:pb-8 flex flex-col items-center text-center">
              {/* BRAND */}
              <div className="relative flex items-center select-none">
                <svg
                  viewBox="0 0 100 100"
                  className="absolute left-[-8px] sm:left-[-10px] md:left-[-12px] lg:left-[-14px] rotate-[40deg] w-[70px] h-[70px] sm:w-[90px] sm:h-[90px] md:w-[110px] md:h-[110px] lg:w-[130px] lg:h-[130px]"
                  aria-hidden="true"
                >
                  <defs>
                    <mask id="footer-moon">
                      <rect width="100" height="100" fill="white" />
                      <circle cx="56" cy="50" r="40" fill="black" />
                    </mask>
                  </defs>
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="white"
                    mask="url(#footer-moon)"
                  />
                </svg>

                <span className="text-white text-[40px] sm:text-[50px] md:text-[65px] lg:text-[80px] font-light tracking-wider pt-1 pl-5 sm:pl-6 md:pl-6.5 lg:pl-7">
                  lunora
                </span>
              </div>

    {/* SOCIAL + LEGAL */}
<div className="flex flex-col sm:flex-row items-center pl-0 sm:pl-6 md:pl-8 lg:pl-10 justify-center gap-6 sm:gap-8 md:gap-10 lg:gap-12 text-white/60 text-sm sm:text-base mt-4">


  <div className="flex items-center gap-4 sm:gap-5 md:gap-6 text-sm sm:text-base">
<span
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push("/terms-and-conditions");
  }}
  className="hover:text-white active:scale-95 transition-transform  cursor-pointer"
>
  Terms
</span>

<span
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push("/privacy-policy");
  }}
  className="hover:text-white active:scale-95 transition-transform  cursor-pointer"
>
  Privacy
</span>
  </div>
</div>

{/* COPYRIGHT */}
<p className="pt-4 sm:pt-5 pl-0 sm:pl-6 md:pl-7 lg:pl-9 text-center text-white/40 text-xs sm:text-sm md:text-base">
  © 2024 Lunora. All rights reserved.
</p>
            </div>
          </div>
        </div>
        
    </div>
  );
};

export default MainContent;