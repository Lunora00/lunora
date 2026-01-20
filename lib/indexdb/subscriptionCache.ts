// lib/indexedDB/subscriptionCache.ts
import Dexie, { Table } from "dexie";

// --------------------------------------------------
// 🔥 Subscription Cache Shape
// --------------------------------------------------
export interface LocalSubscription {
  userId: string;

  plan: "free" | "pro_monthly" | "pro_yearly";
  isPro: boolean;
  dodoCustomerId: string | null;
  nextBillingDate: any;

  updatedAt: number;
}

// --------------------------------------------------
// 🔥 Dexie Database
// --------------------------------------------------
class SubscriptionDB extends Dexie {
  subscription!: Table<LocalSubscription, string>;

  constructor() {
    super("FeynmindSubscriptionDB");

    this.version(1).stores({
      subscription: "userId, updatedAt",
    });
  }
}

// Global DB instance
export const subscriptionDB = new SubscriptionDB();

// --------------------------------------------------
// 🔥 Save FULL subscription data
// --------------------------------------------------
export const saveSubscriptionToIndexedDB = async (
  userId: string,
  data: Omit<LocalSubscription, "userId" | "updatedAt">,
) => {
  return subscriptionDB.subscription.put({
    userId,
    ...data,
    updatedAt: Date.now(),
  });
};

// --------------------------------------------------
// 🔥 Get subscription from cache
// --------------------------------------------------
export const getSubscriptionFromIndexedDB = async (userId: string) => {
  return subscriptionDB.subscription.get(userId);
};

// --------------------------------------------------
// 🔥 Update partial subscription fields
// --------------------------------------------------
export const updateSubscriptionField = async (
  userId: string,
  partialData: Partial<LocalSubscription>,
) => {
  const existing = await subscriptionDB.subscription.get(userId);
  if (!existing) return undefined;

  const updated = {
    ...existing,
    ...partialData,
    updatedAt: Date.now(),
  };

  await subscriptionDB.subscription.put(updated);
  return updated;
};

// --------------------------------------------------
// 🔥 Delete cached subscription (logout / delete)
// --------------------------------------------------
export const deleteSubscriptionFromIndexedDB = async (userId: string) => {
  return subscriptionDB.subscription.delete(userId);
};
