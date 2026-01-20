// WeakTopicTypes.ts

import { Question, SubtopicPerformance } from "@/types/quiz.types";
import * as React from "react";

// --- START: Type Definitions ---
export interface WeakTopic {
  id: string;
  topic: string;
  subject: string;
  medal: "bronze" | "silver" | "gold";
  score: number; // Percentage (e.g., 62)
  attemptsCount: number;
  lastAttempt?: { seconds: number };
  urgency: "critical" | "high" | "medium";
  totalQuestions: number;
}

export interface SessionData {
    id:string;
    userId: string;
    name: string;
    topic: string;
    questionlist: Question[];
    completedQuestions: number;
    correctAnswers: number;
    totalQuestions: number;
    subtopicPerformance: Record<string, SubtopicPerformance>;
    content?: string;
    createdAt: Date;
    updatedAt: Date;
}



export const CircularProgress = ({
  percent,
  color = "#004738",
}: {
  percent: number;
  color?: string;
}) => {
  const radius = 32;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <svg width="80" height="80" className="transform -rotate-90">
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke="#E5E7EB"
        strokeWidth="4"
        fill="none"
      />
      <circle
        cx="40"
        cy="40"
        r={radius}
        stroke={color}
        strokeWidth="4"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  );
};

// Global helper for consistent date formatting
export const formatDate = (timestamp: any): string => {
  if (!timestamp) return "Never";
  const date = new Date(timestamp.seconds * 1000);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

// Global helper for medal info
export const getMedalInfo = (score: number) => {
  if (score >= 90)
    return {
      img: "/gold.png",
      color: "#FFD700",
      medalType: "gold",
    };
  if (score >= 70)
    return {
      img: "/silver.png",
      color: "#C0C0C0",
      medalType: "silver",
    };
  if (score >= 40)
    return {
      img: "/bronze.png",
      color: "#CD7F32",
      medalType: "bronze",
    };
  return { img: "/fail.png", color: "#E53935", medalType: "fail" };
};

// Global helper for medal colors/icons for detail view
export const getMedalColor = (medal: string) => {
  if (medal === "bronze")
    return {
      bg: "bg-amber-100",
      text: "text-amber-700",
      border: "border-amber-300",
      icon: "🥉",
      gradient: "from-amber-400 to-orange-500",
      color: "#CD7F32",
    };
  if (medal === "silver")
    return {
      bg: "bg-slate-200",
      text: "text-slate-700",
      border: "border-slate-400",
      icon: "🥈",
      gradient: "from-slate-300 to-slate-500",
      color: "#C0C0C0",
    };
  return {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    border: "border-yellow-400",
    icon: "🥇",
    gradient: "from-yellow-400 to-yellow-600",
    color: "#FFD700",
  };
};

