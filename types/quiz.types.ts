// types/quiz.types.ts
import { Timestamp } from "firebase/firestore";

export type QuestionType =
  | "mcq"
  | "tf"
  | "fill_blank"
  | "match"
  | "assert_reason"
  | "code"
  | "open";

export interface RubricCriterion {
  key: string;
  max: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  matchPairs?: { left: string; right: string }[];
  correctAnswer?: number | number[] | string | string[];
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard" | string;
  topic?: string;
  estimatedTimeSec?: number;
  hint?: string;
  rubric?: { criteria: RubricCriterion[] };
  testCases?: TestCase[];
  metadata?: Record<string, any>;
}

export interface SessionData {
  id: string;
  userId: string;
  name: string;
  topic: string;

  questionlist: Question[];

  completedQuestions: number;
  correctAnswers: number;
  totalQuestions: number;

  subtopicPerformance: Record<string, SubtopicPerformance>;

  allAttempts?: LastPracticeMetrics[];

  isCompleted?: boolean;
  score?: number;
  lastAttemptedDate?: Date | Timestamp;

  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;

  content?: string;
}

export interface Session {
  id: string;
  userId: string;
  userName: string;
  topic: string;

  questionlist: Question[];

  completedQuestions: number;
  correctAnswers: number;
  totalQuestions: number;

  subtopicPerformance: Record<string, SubtopicPerformance>;

  allAttempts?: LastPracticeMetrics[];

  isCompleted?: boolean;
  score?: number;
  lastAttemptedDate?: Date | Timestamp;

  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;

  content?: string;
}

export interface LastPracticeMetrics {
  lastScorePercentage: number;
  lastScoreCorrect: number;
  lastScoreTotal: number;
  lastPracticeDate: Timestamp | any;
  historicalSubtopicPerformance: Record<string, SubtopicPerformanceEntry>;
}

export interface SubtopicPerformanceEntry {
  name?: string;
  scored?: number;
  total: number;
  correct?: number;
  wrong?: number;
  correctList?: string[];
  wrongList?: string[];
}

export interface QuizState {
  currentQuestionIndex: number;
  selectedAnswerIndex: number | null;
  selectedAnswerValue?: string | string[] | number[];
  isAnswered: boolean;
  isCorrect: boolean;
  correctAnswers: number;
  showHint: boolean;
  showWrongAnswerHelp: boolean;
  wrongAnswerData: any;
  showAllQuestions: boolean;
}

export interface SubtopicPerformance {
  total: number;
  correct?: number;
  wrong?: number;
  correctList?: string[];
  wrongList?: string[];
  scored?: number;
  name?: string;
}

export interface WeakTopic {
  id: string; // Used as key/identifier (subtopic name slug)
  topic: string; // Subtopic name
  subject: string; // Extracted from session name
  medal: "bronze" | "silver" | "gold" | "none";
  score: number; // Percentage score
  attemptsCount: number; // Total questions attempted in this subtopic
  urgency: "critical" | "high" | "medium" | "low";
  lastAttempt: { seconds: number }; // Last updated timestamp
  totalQuestions: number; // Total questions for this subtopic
  correctCount: number; // Scored for this subtopic
}