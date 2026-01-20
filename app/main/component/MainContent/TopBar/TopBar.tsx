"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { Flame, History, Star, BookOpen } from "lucide-react";
import { useSubscription } from "@/app/hooks/useSubscription";
import { UpgradeModal } from "./UpgradeModal";
import { ProfileDropdown } from "./ProfileDropdown";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import LoadingScreen from "@/app/LoadingScreen";

interface TopBarHeroProps {
  session: any;
  mascot: string;
  usedSessions: number;
  FREE_SESSION_LIMIT: number;
  userid: string;
  userEmail: string;
  sessions: any[];
  setShowSettingsModal: (show: boolean) => void;
  handleCreateNew: () => void;
  handleSignOut: () => void;
}

const TopBarHero: React.FC<TopBarHeroProps> = ({
  session,
  mascot,
  usedSessions,
  FREE_SESSION_LIMIT,
  userid,
  userEmail,
  sessions,
  setShowSettingsModal,
  handleCreateNew,
  handleSignOut,
}) => {



  const router = useRouter();
  const { isPro } = useSubscription();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [stars, setStars] = useState<any[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const [pageLoading, setPageLoading] = useState(false);
  


  const toggleOpen = () => setIsProfileOpen((prev) => !prev);

  const MASCOTS = {
    normal: { image: "/normal1.png", label: "Rookie" },
    leader: { image: "/leader1.png", label: "Alpha" },
    careless: { image: "/carefree1.png", label: "Rebel" },
    nerds: { image: "/nerds1.png", label: "Scholar" },
    teacherpet: { image: "/teacherpet1.png", label: "Acer" },
    athelete: { image: "/athletes1.png", label: "Champ" },
  };

  const currentMascot = MASCOTS[mascot as keyof typeof MASCOTS] || MASCOTS.normal;

  // Star generation logic (150 stars)
  useEffect(() => {
    const starCount = 150;
    const newStars = Array.from({ length: starCount }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      size: `${Math.random() * 3 + 2}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${5 + Math.random() * 7}s`,
    }));
    setStars(newStars);
  }, []);

  const pathname = usePathname();

useEffect(() => {
  setPageLoading(false);
}, [pathname]);



  // Subscription Params
  const emailParam = `&email=${encodeURIComponent(userEmail)}&external_id=${userid}`;
  const monthlyUrlTest = `https://checkout.dodopayments.com/buy/pdt_0NVGMdYrRLYZVW8zjRUpH?quantity=1${emailParam}&disableEmail=true`;
  const yearlyUrlTest = `https://checkout.dodopayments.com/buy/pdt_0NVOuE093HckAmrSxGL2z?quantity=1${emailParam}&disableEmail=true`;

  // --- Calculations (Streak, Average, Medals) ---
  const streakCount = useMemo(() => {
    if (!sessions || sessions.length === 0) return 0;
    const practiceDates = sessions.map((s) => {
      const date = s.lastAttemptedDate || s.createdAt;
      if (!date) return null;
      const timestamp = date.toDate ? date.toDate() : new Date(date);
      timestamp.setHours(0, 0, 0, 0);
      return timestamp.getTime();
    }).filter((d): d is number => d !== null);
    if (practiceDates.length === 0) return 0;
    const uniqueDates = Array.from(new Set(practiceDates)).sort((a, b) => b - a);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneDayMs = 24 * 60 * 60 * 1000;
    if (Math.floor((today.getTime() - uniqueDates[0]) / oneDayMs) > 1) return 0;
    let streak = 1;
    let expectedPrevDate = uniqueDates[0] - oneDayMs;
    for (let i = 1; i < uniqueDates.length; i++) {
      if (uniqueDates[i] === expectedPrevDate) { streak++; expectedPrevDate -= oneDayMs; }
      else break;
    }
    return streak;
  }, [sessions]);

  const medals = useMemo(() => {
    let gold = 0, silver = 0, bronze = 0, review = 0;
    if (!sessions) return { gold, silver, bronze, review };
    sessions.forEach((s) => {

        const accuracy = (s.correctAnswers / s.totalQuestions) * 100;
        if (accuracy >= 90) gold++;
        else if (accuracy >= 70) silver++;
        else if (accuracy >= 50) bronze++;
        else review++;
    });
    return { gold, silver, bronze, review };
  }, [sessions]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) setIsProfileOpen(false);
    };
    if (isProfileOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileOpen]);

  return (
   <div className="relative w-full overflow-hidden bg-[#020406]">
    {pageLoading && (
      <LoadingScreen />
)}
  {/* ================= HERO SKY AREA ================= */}
  <div className="absolute top-0 left-0 w-full h-[380px] sm:h-[450px] md:h-[520px] lg:h-[600px] overflow-hidden z-0">
    <div className="absolute inset-0 bg-[#131E41]" />
    {/* Nebula Glow Layer */}
    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 20% 30%, rgba(60,120,255,0.25), transparent 45%), radial-gradient(circle at 80% 40%, rgba(120,80,255,0.18), transparent 45%), radial-gradient(circle at 50% 80%, rgba(40,140,255,0.18), transparent 50%)` }} />
    {/* Cloud Texture Layer */}
    <div className="absolute inset-0 opacity-40 mix-blend-screen" style={{ backgroundImage: `radial-gradient(circle at 30% 40%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 70% 60%, rgba(255,255,255,0.06), transparent 45%), radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent 50%)` }} />
    {/* Vignette */}
    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70" />
    {/* Stars Layer */}
    <div className="absolute inset-0 pointer-events-none">
      {stars.map((star) => (
        <div key={star.id} className="absolute bg-white star-breathe" style={{ left: star.left, top: star.top, width: star.size, height: star.size, animationDuration: star.duration, animationDelay: star.delay }} />
      ))}
    </div>
  </div>

  {/* ================= TOPBAR (Navigation) ================= */}
  <header className="relative z-50 px-3 sm:px-5 md:px-7 lg:px-8 pt-3 sm:pt-4 md:pt-5">
    <div className="flex items-center justify-between">
      <div className="relative flex items-center select-none pt-2 sm:pt-4">
            <svg
              viewBox="0 0 100 100"
              className="absolute left-0 rotate-[40deg] w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] md:w-[70px] md:h-[70px] lg:w-[90px] lg:h-[90px]"
            >
              <defs>
                <mask id="lunora-moon">
                  <rect width="100" height="100" fill="white" />
                  <circle cx="56" cy="50" r="40" fill="black" />
                </mask>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="white"
                mask="url(#lunora-moon)"
              />
            </svg>
            <span className="text-white text-[24px] sm:text-[28px] md:text-[32px] lg:text-[40px] font-light tracking-wider pl-5 sm:pl-6 md:pl-7 lg:pl-8 pt-1 sm:pt-2">
              lunora
            </span>
          </div>

      {/* Right Section */}
      <div className="flex items-center gap-3 md:gap-6 lg:gap-8">
        {/* Desktop Stats (Hidden on Mobile) */}
        <div className="desktop-stats-section">
          <div className="flex items-center gap-1.5 lg:gap-2">
            <Flame className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-orange-500" fill="currentColor" style={{ filter: "drop-shadow(0 0 6px rgba(249, 115, 22, 0.5))" }} />
            <div>
              <div className="text-base md:text-lg lg:text-xl font-black text-white leading-none">{streakCount}</div>
              <div className="text-[7px] md:text-[8px] text-white/40 font-bold uppercase tracking-wider">Day Streak</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 lg:gap-2">
            <History className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-cyan-400" style={{ filter: "drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))" }} />
            <div>
              <div className="text-base md:text-lg lg:text-xl font-black text-white leading-none">{sessions?.length || 0}</div>
              <div className="text-[7px] md:text-[8px] text-white/40 font-bold uppercase tracking-wider">Total Sheets</div>
            </div>
          </div>
  <button 
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push("/my-library");
  }}
  className={`flex items-center cursor-pointer gap-1.5 px-3 py-1.5 md:px-4 md:py-2 rounded-full
             bg-white/10 hover:bg-white/20 backdrop-blur-md transition-all
             text-white font-bold text-xs md:text-sm active:scale-95`}
>
  <BookOpen className="w-3.5 h-3.5 md:w-4 md:h-4" />
  My Library
</button>


        </div>

        {/* Profile Dropdown */}
        <ProfileDropdown
          isOpen={isProfileOpen}
          toggleOpen={toggleOpen}
          onSignOut={() => { handleSignOut(); setIsProfileOpen(false); }}
          dropdownRef={profileRef as any}
          currentMascot={currentMascot}
          usedSessions={usedSessions}
          limit={FREE_SESSION_LIMIT}
          isPro={isPro}
          onUpgradeClick={() => { setIsProfileOpen(false); setIsModalOpen(true); }}
          onOpenSettings={() => { setShowSettingsModal(true); setIsProfileOpen(false); }}
        />
      </div>
    </div>
  </header>

  {/* ================= MEDALS SECTION ================= */}
  <div className="relative z-20 px-3 sm:px-5 md:px-7 pt-4 sm:pt-6 md:pt-8 lg:pt-10">
    {/* Desktop: 4 Stars Grid */}
    <div className="medals-grid-desktop mt-8 md:mt-12 lg:mt-16">
      {/* Gold */}
      <div className="flex flex-col items-center p-1.5 md:p-2">
        <div className="relative mb-2 md:mb-3">
          <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-lg md:blur-xl"></div>
          <Star className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 text-yellow-400 fill-yellow-400 relative z-10" />
        </div>
        <div className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-yellow-400">{medals.gold}</div>
        <div className="text-xs md:text-sm font-bold text-yellow-200">Gold Star</div>
        <div className="text-[10px] md:text-xs text-white/50">90%+ Perfect</div>
      </div>
      {/* Silver */}
      <div className="flex flex-col items-center p-1.5 md:p-2">
        <div className="relative mb-2 md:mb-3">
          <div className="absolute inset-0 bg-gray-300/30 rounded-full blur-lg md:blur-xl"></div>
          <Star className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 text-gray-300 fill-gray-300 relative z-10" />
        </div>
        <div className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-100 to-gray-300">{medals.silver}</div>
        <div className="text-xs md:text-sm font-bold text-gray-200">Silver Star</div>
        <div className="text-[10px] md:text-xs text-white/50">70-89%</div>
      </div>
      {/* Bronze */}
      <div className="flex flex-col items-center p-1.5 md:p-2">
        <div className="relative mb-2 md:mb-3">
          <div className="absolute inset-0 bg-orange-700/40 rounded-full blur-lg md:blur-xl"></div>
          <Star className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 text-[#CD7F32] fill-[#CD7F32] relative z-10" />
        </div>
        <div className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#E3AF66] to-[#CD7F32]">{medals.bronze}</div>
        <div className="text-xs md:text-sm font-bold text-[#E3AF66]">Bronze Star</div>
        <div className="text-[10px] md:text-xs text-white/50">50-69%</div>
      </div>
      {/* Review */}
      <div className="flex flex-col items-center p-1.5 md:p-2">
        <div className="relative mb-2 md:mb-3">
          <div className="absolute inset-0 bg-red-600/40 rounded-full blur-lg md:blur-xl"></div>
          <Star className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 xl:w-18 xl:h-18 text-red-500 fill-red-500 relative z-10" />
        </div>
        <div className="text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-200 to-red-400">{medals.review}</div>
        <div className="text-xs md:text-sm font-bold text-red-200">Need Review</div>
        <div className="text-[10px] md:text-xs text-white/50">Below 50%</div>
      </div>
    </div>

    {/* Mobile: 3 Stars + Text Below */}
    <div className="medals-grid-mobile">
      <div className="grid grid-cols-3 mt-3 gap-3 w-full max-w-sm mx-auto">
        {/* Gold */}
        <div className="flex flex-col items-center">
          <div className="relative mb-1.5">
            <div className="absolute inset-0 bg-yellow-400/30 rounded-full blur-md"></div>
            <Star className="w-11 h-11 text-yellow-400 fill-yellow-400 relative z-10" />
          </div>
          <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 to-yellow-400">{medals.gold}</div>
          <div className="text-[11px] font-bold text-yellow-200">Gold Star</div>
          <div className="text-[9px] text-white/50">90%+</div>
        </div>
        {/* Silver */}
        <div className="flex flex-col items-center">
          <div className="relative mb-1.5">
            <div className="absolute inset-0 bg-gray-300/30 rounded-full blur-md"></div>
            <Star className="w-11 h-11 text-gray-300 fill-gray-300 relative z-10" />
          </div>
          <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-100 to-gray-300">{medals.silver}</div>
          <div className="text-[11px] font-bold text-gray-200">Silver Star</div>
          <div className="text-[9px] text-white/50">70-89%</div>
        </div>
        {/* Bronze */}
        <div className="flex flex-col items-center">
          <div className="relative mb-1.5">
            <div className="absolute inset-0 bg-orange-700/40 rounded-full blur-md"></div>
            <Star className="w-11 h-11 text-[#CD7F32] fill-[#CD7F32] relative z-10" />
          </div>
          <div className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#E3AF66] to-[#CD7F32]">{medals.bronze}</div>
          <div className="text-[11px] font-bold text-[#E3AF66]">Bronze Star</div>
          <div className="text-[9px] text-white/50">50-69%</div>
        </div>
      </div>
      {/* Need Review Text Below */}
      <div className="flex items-center justify-center gap-2 mt-3 px-4 py-2.5">
        <span className="text-red-200 font-bold text-xs">Need Review:</span>
        <span className="text-red-400 font-black text-lg">{medals.review}</span>
        <span className="text-white/40 text-[10px]">(Below 50%)</span>
      </div>
    </div>
  </div>

  {/* ================= MOBILE STATS CARDS (Below medals on Mobile) ================= */}
  <div className="mobile-stats-section">
    <div className="flex justify-center gap-4 px-3">
      {/* Streak Card */}
      <div className="flex items-center gap-2.5">
        <Flame className="w-6 h-6 text-orange-500" fill="currentColor" style={{ filter: "drop-shadow(0 0 6px rgba(249, 115, 22, 0.5))" }} />
        <div>
          <div className="text-xl font-black text-white leading-none">{streakCount}</div>
          <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Day Streak</div>
        </div>
      </div>
      {/* Total Sheets Card */}
      <div className="flex items-center gap-2.5">
        <History className="w-6 h-6 text-cyan-400" style={{ filter: "drop-shadow(0 0 6px rgba(34, 211, 238, 0.4))" }} />
        <div>
          <div className="text-xl font-black text-white leading-none">{sessions?.length || 0}</div>
          <div className="text-[8px] text-white/40 font-bold uppercase tracking-wider">Total Sheets</div>
        </div>
      </div>
    </div>
  </div>

  {/* ================= CLOUD CTA PANEL ================= */}
  <div className="relative z-20 mt-15 sm:mt-14 md:mt-20 lg:mt-24">
    {/* Cloud Curve SVG */}
    <div className="absolute top-0 left-0 w-full overflow-hidden leading-[0] -translate-y-[99%]">
      <svg viewBox="0 0 1200 80" preserveAspectRatio="none" className="block w-full h-[50px] sm:h-[60px] md:h-[70px] lg:h-[80px]">
        <path d="M0,40 C150,30 300,20 450,25 C600,30 750,45 900,40 C1050,35 1150,30 1200,28 L1200,80 L0,80 Z" fill="white" />
      </svg>
    </div>

    <div className="bg-white flex flex-col items-center justify-center pt-8 sm:pt-10 pb-16 sm:pb-20">
      <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1f36] tracking-tight text-center px-4">Begin a New Learning Sheet</h2>
      <p className="mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] md:text-xs font-bold text-[#1a1f36]/50 uppercase tracking-[0.2em] sm:tracking-[0.25em] text-center">One focused session. Zero distractions.</p>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mt-7 sm:mt-10">
     <button
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    handleCreateNew();
  }}
  className={`px-10 cursor-pointer sm:px-12 md:px-14 py-3 sm:py-4
             rounded-full bg-[#1F3F5D] text-white font-bold
             text-xs sm:text-sm shadow-2xl
              active:scale-95 transition-all duration-300`}
>
  Create Sheet →
</button>

        {/* Mobile-only Library Button - Fixed for tablet visibility */}
 <button
  onClick={() => {
    if (pageLoading) return;
    setPageLoading(true);
    router.push("/my-library");
  }}
  className="mobile-library-button  active:scale-95 transition-transform"
>
  <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  My Library
</button>


      </div>
    </div>
  </div>

  <UpgradeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} monthlyUrl={monthlyUrlTest} yearlyUrl={yearlyUrlTest} />

  <style jsx>{`
    .star-breathe {
      clip-path: polygon(50% 0%, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0% 50%, 42% 42%);
      animation: breathe infinite ease-in-out;
      filter: blur(0.4px) drop-shadow(0 0 3px rgba(255, 255, 255, 0.9));
    }
    @keyframes breathe {
      0%, 100% { opacity: 0.3; transform: scale(0.8); }
      50% { opacity: 1; transform: scale(1.1); }
    }

    /* Desktop Stats Section - Hidden on Mobile/Tablet */
    @media (max-width: 768px) {
      .desktop-stats-section {
        display: none !important;
      }
    }
    @media (min-width: 769px) {
      .desktop-stats-section {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
    }
    @media (min-width: 1024px) {
      .desktop-stats-section {
        gap: 1.5rem;
      }
    }
    @media (min-width: 1280px) {
      .desktop-stats-section {
        gap: 2rem;
      }
    }

    /* Desktop Medals Grid - Hidden on Mobile */
    @media (max-width: 640px) {
      .medals-grid-desktop {
        display: none !important;
      }
    }
    @media (min-width: 641px) {
      .medals-grid-desktop {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.75rem;
        max-width: 48rem;
        margin: 0 auto;
      }
    }
    @media (min-width: 768px) {
      .medals-grid-desktop {
        gap: 1rem;
      }
    }

    /* Mobile Medals Grid - Hidden on Desktop */
    @media (min-width: 641px) {
      .medals-grid-mobile {
        display: none !important;
      }
    }
    @media (max-width: 640px) {
      .medals-grid-mobile {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
    }

    /* Mobile Stats Section - Hidden on Desktop */
    @media (min-width: 769px) {
      .mobile-stats-section {
        display: none !important;
      }
    }
    @media (max-width: 768px) {
      .mobile-stats-section {
        display: block;
        position: relative;
        z-index: 20;
        padding-top: 1.25rem;
      }
    }

    /* Mobile Library Button - Fixed for all small/medium screens */
    @media (min-width: 769px) {
      .mobile-library-button {
        display: none !important;
      }
    }
    @media (max-width: 768px) {
      .mobile-library-button {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1.75rem;
        border-radius: 9999px;
        background-color: #f3f4f6;
        color: #1F3F5D;
        font-weight: 700;
        font-size: 0.8125rem;
        transition: all 0.3s;
      }
      .mobile-library-button:hover {
        background-color: #e5e7eb;
      }
    }
    @media (min-width: 640px) and (max-width: 768px) {
      .mobile-library-button {
        padding: 0.875rem 2rem;
        font-size: 0.875rem;
      }
    }
  `}</style>
</div>
  );
};

export default TopBarHero;