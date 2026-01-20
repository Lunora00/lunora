// hooks/useSubscription.ts
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore"; // 👈 Changed to onSnapshot
import { db } from "@/lib/firebase";
import { useAuth as useSession } from "../hooks/useAuth";
import {
  getSubscriptionFromIndexedDB,
  saveSubscriptionToIndexedDB,
} from "../../lib/indexdb/subscriptionCache";


export type Plan = "free" | "pro_monthly" | "pro_yearly";

export const useSubscription = () => {
  const { data: session, status } = useSession();
  const [plan, setPlan] = useState<Plan>("free");
  const [isPro, setIsPro] = useState(false); // 👈 Explicit state for isPro
  const [dodoCustomerId, setDodoCustomerId] = useState<string | null>(null);
  const [nextBillingDate,setnextBillingDate] = useState(null)
  const [loading, setLoading] = useState(true);

 useEffect(() => {
  if (status !== "authenticated" || !session?.user?.id) {
    if (status !== "loading") setLoading(false);
    return;
  }

  const userId = session.user.id;

  // 1️⃣ LOAD FROM INDEXEDDB FIRST (NO FIRESTORE READ)
  (async () => {
    const cached = await getSubscriptionFromIndexedDB(userId);
    if (cached) {
      setPlan(cached.plan);
      setIsPro(cached.isPro);
      setDodoCustomerId(cached.dodoCustomerId);
      setnextBillingDate(cached.nextBillingDate);
      setLoading(false);
    }
  })();

  // 2️⃣ FIRESTORE REALTIME (SOURCE OF TRUTH)
  const unsub = onSnapshot(
    doc(db, "users", userId),
    async (snap) => {
      if (!snap.exists()) return;

      const data = snap.data();

      const subscriptionPayload = {
        plan: data.plan || "free",
        isPro: data.isPro === true && data.subscriptionStatus !== "failed",
        dodoCustomerId: data.dodoCustomerId || null,
        nextBillingDate: data.next_billing_date || null,
      };

      // Update UI
      setPlan(subscriptionPayload.plan);
      setIsPro(subscriptionPayload.isPro);
      setDodoCustomerId(subscriptionPayload.dodoCustomerId);
      setnextBillingDate(subscriptionPayload.nextBillingDate);
      setLoading(false);

      // 3️⃣ SAVE EVERYTHING TO INDEXEDDB
      await saveSubscriptionToIndexedDB(userId, subscriptionPayload);
    },
    (err) => {
      console.error("Subscription listener error:", err);
      setLoading(false);
    },
  );

  return () => unsub();
}, [session?.user?.id, status]);


  return {
    plan,
    isPro, // Now returns the actual DB value
    dodoCustomerId,
    userid:session?.user.id,
    loading,
    nextBillingDate
  };
};