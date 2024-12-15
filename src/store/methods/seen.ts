import type { DB } from "../get-db.ts";

const key = "seen";

export interface SeenEntry {
  time: number;
  message: string;
  channel: string;
}

interface SeenData {
  [username: string]: SeenEntry;
}

export async function setSeen(
  db: DB,
  username: string,
  message: string,
  channel: string,
  time = Date.now(),
): Promise<void> {
  const seen = await db.get<SeenData>(key);
  seen[username] = {
    message,
    channel,
    time,
  };
  return db.put<SeenData>(key, seen);
}

export async function getSeen(
  db: DB,
  username: string,
): Promise<SeenEntry | false> {
  const seen = await db.get<SeenData>(key);
  const entry = seen[username];
  return entry ?? false;
}

export async function shouldInitializeSeen(db: DB): Promise<boolean> {
  try {
    const seen = await db.get<SeenData>(key);
    if (typeof seen !== "object") {
      return true;
    }
  } catch (e: any) {
    if (e.notFound) return true;
    throw e;
  }
  return false;
}

export async function initializeSeen(db: DB) {
  await db.put<SeenData>(key, {});
}
