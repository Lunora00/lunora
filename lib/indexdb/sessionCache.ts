// lib/indexedDB/sessionCache.ts
import Dexie, { Table } from "dexie";

export interface LocalSession {
  id: string;
  userId: string;
  data: any;        // full session payload
  updatedAt: number;
}

// --------------------------------------------------
// 🔥 Dexie Database
// --------------------------------------------------
class FeynmindDB extends Dexie {
  sessions!: Table<LocalSession, string>;

  constructor() {
    super("FeynmindDB");

    this.version(2).stores({
  sessions: "id, userId, updatedAt",
});

  }
}

// Global DB instance
export const feynDB = new FeynmindDB();

// --------------------------------------------------
// 🔥 Save full session object locally
// --------------------------------------------------
export const saveSessionToIndexedDB = async (
  userId: string,
  sessionId: string,
  sessionData: any
) => {
  return feynDB.sessions.put({
    id: sessionId,
    userId,
    data: sessionData,
    updatedAt: Date.now(),
  });
};


export const getSessionFromIndexedDB = async (sessionId: string) => {
  return await feynDB.sessions.get(sessionId);
};

export const updateSessionField = async (
  sessionId: string,
  partialData: any
) => {
  const existing = await feynDB.sessions.get(sessionId);
  if (!existing) return undefined;

  const updatedSession = {
    ...existing.data,
    ...partialData,
  };

  await feynDB.sessions.put({
    id: existing.id,           
    userId: existing.userId,   
    data: updatedSession,
    updatedAt: Date.now(),
  });

  return updatedSession;
};


// --------------------------------------------------
// 🔥 Delete a cached session
// --------------------------------------------------
export const deleteCachedSession = async (sessionId: string) => {
  return await feynDB.sessions.delete(sessionId);
};
