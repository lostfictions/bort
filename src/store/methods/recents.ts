import { DB } from "../get-db";

export interface Recents {
  [url: string]: number;
}

const key = "recents";

export async function addRecent(
  db: DB,
  item: string,
  time = Date.now()
): Promise<void> {
  const recents = await db.get<Recents>(key);
  recents[item] = time;
  return db.put<Recents>(key, recents);
}

export async function cleanRecents(
  db: DB,
  olderThanMinutes: number = 60
): Promise<void> {
  const olderThan = Date.now() - olderThanMinutes * 60 * 1000;

  const recents = await db.get<Recents>(key);

  const nextState: Recents = {};
  for (const [url, lastSeen] of Object.entries(recents)) {
    if ((lastSeen || 0) - olderThan > 0) {
      nextState[url] = lastSeen;
    }
  }

  return db.put<Recents>(key, nextState);
}

export function getRecents(db: DB): Promise<Recents> {
  return db.get<Recents>(key);
}

export async function initializeRecents(db: DB) {
  try {
    const recents = await db.get<Recents>(key);
    if (typeof recents !== "object") {
      throw new Error(`Unexpected store shape for seen (key "${key}")`);
    }
  } catch (e) {
    console.warn(e, "... Initializing...");
    await db.put<Recents>(key, {});
  }
}
