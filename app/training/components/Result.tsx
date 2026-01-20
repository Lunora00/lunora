import React, { useEffect, useState } from "react";
import { Session } from "@/types/quiz.types";
import { RotateCw, Home, X, Star } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/app/LoadingScreen";



interface ResultProps {
  isOpen: boolean;
  onClose: () => void;
  correctCount: number;
  totalCount: number;
  sessionData: Session | null;
  onReattempt: () => void;
  onRedirectToMain: () => void;
}

export const Result: React.FC<ResultProps> = ({
  isOpen,
  correctCount,
  totalCount,
  sessionData,
  onReattempt,
}) => {
  const [showScore, setShowScore] = useState(false);
  const [displayPercentage, setDisplayPercentage] = useState(0);

  const percentage = totalCount === 0 ? 0 : (correctCount / totalCount) * 100;
  const userName = sessionData?.userName || "Explorer";
  const router = useRouter();
const [pageLoading, setPageLoading] = useState(false);


const handleExitToDashboard = () => {
  if (pageLoading) return;
  setPageLoading(true);
  router.push("/main");
};


  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShowScore(true), 100);
      
      let start = 0;
      const duration = 1500; 
      const increment = percentage / (duration / 16);
      
      const counter = setInterval(() => {
        start += increment;
        if (start >= percentage) {
          setDisplayPercentage(percentage);
          clearInterval(counter);
        } else {
          setDisplayPercentage(start);
        }
      }, 16);

      return () => {
        clearTimeout(timer);
        clearInterval(counter);
      };
    }
    setShowScore(false);
    setDisplayPercentage(0);
  }, [isOpen, percentage]);

  if (!isOpen) return null;

const getConfig = () => {
  if (percentage >= 90) return {
    bgColor: "#E19E01",
    title: "GOLD STAR",
    subtitle: `Perfect, ${userName}!`,
    glow: "rgba(254, 240, 138, 0.4)", // yellow-200
    iconColor: "#FACC15",            // yellow-400
  };
  if (percentage >= 70) return {
    bgColor: "#4B5563",              // Sightly darker gray for better contrast
    title: "SILVER STAR",
    subtitle: `Great work, ${userName}!`,
    glow: "rgba(243, 244, 246, 0.3)", // gray-100
    iconColor: "#D1D5DB",            // gray-300
  };
  if (percentage >= 50) return {
    bgColor: "#8E4805", 
    title: "BRONZE STAR",
    subtitle: `Solid effort, ${userName}!`,
    glow: "rgba(227, 175, 102, 0.3)", // bronze light
    iconColor: "#CD7F32",            // metallic bronze
  };
  return {
    bgColor: "#B60A06", 
    title: "NEED REVIEW",
    subtitle: `Keep going, ${userName}.`,
    glow: "rgba(248, 113, 113, 0.4)", // red-400
    iconColor: "#EF4444",            // red-500
  };
};

  const config = getConfig();
  const radius = 70; 
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white p-6 transition-colors duration-1000 ease-in-out overflow-hidden"
      style={{ backgroundColor: config.bgColor }}
    >
      {pageLoading && <LoadingScreen />}
      <style>
        {`
          @keyframes pop {
            0% { transform: scale(0); opacity: 0; }
            60% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-pop {
            animation: pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
        `}
      </style>

      {/* Progress Ring & Medal */}
      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-48 h-48 transform -rotate-90 drop-shadow-2xl">
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="96"
            cy="96"
            r={radius}
            stroke="white"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            style={{ 
              strokeDashoffset: showScore ? offset : circumference,
              transition: "stroke-dashoffset 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)" 
            }}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute inset-0 flex items-center justify-center">
       {/* Inside the absolute inset-0 flex items-center justify-center div */}
<div className="relative flex items-center justify-center">
  {/* The Glow Effect */}
  {showScore && (
    <div 
      className="absolute inset-0 rounded-full blur-3xl animate-pulse"
      style={{ backgroundColor: config.glow, transform: 'scale(1.5)' }}
    ></div>
  )}
  
  {/* The Star Icon */}
  <div className="relative z-10 flex items-center justify-center animate-pop">
    <Star 
      size={95} 
      style={{ 
        fill: config.iconColor, 
        color: config.iconColor,
        filter: `drop-shadow(0 0 20px ${config.glow})` 
      }} 
    />
  </div>
</div>
        </div>
      </div>

      {/* Result Text */}
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-[2.25rem] font-black tracking-tight italic uppercase leading-none">
          {config.title}
        </h1>
        <div className="flex items-center justify-center gap-4 py-1">
          <div className="h-[1px] w-10 bg-white/30" />
          <span className="text-2xl font-light tracking-widest tabular-nums">
            {displayPercentage.toFixed(0)}%
          </span>
          <div className="h-[1px] w-10 bg-white/30" />
        </div>
        <p className="text-sm font-medium text-white/85 max-w-[260px] mx-auto leading-relaxed">
          {config.subtitle}
        </p>
      </div>

      {/* Buttons */}
      <div className="flex flex-col w-full max-w-[240px] gap-4">
        <button
  onClick={() => {
      if (pageLoading) return;    
      setPageLoading(true);       
      onReattempt();               
    }}
    disabled={pageLoading}
          className="group flex cursor-pointer items-center justify-center gap-2 py-3.5 bg-white text-[#1B3358] rounded-full font-black text-sm shadow-xl hover:bg-white/95 hover:scale-[1.02] transition-all active:scale-95"
        >
          <RotateCw size={18} className="group-hover:rotate-180 transition-transform duration-700" />
          Re-attempt quiz
        </button>
<button
  onClick={handleExitToDashboard}
  disabled={pageLoading}
  className="
    relative flex items-center justify-center gap-2 py-2 
    text-white/70 font-bold uppercase tracking-widest text-[10px] 
    cursor-pointer transition-all duration-200
    hover:text-white
    active:scale-95
    disabled:opacity-60 disabled:cursor-not-allowed
    focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30
    group
  "
>
  <Home size={14} />
  <span>Exit to Dashboard</span>
  <span className="absolute bottom-0 left-1/2 h-[1px] w-0 bg-white/60 transition-all duration-300 group-hover:w-1/2 group-hover:left-1/4" />
</button>



      </div>

    </div>
  );
};