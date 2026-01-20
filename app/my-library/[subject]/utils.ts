import React from "react";
import { CheckCircle2, XCircle, Hourglass } from "lucide-react";

export interface GradeDetails {
  grade: string;
  color: string;
  bgColor: string;
  icon: React.ReactElement;
  strokeColor: string;
  gradeText: string;
}

export const formatDate = (timestamp: any, short: boolean = true): string => {
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

  if (short) {
    const diffInSeconds = Math.floor(
      (new Date().getTime() - date.getTime()) / 1000
    );
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "Just now";
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
    if (diffInDays < 7) return `${diffInDays} days ago`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() === new Date().getFullYear() ? undefined : "numeric",
  });
};

export const getGrade = (
  score: number | undefined,
  isCompleted: boolean
): GradeDetails => {
  if (!isCompleted || score === undefined || score === null) {
    return {
      grade: "N/A",
      color: "text-gray-500",
      bgColor: "bg-gray-100",
      icon: React.createElement(Hourglass, { className: "w-5 h-5" }),
      strokeColor: "#9CA3AF",
      gradeText: "...",
    };
  }

  if (score >= 90)
    return {
      grade: "A+",
      color: "text-green-700",
      bgColor: "bg-green-100",
      icon: React.createElement(CheckCircle2, { className: "w-5 h-5" }),
      strokeColor: "#10B981",
      gradeText: "A+",
    };
  if (score >= 80)
    return {
      grade: "A",
      color: "text-blue-700",
      bgColor: "bg-blue-100",
      icon: React.createElement(CheckCircle2, { className: "w-5 h-5" }),
      strokeColor: "#3B82F6",
      gradeText: "A",
    };
  if (score >= 70)
    return {
      grade: "B",
      color: "text-indigo-700",
      bgColor: "bg-indigo-100",
      icon: React.createElement(CheckCircle2, { className: "w-5 h-5" }),
      strokeColor: "#6366F1",
      gradeText: "B",
    };
  if (score >= 60)
    return {
      grade: "C",
      color: "text-yellow-700",
      bgColor: "bg-yellow-100",
      icon: React.createElement(XCircle, { className: "w-5 h-5" }),
      strokeColor: "#F59E0B",
      gradeText: "C",
    };
  if (score >= 50)
    return {
      grade: "D",
      color: "text-orange-700",
      bgColor: "bg-orange-100",
      icon: React.createElement(XCircle, { className: "w-5 h-5" }),
      strokeColor: "#F97316",
      gradeText: "D",
    };
  return {
    grade: "F",
    color: "text-red-700",
    bgColor: "bg-red-100",
    icon: React.createElement(XCircle, { className: "w-5 h-5" }),
    strokeColor: "#EF4444",
    gradeText: "F",
  };
};