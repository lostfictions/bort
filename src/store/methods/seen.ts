import { DB } from "../get-db";

const key = "seen";

interface SeenData {
  [username: string]: {
    time: number;
    message: string;
    channel: string;
  };
}

export async function setSeen(
  db: DB,
  username: string,
  message: string,
  channel: string,
  time = Date.now()
): Promise<void> {
  const seen = await db.get<SeenData>(key);
  seen[username] = {
    message,
    channel,
    time
  };
  return db.put<SeenData>(key, seen);
}

export async function initializeSeen(db: DB): Promise<void> {
  return db.put<SeenData>(key, {});
}
