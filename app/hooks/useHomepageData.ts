import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth as useSession } from "../hooks/useAuth";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {feynDB} from "@/lib/indexdb/sessionCache";
import {
  updateProfile,
  onAuthStateChanged,
  User,
  reload,
  signOut,
} from "firebase/auth";
import { 
  getUserFromIndexedDB, 
  saveUserToIndexedDB, 
  updateUserField 
} from "../../lib/indexdb/userCache"; // <-- path to your user cache


interface Session {
  id: string;
  name: string;
  createdAt: any;
  totalQuestions: number;
  completedQuestions: number;
  correctAnswers: number;
  weakTopics?: string[];
  subject?: string;
  content?: string;
}

export interface Recommendation {
  id: string;
  topic: string;
  subject: string;
  accuracy: number;
  questionsAttempted: number;
  sessionName: string;
  type: "quiz" | "flashcard" | "mindmap";
  icon: any;
  reason: string;
  sessionId?: string;
}

interface ResourceCreationCallback {
  (
    topicName: string,
    sessionId: string,
    type: "quiz" | "flashcard" | "mindmap",
    fetchedSessionData: Session,
  ): void;
}

const FREE_SESSION_LIMIT = 1;

export const useHomepageData = (
) => {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [sessionFetchComplete, setSessionFetchComplete] = useState(false);
  const [usedSessions, setUsedSessions] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsFirebaseLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isLoading = useMemo(() => {
    const isAuthLoading = status === "loading" || isFirebaseLoading;
    const isDataLoading = status === "authenticated" && !sessionFetchComplete;
    return isAuthLoading || isDataLoading;
  }, [status, isFirebaseLoading, sessionFetchComplete]);

  const fetchSessions = useCallback(async () => {
    if (!session?.user?.id) return;

    if (sessionFetchComplete !== false) setSessionFetchComplete(false);

    try {
        const cachedSessions = await feynDB.sessions
      .where("userId")
      .equals(session.user.id)
      .toArray();

    if (cachedSessions.length > 0) {
      const sessionsFromCache = cachedSessions.map((s) => ({
        id: s.id,
        ...s.data,
      })) as Session[];

      sessionsFromCache.sort(
        (a, b) => b.createdAt?.seconds - a.createdAt?.seconds,
      );

      setSessions(sessionsFromCache);
      return; // 🚀 STOP HERE (NO FIRESTORE)
    }
      const q = query(
        collection(db, "sessions"),
        where("userId", "==", session.user.id),
      );
      const querySnapshot = await getDocs(q);

      // Fetch the PERMANENT counter from the user document
      const userDoc = await getDoc(doc(db, "users", session.user.id));
      const permanentCount = userDoc.exists()
        ? userDoc.data().usedSessions || 0
        : 0;

      const userSessions: Session[] = [];
      querySnapshot.forEach((doc) => {
        userSessions.push({ id: doc.id, ...doc.data() } as Session);
      });

      userSessions.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);

      setSessions(userSessions);

      setUsedSessions(permanentCount);
      await saveUserToIndexedDB(session.user.id, {
  usedSessions: permanentCount,
  mascot, 
});
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    } finally {
      setSessionFetchComplete(true);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  // 🚀 FETCH SESSIONS EARLY - don't wait for "authenticated" status
  // Start fetching as soon as we have a userId (from cache or Firebase)
  useEffect(() => {
    if (session?.user?.id && !sessionFetchComplete) {
      fetchSessions();
    }
  }, [session?.user?.id, sessionFetchComplete, fetchSessions]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    try {
      await deleteDoc(doc(db, "sessions", sessionId));
      setSessions((prev) =>
        prev ? prev.filter((s) => s.id !== sessionId) : [],
      );
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session");
    }
  }, []);

  const [mascot, setMascot] = useState<string>("normal"); // New state for mascot

  // Update fetchSessions or a separate useEffect to get user profile data
  useEffect(() => {
   const fetchUserProfile = async () => {
  if (!session?.user?.id) return;

  // 1️⃣ Try to get from local cache
  const cachedUser = await getUserFromIndexedDB(session.user.id);
  if (cachedUser) {
    setMascot(cachedUser.mascot || "normal");
    setUsedSessions(cachedUser.usedSessions || 0);
    return;
  }

  // 2️⃣ If not in cache, fallback to Firestore
  const userDoc = await getDoc(doc(db, "users", session.user.id));
  if (userDoc.exists()) {
    const data = userDoc.data();
    const mascotFromDB = data.mascot || "normal";
    const usedSessionsFromDB = data.usedSessions || 0;

    setMascot(mascotFromDB);
    setUsedSessions(usedSessionsFromDB);

    // Save to cache for next time
    await saveUserToIndexedDB(session.user.id, {
      mascot: mascotFromDB,
      usedSessions: usedSessionsFromDB,
    });
  }
};

    if (status === "authenticated") fetchUserProfile();
  }, [session?.user?.id, status]);

  // NEW: Function to handle Mascot Change
 const handleChangeMascot = useCallback(
  async (newMascot: string) => {
    if (!session?.user?.id) throw new Error("No user ID found.");

    try {
      // 1️⃣ Update Firestore
      await setDoc(
        doc(db, "users", session.user.id),
        { mascot: newMascot },
        { merge: true },
      );

      // 2️⃣ Update local cache
      await updateUserField(session.user.id, { mascot: newMascot });

      // 3️⃣ Update state
      setMascot(newMascot);

    } catch (error) {
      console.error("Error updating mascot:", error);
      alert("Failed to update mascot.");
    }
  },
  [session?.user?.id],
);


  const handleCreateNew = useCallback(() => {
    router.push("/create-new");
  }, [usedSessions, router]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut(auth);

      router.push("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [router]); // Add router to dependencies
  const handleDeleteAccount = useCallback(async () => {
    if (!session?.user?.id || !auth.currentUser) {
      alert("You must be logged in to delete your account.");
      return;
    }
    try {
      const userId = session.user.id;
      const userForAuthDeletion = auth.currentUser;
      const batch = writeBatch(db);

      // 1. Wipe Firestore Data
      const q = query(
        collection(db, "sessions"),
        where("userId", "==", userId),
      );
      const querySnapshot = await getDocs(q);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const userDocRef = doc(db, "users", userId);
      batch.delete(userDocRef);

      await batch.commit();

      // 2. Try to delete the Auth login
      try {
        await userForAuthDeletion.delete();
      } catch (authError: any) {
        // If security blocks it, we just log them out (Data is already gone)
        console.warn("Auth deletion deferred due to security rules.");
      }

      // 3. FIREBASE SIGN OUT ONLY
      // Correct syntax: signOut(auth) - No objects, no callbackUrls
      await signOut(auth);

      // 4. MANUAL REDIRECT
      router.push("/signin");

      alert("Account and data cleared.");
    } catch (error: any) {
      console.error("Deletion error:", error);
      alert("Error: " + error.message);
    }
  }, [session?.user?.id, router]);

  const handleChangeName = useCallback(
    async (newName: string) => {
      // 1. Check if user is logged in
      if (!session?.user?.id) throw new Error("No user ID found.");

      try {
        // 2. Update the Database (Firestore)
        await setDoc(
          doc(db, "users", session.user.id),
          { name: newName },
          { merge: true },
        );

        // 3. Update the Auth Profile (Firebase Auth)
        // This ensures the "Display Name" is updated in the Firebase system too
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: newName });
        }



        // Optional: Trigger a page reload or update a local state if you want
        // the UI to change immediately without a refresh.
      } catch (error) {
        console.error("Error updating name:", error);
        alert("Failed to update name.");
      }
    },
    [session?.user?.id],
  ); //

  const handleDeleteAllSessions = useCallback(async () => {
    if (!session?.user?.id) {
      alert("Error: User ID not found.");
      return;
    }

    try {
      const q = query(
        collection(db, "sessions"),
        where("userId", "==", session.user.id),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return;
      }

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      setSessions([]);
      setUsedSessions(0);
    } catch (error) {
      console.error("Error deleting all sessions:", error);
      throw new Error("Failed to delete all sessions.");
    }
  }, [session?.user?.id]);

  return {
    session,
    status,
    sessions,
    usedSessions,
    showSettings,
    setShowSettings,
    FREE_SESSION_LIMIT,
    router,
    handleSignOut,
    handleDeleteAccount,
    handleCreateNew,
    handleDeleteSession,
    handleChangeName,
    mascot,
    setMascot,
    handleDeleteAllSessions,
    handleChangeMascot,
    isLoading,
    isFirebaseLoading,
    sessionFetchComplete,
  };
};
