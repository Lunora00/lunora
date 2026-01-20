// types/quiz.types.ts
import { Timestamp } from "firebase/firestore";

export interface Question {
    userAnswerIndex: null;
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation: string;
    difficulty: string;
    topic: string;
    type: string;
    estimatedTime: string;
    analogy: string;
    hint: string;
    subtopic: any;
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
    userAnswer: number | null;
    answer: string;
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
  medal: 'bronze' | 'silver' | 'gold' | 'none';
  score: number; // Percentage score
  attemptsCount: number; // Total questions attempted in this subtopic
  urgency: 'critical' | 'high' | 'medium' | 'low';
  lastAttempt: { seconds: number }; // Last updated timestamp
  totalQuestions: number; // Total questions for this subtopic
  correctCount: number; // Scored for this subtopic
}