import * as React from "react";
import { useState, useMemo, useCallback } from "react";
import { ArrowRight, Zap } from "lucide-react";
import { getGrade } from "../utils";

interface SessionEntry {
  svgTopicTitle: string;
  id: string;
  topic: string;
  subject: string;
  isCompleted: boolean;
  totalQuestions: number;
  score: number;
  allAttempts: any[];
  createdAt?: any;
  urgency?: "critical" | "high" | "medium" | "low";
  lastAttempt: any;
  lessonTopic?: string;
  majorSubject?: string;
  medal?: string;
  medalLastDays?: number;
  learningToolUsed?: Record<string, any>;
}

interface PracticeSheetCardProps {
  topic: SessionEntry;
  onClick: (topic: SessionEntry) => void;
  sheetIndex: number;
}

export const PracticeSheetCard: React.FC<PracticeSheetCardProps> = ({
  topic,
  onClick,
}) => {
  const { grade, strokeColor, gradeText } = getGrade(
    topic.score,
    topic.isCompleted
  );

  const handleClick = useCallback(() => {
    onClick(topic);
  }, [topic, onClick]);

  // --- DYNAMIC TEXT WRAPPING LOGIC (UNCHANGED) ---
  const cardInnerWidth = 34;
  const fontSize = 2.2;
  const textX = 20.5;
  const textY = 19;
  const lineHeight = 2.5;
  const initialDY = -1;
  const estimateCharWidth = fontSize * 0.6;

  const wrapText = useCallback(
    (text: string, maxWidth: number) => {
      const words = text.split(/\s+/).filter(Boolean);
      if (words.length === 0) return [];
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        const potentialLineWidth =
          (currentLine.length + word.length + (currentLine ? 1 : 0)) *
          estimateCharWidth;
        if (currentLine === "" || potentialLineWidth <= maxWidth) {
          currentLine += (currentLine ? " " : "") + word;
        } else {
          lines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) lines.push(currentLine);
      return lines;
    },
    [estimateCharWidth]
  );

  const fullTopicText = `${topic.svgTopicTitle || topic.topic}`;
  const wrappedLines = useMemo(
    () => wrapText(fullTopicText, cardInnerWidth),
    [fullTopicText, cardInnerWidth, wrapText]
  );

  return (
    <div
      onClick={handleClick}
      className="

        cursor-pointer

        transition-transform duration-300

        hover:translate-y-[-2px]

        active:translate-y-[1px]

      "
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        viewBox="-3 -2 38 40"
        className="drop-shadow-sm block"
      >
        <g transform="scale(0.725) translate(0 2)">
          <rect
            x="2.5"
            y="3.5"
            width="36"
            height="48"
            rx="5"
            fill="#000"
            opacity="0.05"
          />

          <rect
            x="2"
            y="2"
            width="36"
            height="48"
            rx="5"
            fill="#FFFFFC"
            stroke="#E5E7EB"
            strokeWidth="0.8"
          />

          <path d="M29 2 L38 11 L29 11 Z" fill="#F3F4F6" />

          <text
            x="20.5"
            y="15"
            textAnchor="middle"
            fontSize="3"
            fontWeight="700"
            letterSpacing="0.6"
            fill="#6B7280"
          >
            TEST SHEET
          </text>

          <text
            x={textX}
            y={textY}
            textAnchor="middle"
            dominantBaseline="hanging"
            fontSize={fontSize}
            fontWeight="700"
            fill="#111827"
          >
            {wrappedLines.map((line, index) => (
              <tspan
                key={index}
                x={textX}
                dy={index === 0 ? initialDY : lineHeight}
              >
                {line}
              </tspan>
            ))}
          </text>

          <g transform="rotate(-18 30 41)">
            <ellipse
              cx="30"
              cy="41"
              rx="5.2"
              ry="4"
              fill="none"
              stroke={strokeColor}
              strokeWidth="0.9"
            />

            <text
              x="30"
              y="42.5"
              textAnchor="middle"
              fontSize="5.2"
              fontWeight="900"
              fill={strokeColor}
            >
              {gradeText}
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
};
