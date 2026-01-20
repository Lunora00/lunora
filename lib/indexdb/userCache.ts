import Dexie, { Table } from "dexie";

// ------------------------------
// Lean User Cache: Only mascot & usedSessions
// ------------------------------
export interface LocalUser {
  id: string;             // Firebase UID
  mascot?: string;
  usedSessions?: number;
  updatedAt: number;       // Local cache timestamp
}

// ------------------------------
// Dexie DB for Users
// ------------------------------
class UserDB extends Dexie {
  users!: Table<LocalUser, string>;

  constructor() {
    super("FeynmindUserDB");

    this.version(1).stores({
      users: "id, updatedAt",
    });
  }
}

export const userDB = new UserDB();

// ------------------------------
// Helpers
// ------------------------------
export const saveUserToIndexedDB = async (userId: string, userData: Partial<LocalUser>) => {
  return userDB.users.put({
    id: userId,
    mascot: userData.mascot,
    usedSessions: userData.usedSessions,
    updatedAt: Date.now(),
  });
};

export const getUserFromIndexedDB = async (userId: string) => {
  return userDB.users.get(userId);
};

export const updateUserField = async (userId: string, partialData: Partial<LocalUser>) => {
  const existing = await userDB.users.get(userId);
  if (!existing) return undefined;

  const updated: LocalUser = {
    ...existing,
    ...partialData,
    updatedAt: Date.now(),
  };

  await userDB.users.put(updated);
  return updated;
};

export const deleteUserFromIndexedDB = async (userId: string) => {
  return userDB.users.delete(userId);
};
