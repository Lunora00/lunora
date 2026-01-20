// useAllSessions.ts

import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch, // <--- New import for efficient bulk deletion
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { feynDB ,saveSessionToIndexedDB,deleteCachedSession} from "@/lib/indexdb/sessionCache";


// --- TYPES (Exported for the UI component) ---

export interface SubtopicPerformanceEntry {
  name: string;
  scored: number;
  total: number;
}

export interface LastPracticeMetrics {
  lastScorePercentage: number;
  // ... other metrics like duration, date, etc.
}

export interface SessionEntry {
  majorSubject: string;
  id: string;
  content?: string;
  topic: string;
  svgTopicTitle:any;
  subject: string;
  score: number;
  medal: string;
  urgency: string;
  lastAttempt: any;
  totalQuestions: number;
  correctAnswers: number;
  completedQuestions: number;
  isCompleted: boolean;
  subtopicPerformance: Record<string, SubtopicPerformanceEntry>;
  questionlist: any[];
  allAttempts?: LastPracticeMetrics[];
}

// --- UTILITY FUNCTIONS (Exported for the UI component) ---

/**
 * @description Formats a Firebase Timestamp or seconds object into a human-readable "time ago" string.
 * @param timestamp - Firebase Timestamp or object with a 'seconds' property.
 * @returns Formatted time string.
 */
export const formatDate = (timestamp: any): string => {
  let date: Date;

  if (timestamp && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp && timestamp.seconds) {
    // Handling case where timestamp is a raw {seconds, nanoseconds} object
    date = new Date(timestamp.seconds * 1000);
  } else {
    return "Never Studied"; // Improved default message
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  const SECONDS_IN_DAY = 60 * 60 * 24;
  const diffInDays = Math.floor(diffInSeconds / SECONDS_IN_DAY);

  if (diffInDays === 0) {
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 1) return "Just now";
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 1)
      return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  }

  if (diffInDays === 1) return "Yesterday";
  if (diffInDays <= 100) return `${diffInDays} days ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
};

export const getMedalInfo = (score: number) => {
  if (score >= 90) return { medal: "gold", color: "#EAB308", img: "/gold.png" };
  if (score >= 70)
    return { medal: "silver", color: "#64748B", img: "/silver.png" };
  if (score >= 40)
    return { medal: "bronze", color: "#D97706", img: "/bronze.png" };
  return { medal: "none", color: "#A1A1AA", img: "/fail.png" };
};

// --- DATA FETCHING HOOK (useAllSessions) ---

export const useAllSessions = (userId: string | null | undefined) => {
  const [topics, setTopics] = useState<SessionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * @description Fetches all sessions for the current user from Firestore.
   */
 const fetchAllSessions = useCallback(async () => {
  if (!userId) {
    setLoading(false);
    return;
  }

  setLoading(true);

  // 1️⃣ Instant UI from IndexedDB
  const cached = await feynDB.sessions
    .where("userId")
    .equals(userId)
    .toArray();

  if (cached.length > 0) {
setTopics(
  cached.map(c => ({
    ...c.data,
    id: c.id,           // ensure id is correct
  }))
);
    setLoading(false);
  }

  try {
    // 2️⃣ Firestore fetch (SOURCE OF TRUTH)
    const q = query(
      collection(db, "sessions"),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);

    const fetchedSessions: SessionEntry[] = snapshot.docs.map(docSnap => {
      const data = docSnap.data();

      const allAttempts = data.allAttempts || [];
      const scoreToDisplay =
  data.totalQuestions > 0
    ? Math.round((data.correctAnswers / data.totalQuestions) * 100)
    : 0;


      return {
       createdAt:  data.createdAt,
        id: docSnap.id,
        topic: data.name || "Untitled Session",
        subject: data.subject || "General",
        content: data.content || "",
        majorSubject: data.majorSubject,
        svgTopicTitle: data.svgTopicTitle,
        score: scoreToDisplay,
        medal: getMedalInfo(scoreToDisplay).medal,
        urgency:
          scoreToDisplay < 40
            ? "critical"
            : scoreToDisplay < 70
            ? "high"
            : "low",
        lastAttempt: data.lastAttemptedDate || data.createdAt,
        totalQuestions: data.totalQuestions || 0,
        correctAnswers: data.correctAnswers || 0,
        completedQuestions: data.completedQuestions || 0,
        isCompleted: data.isCompleted || false,
        subtopicPerformance: data.subtopicPerformance || {},
        questionlist: data.questionlist || [],
        allAttempts,
      };
    });

    // 3️⃣ IndexedDB SYNC (ONCE)
    const firestoreIds = fetchedSessions.map(s => s.id);

    await Promise.all(
      fetchedSessions.map(session =>
        feynDB.sessions.put({
          id: session.id,
          userId,
          data: session,
          updatedAt: Date.now(),
        })
      )
    );

    // 4️⃣ Cache cleanup (deleted on other devices)
    await feynDB.sessions
      .where("userId")
      .equals(userId)
      .and(s => !firestoreIds.includes(s.id))
      .delete();

    // 5️⃣ Final UI update
    setTopics(fetchedSessions);
  } catch (err) {
    console.error("Firestore sync failed, using cache only", err);
  } finally {
    setLoading(false);
  }
}, [userId]);






  /**
   * @description Resets a session's current progress and recalculates initial subtopic totals.
   * This prepares the session for a fresh practice/re-training attempt.
   * @returns The session ID if successful, or null if failed.
   */





  const resetSessionForTraining = useCallback(
    async (sessionToReset: SessionEntry): Promise<string | null> => {
      if (!userId) return null;
      try {
        const docRef = doc(db, "sessions", sessionToReset.id);

        // Calculate initial subtopic totals based on the question list
        const resetSubtopics = (sessionToReset.questionlist || []).reduce(
          (acc: Record<string, SubtopicPerformanceEntry>, q: any) => {
            const name = q.subtopic || "General";

            if (!acc[name]) {
              acc[name] = { name, scored: 0, total: 0 };
            }
            acc[name].total += 1;
            return acc;
          },
          {}
        );

        // Reset user answers for all questions in the list
        const resetQuestionList = (sessionToReset.questionlist || []).map(
          (q: any) => ({
            ...q,
            userAnswer: null,
            userAnswerIndex: null,
          })
        );

        // Perform the Firestore update
        await updateDoc(docRef, {
          score: 0,
          correctAnswers: 0,
          completedQuestions: 0,
          isCompleted: false, // Essential for a fresh start
          questionlist: resetQuestionList,
          subtopicPerformance: resetSubtopics,
          lastAttemptedDate: Timestamp.now(), // Update last attempted date
        });
const updatedSession = {
  ...sessionToReset,
  score: 0,
  correctAnswers: 0,
  completedQuestions: 0,
  isCompleted: false,
  questionlist: resetQuestionList,
  subtopicPerformance: resetSubtopics,
  lastAttemptedDate: Timestamp.now(),
};

await saveSessionToIndexedDB(
  userId,              
  sessionToReset.id, 
  updatedSession
);

setTopics(prevTopics =>
  prevTopics.map(s => (s.id === updatedSession.id ? updatedSession : s))
);

 
        return sessionToReset.id;
      } catch (e) {
        console.error("Session reset error:", e);
        return null;
      }
    },
    [userId]
  );

  /**
   * @description Deletes a single session from Firestore and removes it from the local state.
   * @param sessionId - The ID of the session document to delete.
   * @returns True if successful, false if failed.
   */
  const deleteSession = useCallback(
    async (sessionId: string): Promise<boolean> => {
      if (!userId) return false;
      try {
        const docRef = doc(db, "sessions", sessionId);
        await deleteDoc(docRef);
        await deleteCachedSession(sessionId);

        // Optimistically update the UI after successful deletion
        setTopics((prevTopics) =>
          prevTopics.filter((topic) => topic.id !== sessionId)
        );
        return true;
      } catch (e) {
        console.error("Session deletion error:", e);
        return false;
      }
    },
    [userId]
  );

  /**
   * @description Deletes ALL sessions for the current user that match the specified majorSubject.
   * Uses a Firestore Write Batch for efficient bulk deletion.
   * @param majorSubject - The major subject category to delete sessions for.
   * @returns True if successful (even if no sessions were found), false if a database error occurred.
   */
  const deleteSubjectSessions = useCallback(
    async (subject: string): Promise<boolean> => {
      if (!userId) return false;
      
      try {
        const sessionsRef = collection(db, "sessions");
        
        // 1. Query all sessions for the user AND the specific majorSubject
        const q = query(
          sessionsRef,
          where("userId", "==", userId),
          where("subject", "==", subject)
        );

        const querySnapshot = await getDocs(q);
        const sessionsToDelete: string[] = [];
        
        // 2. Prepare a Firestore Write Batch
        const batch = writeBatch(db);

        querySnapshot.docs.forEach((docSnap) => {
          sessionsToDelete.push(docSnap.id);
          batch.delete(docSnap.ref); // Add delete operation to the batch
        });
        
        // 3. Commit the batch operation (bulk delete)
        if (sessionsToDelete.length > 0) {
            await batch.commit();
        }

        for (const id of sessionsToDelete) {
  await deleteCachedSession(id);
}

        // 4. Update local state to reflect the deletion
        setTopics((prevTopics) =>
          prevTopics.filter((topic) => !sessionsToDelete.includes(topic.id))
        );


        return true;
      } catch (e) {
        console.error("Bulk session deletion error:", e);
        return false;
      }
    },
    [userId]
  );

  useEffect(() => {
    fetchAllSessions();
  }, [fetchAllSessions]);

  return {
    topics,
    loading,
    refetch: fetchAllSessions,
    resetSessionForTraining,
    deleteSession,
    deleteSubjectSessions,
  };
};