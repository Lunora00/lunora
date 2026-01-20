import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  SessionData, 
  Question, 
  SubtopicPerformance, 
  LastPracticeMetrics 
} from "@/types/quiz.types";
import { feynDB } from "@/lib/indexdb/sessionCache";

export const useSessionData = (sessionId: string, userId?: string) => {
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const router = useRouter();

  // 1. Initial Data Fetching from IndexedDB
  useEffect(() => {
    const fetchSession = async () => {
      
      
      if (!sessionId) return;
      try {
        const localSession = await feynDB.sessions.get(sessionId);

        if (!localSession) {
          router.push("/");
          return;
        }

        const session = localSession.data || localSession;
        const ownerId = localSession.userId || session.userId;

        if (userId && ownerId !== userId) {
          alert("You do not have access to this session");
          router.push("/");
          return;
        }

        setSessionData(session);
        setQuestions(session.questionlist || []);
      } catch (error) {
        console.error("Error loading session from IndexedDB:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchSession();
    } else if (sessionId) {
      setLoading(false);
    }
  }, [sessionId, userId, router]);

  // 2. Helper to calculate subtopic totals accurately
  const calculateUpdatedPerformance = (
    subtopic: string,
    isCorrect: boolean,
    currentPerformance: Record<string, SubtopicPerformance>,
    allQuestions: Question[]
  ) => {
    const updatedPerformance = { ...currentPerformance };
    const subtopicKey = subtopic || "General";

    const existing = updatedPerformance[subtopicKey] || {
      name: subtopicKey,
      scored: 0,
      total: 0,
    };

    if (isCorrect) {
      existing.scored += 1;
    }

    // Recalculate total for this subtopic from the array to keep FeynMeter in sync
    existing.total = allQuestions.filter(
      (q) => (q.subtopic || "General") === subtopicKey
    ).length;

    updatedPerformance[subtopicKey] = existing;
    return updatedPerformance;
  };

  // 3. Update Session Data (FIXED PARAMETERS)
  const updateSessionData = async (
    completedQuestions: number, 
    correctAnswers: number,    
    currentQuestion: Question,
    isCorrect: boolean,
    updatedQuestions: Question[]
  ) => {
    if (!sessionData || !userId) return;

    const subtopicKey = currentQuestion.subtopic || "General";
    
    const newSubtopicPerformance = calculateUpdatedPerformance(
      subtopicKey,
      isCorrect,
      sessionData.subtopicPerformance || {},
      updatedQuestions 
    );

    const updatedSession: SessionData = {
      ...sessionData,
      completedQuestions: completedQuestions, 
      correctAnswers: correctAnswers,         
      questionlist: updatedQuestions,
      subtopicPerformance: newSubtopicPerformance,
      updatedAt: new Date(),
    };

    // Sync state
    setSessionData(updatedSession);
    setQuestions(updatedQuestions);

    // Sync IndexedDB
    try {
      await feynDB.sessions.put({
        id: sessionId,
        userId: userId,
        data: updatedSession,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to sync to IndexedDB:", error);
    }
  };

  // 4. Final Finalize Session (Sync to Firestore)
  const completeSession = async () => {
    if (!sessionData || !userId) return;

    try {
      const docRef = doc(db, "sessions", sessionId);
      const now = new Date();

      const totalQuestions = questions.length;
      const completedCount = sessionData.completedQuestions || 0;
      const correctCount = sessionData.correctAnswers || 0;

      const finalScorePercentage =
        completedCount > 0
          ? Math.round((correctCount / totalQuestions) * 100)
          : 0;

      const thisAttempt: LastPracticeMetrics = {
        lastScorePercentage: finalScorePercentage,
        lastScoreCorrect: correctCount,
        lastScoreTotal: totalQuestions,
        lastPracticeDate: now,
        historicalSubtopicPerformance: sessionData.subtopicPerformance || {},
      };

      const updatedAllAttempts = [...(sessionData.allAttempts || []), thisAttempt];

      // PUSH EVERYTHING TO FIRESTORE
      await updateDoc(docRef, {
        isCompleted: true,
        lastAttemptedDate: now,
        updatedAt: now,
        allAttempts: updatedAllAttempts,
        score: finalScorePercentage,
        completedQuestions: completedCount,
        correctAnswers: correctCount,
        subtopicPerformance: sessionData.subtopicPerformance || {},
        questionlist: questions,
      });

      const finalLocalData: SessionData = {
        ...sessionData,
        isCompleted: true,
        lastAttemptedDate: now,
        allAttempts: updatedAllAttempts,
        score: finalScorePercentage,
        updatedAt: now,
      };

      setSessionData(finalLocalData);

      await feynDB.sessions.put({
        id: sessionId,
        userId: userId,
        data: finalLocalData,
        updatedAt: Date.now(),
      });

      return true;
    } catch (error) {
      console.error("Error finalizing session in Firestore:", error);
      throw error;
    }
  };

  // 5. Update Questions (Sub-quizzes)
  const updateQuestions = async (newQuestions: Question[]) => {
    if (!sessionData || !userId) return;

    const updatedSession: SessionData = {
      ...sessionData,
      questionlist: newQuestions,
      totalQuestions: newQuestions.length,
      updatedAt: new Date(),
    };

    setQuestions(newQuestions);
    setSessionData(updatedSession);

    try {
      await feynDB.sessions.put({
        id: sessionId,
        userId: userId,
        data: updatedSession,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to update questions in IndexedDB:", error);
    }
  };

  // 6. Update Session Progress (Standalone)
  const updateSessionProgress = async (
    completedQuestions: number,
    correctAnswers: number
  ) => {
    if (!sessionData || !userId) return;

    const updatedSession: SessionData = {
      ...sessionData,
      completedQuestions,
      correctAnswers,
      updatedAt: new Date(),
    };

    setSessionData(updatedSession);

    try {
      await feynDB.sessions.put({
        id: sessionId,
        userId: userId,
        data: updatedSession,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to update progress in IndexedDB:", error);
    }
  };

  // 7. Add Extra Questions Logic
  const addExtraQuestionsToSession = async (
    newQuestions: Question[],
    subtopicName: string
  ) => {
    if (!sessionData || !userId) return false;

    const subtopicKey = subtopicName || "General";
    const normalizedNewQuestions = newQuestions.map((q) => ({
      ...q,
      subtopic: subtopicKey,
    }));

    let insertIndex = -1;
    questions.forEach((q, index) => {
      if ((q.subtopic || "General") === subtopicKey) insertIndex = index;
    });

    const updatedQuestions =
      insertIndex === -1
        ? [...questions, ...normalizedNewQuestions]
        : [
            ...questions.slice(0, insertIndex + 1),
            ...normalizedNewQuestions,
            ...questions.slice(insertIndex + 1),
          ];

    const currentPerformance = sessionData.subtopicPerformance || {};
    const existingSubData = currentPerformance[subtopicKey] || {
      name: subtopicKey,
      scored: 0,
      total: 0,
    };

    const updatedSubtopicPerformance = {
      ...currentPerformance,
      [subtopicKey]: {
        ...existingSubData,
        total: updatedQuestions.filter(
          (q) => (q.subtopic || "General") === subtopicKey
        ).length,
      },
    };

    const updatedSession: SessionData = {
      ...sessionData,
      questionlist: updatedQuestions,
      totalQuestions: updatedQuestions.length,
      subtopicPerformance: updatedSubtopicPerformance,
      updatedAt: new Date(),
    };

    setQuestions(updatedQuestions);
    setSessionData(updatedSession);

    try {
      await feynDB.sessions.put({
        id: sessionId,
        userId: userId,
        data: updatedSession,
        updatedAt: Date.now(),
      });
      return true;
    } catch (error) {
      console.error("Failed to add questions to IndexedDB:", error);
      return false;
    }
  };

  return {
    loading,
    sessionData,
    questions,
    updateSessionProgress,
    updateQuestions,
    updateSessionData,
    completeSession,
    addExtraQuestionsToSession,
  };
};  