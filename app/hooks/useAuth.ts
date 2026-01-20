import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { getUserFromIndexedDB, saveUserToIndexedDB } from "@/lib/indexdb/userCache";

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [cachedUser, setCachedUser] = useState<any>(null);

    // PHASE 1: Load from cache immediately (instant)
    useEffect(() => {
        const loadCachedUser = async () => {
            try {
                const uid = typeof window !== "undefined" ? localStorage.getItem("firebaseUID") : null;
                if (uid) {
                    const cached = await getUserFromIndexedDB(uid);
                    if (cached) {
                        setCachedUser(cached);
                        // Don't set loading=false here - wait for Firebase verification
                    }
                }
            } catch (error) {
                console.error("Cache load error:", error);
            }
        };
        loadCachedUser();
    }, []);

    // PHASE 2: Verify with Firebase in background (async)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            
            // Save to cache for next time
            if (firebaseUser) {
                try {
                    localStorage.setItem("firebaseUID", firebaseUser.uid);
                    await saveUserToIndexedDB(firebaseUser.uid, {
                        id: firebaseUser.uid,
                        updatedAt: Date.now(),
                    });
                } catch (error) {
                    console.error("Cache save error:", error);
                }
            } else {
                localStorage.removeItem("firebaseUID");
                setCachedUser(null); // Clear cache if Firebase says logged out
            }
            
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Use real Firebase user if available
    // Only use cached user if Firebase hasn't verified yet (user is null but still loading)
    // If Firebase verified and user is null, don't trust cache (user logged out)
    const currentUser = user !== null ? user : (loading ? cachedUser : null);
    const provider = user?.providerData?.[0];

    const session = currentUser ? {
        user: {
            id: user?.uid || currentUser.id,
            name: user?.displayName || provider?.displayName || currentUser.name || null,
            email: user?.email || provider?.email || currentUser.email || null,
            image: user?.photoURL || provider?.photoURL || currentUser.image || null,
        }
    } : null;

    return { 
        session, 
        status: loading ? "loading" : (user || cachedUser) ? "authenticated" : "unauthenticated",
        data: session,
        isVerified: !!user // True only if Firebase verified, false if just cached
    };
};