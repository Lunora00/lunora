// hooks/useSubscription.ts
import { useEffect, useState } from "react";
import { doc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth as useSession } from "../hooks/useAuth";
import {
  getSubscriptionFromIndexedDB,
  saveSubscriptionToIndexedDB,
} from "../../lib/indexdb/subscriptionCache";

export type Plan = "free" | "pro_monthly" | "pro_yearly";

export interface SubscriptionData {
  plan: Plan;
  isPro: boolean;
  dodoCustomerId: string | null;
  nextBillingDate: Date | Timestamp | null;
}

export interface UseSubscriptionReturn {
  plan: Plan;
  isPro: boolean;
  dodoCustomerId: string | null;
  userid: string | undefined;
  loading: boolean;
  nextBillingDate: Date | Timestamp | null;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { data: session, status } = useSession();

  const [plan, setPlan] = useState<Plan>("free");
  const [isPro, setIsPro] = useState<boolean>(false);
  const [dodoCustomerId, setDodoCustomerId] = useState<string | null>(null);
  const [nextBillingDate, setNextBillingDate] =
    useState<Date | Timestamp | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) {
      if (status !== "loading") setLoading(false);
      return;
    }

    const userId = session.user.id;

    // 1️⃣ Load from IndexedDB first (fast, no Firestore read)
    (async () => {
      try {
        const cached = await getSubscriptionFromIndexedDB(userId);
        if (cached) {
          setPlan(cached.plan);
          setIsPro(cached.isPro);
          setDodoCustomerId(cached.dodoCustomerId);
          setNextBillingDate(cached.nextBillingDate);
          setLoading(false);
        }
      } catch (err) {
        console.error("IndexedDB read failed:", err);
      }
    })();

    // 2️⃣ Firestore realtime listener (source of truth)
    const unsub = onSnapshot(
      doc(db, "users", userId),
      async (snap) => {
        if (!snap.exists()) {
          setLoading(false);
          return;
        }

        const data = snap.data();

        const subscriptionPayload: SubscriptionData = {
          plan: (data.plan as Plan) || "free",
          isPro: data.isPro === true && data.subscriptionStatus !== "failed",
          dodoCustomerId: data.dodoCustomerId ?? null,
          nextBillingDate: data.next_billing_date ?? null,
        };

        // Update UI
        setPlan(subscriptionPayload.plan);
        setIsPro(subscriptionPayload.isPro);
        setDodoCustomerId(subscriptionPayload.dodoCustomerId);
        setNextBillingDate(subscriptionPayload.nextBillingDate);
        setLoading(false);

        // 3️⃣ Cache in IndexedDB
        try {
          await saveSubscriptionToIndexedDB(userId, subscriptionPayload);
        } catch (err) {
          console.error("IndexedDB save failed:", err);
        }
      },
      (err) => {
        console.error("Subscription listener error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [session?.user?.id, status]);

  return {
    plan,
    isPro,
    dodoCustomerId,
    userid: session?.user?.id,
    loading,
    nextBillingDate,
  };
};
