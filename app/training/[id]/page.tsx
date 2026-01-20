// src/pages/TrainingPage.tsx - Updated Implementation
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth as useSession } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";

// Import other components and hooks (assuming paths remain the same)
import QuestionCard from "../components/QuestionCard";
import NavigationControls from "../components/NavigationControls";
import { useQuizState } from "../../hooks/useQuizState";
import { useSessionData } from "../../hooks/useSessionData";
import { GeminiService } from "@/services/geminiService";
import  SlideExplanation  from "../components/SlideExplanation/SlideExplanation";
import FeynMeter from "../components/FeynMeter";
import { Question, SubtopicPerformance } from "@/types/quiz.types";
import { Result } from "../components/Result";
import { useAllSessions } from "@/app/hooks/useAllSessions";
import SheetSelector from "../components/SheetSelector";
import LoadingScreen from "../../LoadingScreen"
// --- Data Structures & Helper Functions (Kept in TrainingPage for direct use) ---
type QuestionStatus = "correct" | "wrong" | "unanswered";
interface ResultBox {
  status: QuestionStatus;
  indexInSubtopic: number;
}
// ----------------------------------------

// 💡 HELPER: Calculates detailed status for ALL questions, grouped by subtopic (Kept here as it processes questions array)
const calculateAllSubtopicResults = (
  questions: Question[]
): Record<string, ResultBox[]> => {
  const allResults: Record<string, ResultBox[]> = {};

  const subtopicCounters: Record<string, number> = {};

  questions.forEach((q) => {
    const subtopic = q.subtopic || "General";
    if (!allResults[subtopic]) {
      allResults[subtopic] = [];
    }
  });

  questions.forEach((q) => {
    const subtopic = q.subtopic || "General";

    if (subtopicCounters[subtopic] === undefined) {
      subtopicCounters[subtopic] = 0;
    }

    let status: QuestionStatus = "unanswered";

    if (q.userAnswerIndex !== undefined && q.userAnswerIndex !== null) {
      status = q.userAnswerIndex === q.correctAnswer ? "correct" : "wrong";
    }

    allResults[subtopic].push({
      status,
      indexInSubtopic: subtopicCounters[subtopic],
    });

    subtopicCounters[subtopic]++;
  });

  return allResults;
};

// ----------------------------------------
// 🔥 TRAINING PAGE COMPONENT
// ----------------------------------------

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
      // 1. Reset the session in Firestore
      const successId = await resetSessionForTraining({
        ...sessionData,
        id: sessionId,
        topic: sessionData.name || "Untitled",
        questionlist: questions,
      } as any);

      if (successId) {
        closeResult();
        // 2. Reload page to clear all local hook states (quizState, etc.)
        window.location.reload();
      }
    } catch (error) {
      console.error("Reset failed:", error);
    }
  };

  const handleRedirectToMain = () => {
    router.push("/main");
  };

  // Inside TrainingPage component
  const [isGeneratingExtra, setIsGeneratingExtra] = useState<string | null>(
    null
  );
  const { isPro } = useSubscription();

  const handleAddExtraQuestions = async (subtopicName: string) => {
    // 1. Guard against empty data or simultaneous requests
    if (!sessionData || isGeneratingExtra) return;

    if (!isPro) {
      console.warn("Unauthorized: Pro subscription required to add questions.");
      return;
    }

    setIsGeneratingExtra(subtopicName);

    try {
      // 3. Get existing question texts to avoid duplicates
      const existingTexts = questions
        .filter((q: any) => (q.subtopic || q.topic) === subtopicName)
        .map((q: any) => q.question);

      // 4. Generate new questions via Gemini
      if (!sessionData.content) {
        console.error("Session content is not available");
        return;
      }

      const newQuestions = await geminiService.generateExtraQuestions(
        subtopicName,
        sessionData.content,
        existingTexts
      );

      // 5. Sync to Database + Local State
      if (newQuestions && newQuestions.length > 0) {
        await addExtraQuestionsToSession(newQuestions as any, subtopicName);
      }
    } catch (error) {
      console.error("Failed to add questions:", error);
      // You could optionally set a local error state here to show a toast
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

  // Derived Subtopic List and Performance Totals from Questions
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

      mergedPerformance[subtopicName] = {
        ...scoredData,
        total: totalCount,
      };
    }

    return {
      allSubtopics: calculatedSubtopics,
      subtopicPerformance: mergedPerformance,
    };
  }, [questions, sessionData?.subtopicPerformance]);

  // DERIVATION: Calculate detailed results for ALL subtopics
  const allSubtopicDetailedResults = useMemo(() => {
    if (!questions || questions.length === 0) return {};
    return calculateAllSubtopicResults(questions);
  }, [questions]);

  // FeynMeter props computation
  const currentSubtopicName = currentQuestionData?.subtopic || "General";

  // Authentication check
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // Check for session completion status upon data load & redirect
  useEffect(() => {
    if (!loading && sessionData && status === "authenticated") {
      if ((sessionData as any).isCompleted) {
        setShowResult(true);
      }
    }
  }, [loading, sessionData, status]);

  // Load state when question index changes
  useEffect(() => {
    if (!currentQuestionData) return;

    const hasAnswered =
      currentQuestionData.userAnswerIndex !== undefined &&
      currentQuestionData.userAnswerIndex !== null;
    if (hasAnswered) {
      const isCorrect =
        currentQuestionData.userAnswerIndex ===
        currentQuestionData.correctAnswer;
      const selectedAnswer =
        (currentQuestionData as any).userAnswer ||
        currentQuestionData.options[currentQuestionData.userAnswerIndex!];

      if (
        !quizState.state.isAnswered ||
        quizState.state.answer !== selectedAnswer
      ) {
        quizState.restoreAnswerState(
          selectedAnswer,
          isCorrect,
          currentQuestionData
        );
      }
    } else {
      if (quizState.state.isAnswered) {
        quizState.resetQuestion();
      }
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

  const handleAnswerSelect = async (selectedAnswer: string) => {
    if (quizState.state.isAnswered || !currentQuestionData || !sessionData) {
      console.warn(
        "Attempted to select answer, but question data is missing or already answered."
      );
      return;
    }

    const selectedIndex = currentQuestionData.options.indexOf(selectedAnswer);
    const isCorrect = selectedIndex === currentQuestionData.correctAnswer;

    // 1. Update local quiz state
    quizState.setAnswer(
      selectedAnswer,
      selectedIndex,
      isCorrect,
      currentQuestionData
    );

    // 2. Compute NEW progress counters
    const newCompleted = index + 1;
    const newCorrect = quizState.state.correctAnswers + (isCorrect ? 1 : 0);

    // 3. Update the local question list
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

    // 4. Update DB via the robust function
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
    if (newIndex >= 0) {
      quizState.setQuestionIndex(newIndex);
    }
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

 // Loading & Error State Guards
  if (status === "loading" || loading || !currentQuestionData) {
    return (
      <LoadingScreen />
    );
  }

  if (status === "unauthenticated") {
    return null;

  }

  return (
<div className="flex h-[100dvh] max-h-[100dvh] overflow-hidden">
      {/* 1. Left Side - FeynMeter (HIDDEN ON MOBILE) */}
      <div
        className="feyn-left  w-[50%] flex-col h-full 
     shadow-2xl z-20"
      >
        <FeynMeter
          correctAnswers={overallCorrectAnswers}
          questions={questions}
        />
      </div>

      {/* 2. Right Side - Paper Container (FULL WIDTH ON MOBILE) */}
      <div
        className="
  w-full paper-right lg:w-[50%] h-full
  flex flex-col relative shadow-2xl
  overflow-hidden
  bg-[#FDFDFD]
"
      >
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

        {/* NOTEBOOK BINDER OVERLAYS */}
        <div className="absolute top-0 left-12 bottom-0 w-[1.5px] bg-red-200/50 z-10 hidden sm:block" />

        {/* 3D Binder Holes */}
        <div className="absolute top-0  left-2 sm:left-3 md:left-4 bottom-0 flex flex-col justify-around py-4 pointer-events-none z-20">
          {Array.from({ length: 13 }).map((_, i) => (
            <div
              key={i}
              className="w-3.5 h-3.5  sm:h-3.5 sm:w-3.5 rounded-full bg-[#CCDAD7] shadow-[inset_1px_1px_2px_rgba(0,0,0,0.5)] "
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
