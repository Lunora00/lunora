// src/pages/TrainingPage.tsx
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth as useSession } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

import QuestionCard from "../components/QuestionCard";
import NavigationControls from "../components/NavigationControls";
import { useQuizState } from "../../hooks/useQuizState";
import { useSessionData } from "../../hooks/useSessionData";
import { GeminiService } from "@/services/geminiService";
import SlideExplanation from "../components/SlideExplanation/SlideExplanation";
import FeynMeter from "../components/FeynMeter";
import { Question, SubtopicPerformance } from "@/types/quiz.types";
import { Result } from "../components/Result";
import { useAllSessions } from "@/app/hooks/useAllSessions";
import SheetSelector from "../components/SheetSelector";
import LoadingScreen from "../../LoadingScreen";

// --- Data Structures & Helper Functions ---
type QuestionStatus = "correct" | "wrong" | "unanswered";
interface ResultBox {
  status: QuestionStatus;
  indexInSubtopic: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// INLINE correctness checker — works for all 6 question types
// No external import needed — lives right here in the page.
// ─────────────────────────────────────────────────────────────────────────────
function resolveIsCorrect(
  question: Question,
  selectedAnswer: string,
  selectedIndex: number
): boolean {
  const qType = (question as any).type || "Multiple Choice";

  switch (qType) {
    case "Multiple Choice":
    case "True/False": {
      // correctAnswer is a number index into options[]
      return selectedIndex === (question.correctAnswer as unknown as number);
    }

    case "Fill in the Blank": {
      // correctAnswer is the exact word/phrase string
      const correct = String((question.correctAnswer as unknown) ?? "")
        .trim()
        .toLowerCase();
      const user = (selectedAnswer ?? "").trim().toLowerCase();
      return user !== "" && user === correct;
    }

    case "Short Answer": {
      // No objective grading — give credit for any meaningful response (>5 chars)
      // The model answer is shown to the user after they submit.
      return (selectedAnswer ?? "").trim().length > 5;
    }

    case "Match the Following": {
      // correctAnswer is number[] — one right-half index per left item
      // selectedAnswer is JSON string like '{"0":2,"1":0,"2":3,"3":1}'
      try {
        const correctMap = question.correctAnswer as unknown as number[];
        const userMap: Record<number, number> = JSON.parse(selectedAnswer || "{}");
        return (
          Array.isArray(correctMap) &&
          correctMap.every((val, idx) => userMap[idx] === val)
        );
      } catch {
        return false;
      }
    }

    case "Sequence": {
      // correctAnswer is number[] representing correct order of indices into options[]
      // selectedAnswer is JSON string like '[2,0,3,1]'
      try {
        const correctOrder = question.correctAnswer as unknown as number[];
        const userOrder: number[] = JSON.parse(selectedAnswer || "[]");
        return (
          Array.isArray(correctOrder) &&
          JSON.stringify(userOrder) === JSON.stringify(correctOrder)
        );
      } catch {
        return false;
      }
    }

    default:
      return selectedIndex === (question.correctAnswer as unknown as number);
  }
}

// ─────────────────────────────────────────────────────────────────────────────

const calculateAllSubtopicResults = (
  questions: Question[]
): Record<string, ResultBox[]> => {
  const allResults: Record<string, ResultBox[]> = {};
  const subtopicCounters: Record<string, number> = {};

  questions.forEach((q) => {
    const subtopic = q.subtopic || "General";
    if (!allResults[subtopic]) allResults[subtopic] = [];
  });

  questions.forEach((q) => {
    const subtopic = q.subtopic || "General";
    if (subtopicCounters[subtopic] === undefined) subtopicCounters[subtopic] = 0;

    let status: QuestionStatus = "unanswered";
    if (q.userAnswerIndex !== undefined && q.userAnswerIndex !== null) {
      // For text-input types userAnswerIndex is stored as -1; use userAnswer string
      const qType = (q as any).type || "Multiple Choice";
      const isTextType =
        qType === "Fill in the Blank" ||
        qType === "Short Answer" ||
        qType === "Match the Following" ||
        qType === "Sequence";

      if (isTextType) {
        status = resolveIsCorrect(q, (q as any).userAnswer ?? "", -1)
          ? "correct"
          : "wrong";
      } else {
        status = q.userAnswerIndex === q.correctAnswer ? "correct" : "wrong";
      }
    }

    allResults[subtopic].push({
      status,
      indexInSubtopic: subtopicCounters[subtopic],
    });
    subtopicCounters[subtopic]++;
  });

  return allResults;
};

// ─────────────────────────────────────────────────────────────────────────────
// TRAINING PAGE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const TrainingPage = () => {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const sessionId = params.id as string;

  const quizState = useQuizState();
  const {
    loading,
    sessionData,
    questions,
    updateQuestions,
    updateSessionData,
    completeSession,
    addExtraQuestionsToSession,
  } = useSessionData(sessionId, session?.user?.id);

  const geminiService = useMemo(() => new GeminiService(), []);

  const [showSlide, setShowSlide] = React.useState(false);
  const [showResult, setShowResult] = React.useState(false);
  const { resetSessionForTraining } = useAllSessions(session?.user?.id);
  const [showSheetSelector, setShowSheetSelector] = useState(false);

  const openSlide = () => setShowSlide(true);
  const closeSlide = () => setShowSlide(false);
  const closeResult = () => setShowResult(false);

  const handleReattempt = async () => {
    if (!sessionData) return;
    try {
      const successId = await resetSessionForTraining({
        ...sessionData,
        id: sessionId,
        topic: sessionData.name || "Untitled",
        questionlist: questions,
      } as any);

      if (successId) {
        closeResult();
        window.location.reload();
      }
    } catch (error) {
      console.error("Reset failed:", error);
    }
  };

  const handleRedirectToMain = () => {
    router.push("/main");
  };

  const [isGeneratingExtra, setIsGeneratingExtra] = useState<string | null>(null);
  const { isPro } = useSubscription();

  const handleAddExtraQuestions = async (subtopicName: string) => {
    if (!sessionData || isGeneratingExtra) return;
    if (!isPro) {
      console.warn("Unauthorized: Pro subscription required to add questions.");
      return;
    }
    setIsGeneratingExtra(subtopicName);
    try {
      const existingTexts = questions
        .filter((q: any) => (q.subtopic || q.topic) === subtopicName)
        .map((q: any) => q.question);

      if (!sessionData.content) {
        console.error("Session content is not available");
        return;
      }

      const newQuestions = await geminiService.generateExtraQuestions(
        subtopicName,
        sessionData.content,
        existingTexts
      );

      if (newQuestions && newQuestions.length > 0) {
        await addExtraQuestionsToSession(newQuestions as any, subtopicName);
      }
    } catch (error) {
      console.error("Failed to add questions:", error);
    } finally {
      setIsGeneratingExtra(null);
    }
  };

  // Computed values
  const index = quizState.state.currentQuestionIndex;
  const currentQuestionData =
    questions && questions.length > 0 && index < questions.length
      ? questions[index]
      : null;

  const currentQuestion = currentQuestionData ? index + 1 : 0;
  const totalQuestions = questions.length;

  const { allSubtopics, subtopicPerformance } = useMemo(() => {
    const subtopicMap = new Map<string, number>();
    const dbPerformance = sessionData?.subtopicPerformance || {};
    const mergedPerformance: Record<string, SubtopicPerformance> = {};

    questions.forEach((q) => {
      const sub = q.subtopic || "General";
      subtopicMap.set(sub, (subtopicMap.get(sub) || 0) + 1);
    });

    const calculatedSubtopics: string[] = [];

    for (const [subtopicName, totalCount] of subtopicMap.entries()) {
      calculatedSubtopics.push(subtopicName);
      const scoredData = dbPerformance[subtopicName] || {
        name: subtopicName,
        scored: 0,
        total: 0,
      };
      mergedPerformance[subtopicName] = { ...scoredData, total: totalCount };
    }

    return {
      allSubtopics: calculatedSubtopics,
      subtopicPerformance: mergedPerformance,
    };
  }, [questions, sessionData?.subtopicPerformance]);

  const allSubtopicDetailedResults = useMemo(() => {
    if (!questions || questions.length === 0) return {};
    return calculateAllSubtopicResults(questions);
  }, [questions]);

  // Auth check
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.push("/signin");
  }, [status, router]);

  // Show result if session already completed
  useEffect(() => {
    if (!loading && sessionData && status === "authenticated") {
      if ((sessionData as any).isCompleted) setShowResult(true);
    }
  }, [loading, sessionData, status]);

  // Restore answer state when navigating between questions
  useEffect(() => {
    if (!currentQuestionData) return;

    const hasAnswered =
      currentQuestionData.userAnswerIndex !== undefined &&
      currentQuestionData.userAnswerIndex !== null;

    if (hasAnswered) {
      const qType = (currentQuestionData as any).type || "Multiple Choice";
      const isTextType =
        qType === "Fill in the Blank" ||
        qType === "Short Answer" ||
        qType === "Match the Following" ||
        qType === "Sequence";

      // For text-input types: restore selectedAnswer from userAnswer string
      const savedAnswer = isTextType
        ? (currentQuestionData as any).userAnswer ?? ""
        : (currentQuestionData as any).userAnswer ||
          currentQuestionData.options[currentQuestionData.userAnswerIndex!];

      const isCorrect = resolveIsCorrect(
        currentQuestionData,
        savedAnswer,
        currentQuestionData.userAnswerIndex!
      );

      if (
        !quizState.state.isAnswered ||
        quizState.state.answer !== savedAnswer
      ) {
        quizState.restoreAnswerState(savedAnswer, isCorrect, currentQuestionData);
      }
    } else {
      if (quizState.state.isAnswered) quizState.resetQuestion();
    }
  }, [
    index,
    currentQuestionData,
    quizState.state.isAnswered,
    quizState.state.answer,
    quizState,
  ]);

  const handleSubtopicJump = (
    subtopicName: string,
    subtopicQuestionIndex: number
  ) => {
    let count = 0;
    let targetQuestionIndex = -1;

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      if ((question.subtopic || "General") === subtopicName) {
        if (count === subtopicQuestionIndex) {
          targetQuestionIndex = i;
          break;
        }
        count++;
      }
    }

    if (targetQuestionIndex !== -1 && targetQuestionIndex !== index) {
      quizState.setQuestionIndex(targetQuestionIndex);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // handleAnswerSelect — correctness logic inlined, no external import
  // ─────────────────────────────────────────────────────────────────────────
  const handleAnswerSelect = async (selectedAnswer: string) => {
    if (quizState.state.isAnswered || !currentQuestionData || !sessionData) {
      console.warn("Attempted to select answer, but question data is missing or already answered.");
      return;
    }

    const qType = (currentQuestionData as any).type || "Multiple Choice";

    // For index-based types, look up the option index.
    // For text-input types (Fill, Short, Match, Sequence) use sentinel -1.
    let selectedIndex = -1;
    if (qType === "Multiple Choice" || qType === "True/False") {
      selectedIndex = currentQuestionData.options.indexOf(selectedAnswer);
    }

    // Resolve correctness inline — no import needed
    const isCorrect = resolveIsCorrect(
      currentQuestionData,
      selectedAnswer,
      selectedIndex
    );

    // 1. Update local quiz UI state
    quizState.setAnswer(selectedAnswer, selectedIndex, isCorrect, currentQuestionData);

    // 2. Compute new progress counters
    const newCompleted = index + 1;
    const newCorrect = quizState.state.correctAnswers + (isCorrect ? 1 : 0);

    // 3. Update the local question list — persist the user's answer string
    const updatedQuestions = questions.map((q, i) => {
      if (i === index) {
        return {
          ...q,
          userAnswer: selectedAnswer,
          userAnswerIndex: selectedIndex,
        } as any;
      }
      return q;
    });

    // 4. Sync to IndexedDB + Firestore
    try {
      await updateSessionData(
        newCompleted,
        newCorrect,
        currentQuestionData,
        isCorrect,
        updatedQuestions
      );
    } catch (error) {
      console.error("Failed to sync session progress to DB:", error);
    }
  };

  const handleNextQuestion = async () => {
    const newIndex = index + 1;
    if (newIndex < questions.length) {
      quizState.setQuestionIndex(newIndex);
    } else {
      await completeSession();
      setShowResult(true);
    }
  };

  const handlePreviousQuestion = () => {
    const newIndex = index - 1;
    if (newIndex >= 0) quizState.setQuestionIndex(newIndex);
  };

  const overallCorrectAnswers = useMemo(() => {
    return questions.reduce((count, q) => {
      if (
        q.userAnswerIndex !== undefined &&
        q.userAnswerIndex !== null &&
        q.userAnswerIndex === q.correctAnswer
      ) {
        return count + 1;
      }
      return count;
    }, 0);
  }, [questions]);

  if ((sessionData as any)?.isCompleted || showResult) {
    return (
      <Result
        isOpen={true}
        onClose={closeResult}
        correctCount={sessionData?.correctAnswers || 0}
        totalCount={questions.length}
        sessionData={
          sessionData
            ? { ...sessionData, userName: session?.user?.name || "Explorer" }
            : null
        }
        onReattempt={handleReattempt}
        onRedirectToMain={handleRedirectToMain}
      />
    );
  }

  if (status === "loading" || loading || !currentQuestionData) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] overflow-hidden">
      {/* Left Side - FeynMeter */}
      <div className="feyn-left w-[50%] flex-col h-full shadow-2xl z-20">
        <FeynMeter
          correctAnswers={overallCorrectAnswers}
          questions={questions}
        />
      </div>

      {/* Right Side - Paper Container */}
      <div className="w-full paper-right lg:w-[50%] h-full flex flex-col relative shadow-2xl overflow-hidden bg-[#FDFDFD]">
        <SlideExplanation
          isOpen={showSlide}
          onClose={closeSlide}
          question={currentQuestionData}
          sessionData={sessionData as any}
          geminiService={geminiService}
        />
        <SheetSelector
          isOpen={showSheetSelector}
          onClose={() => setShowSheetSelector(false)}
          subtopics={allSubtopics}
          allSubtopicDetailedResults={allSubtopicDetailedResults}
          questions={questions}
          currentIndex={index}
          onSubtopicClick={handleSubtopicJump}
          onAddExtra={handleAddExtraQuestions}
          sessionData={sessionData}
          isGeneratingExtra={isGeneratingExtra}
        />

        {/* Notebook binder */}
        <div className="absolute top-0 left-12 bottom-0 w-[1.5px] bg-red-200/50 z-10 hidden sm:block" />
        <div className="absolute top-0 left-2 sm:left-3 md:left-4 bottom-0 flex flex-col justify-around py-4 pointer-events-none z-20">
          {Array.from({ length: 13 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5 sm:h-3.5 sm:w-3.5 rounded-full bg-[#CCDAD7] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)]"
            />
          ))}
        </div>

        <div className="flex-1 flex flex-col relative z-0 min-h-0">
          <div className="absolute left-8 sm:left-8 md:left-12 top-0 bottom-0 w-[1px] bg-stone-200 z-20 pointer-events-none" />

          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <QuestionCard
              question={currentQuestionData}
              currentQuestion={currentQuestion - 1}
              selectedAnswer={quizState.state.answer}
              isAnswered={quizState.state.isAnswered}
              sessionData={sessionData}
              onSelectAnswer={handleAnswerSelect}
              onOpenSlide={openSlide}
              onOpenSheetSelector={() => setShowSheetSelector(true)}
            />
          </div>

          {/* Nav Bar */}
          <div className="pl-4 sm:pl-16 pr-4 sm:pr-8">
            <NavigationControls
              currentQuestion={currentQuestion - 1}
              totalQuestions={totalQuestions}
              isAnswered={quizState.state.isAnswered}
              onPrevious={handlePreviousQuestion}
              onNext={handleNextQuestion}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingPage;