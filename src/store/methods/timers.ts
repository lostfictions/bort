import { DB } from "../get-db";

export interface TimerPayload {
  /** Time at or after which the timer should fire. */
  time: number;
  /** The message attached to the timer. */
  message: string;
  /** The user to mention when the timer fires. */
  user: string;
  /** The user who created the timer. */
  creator: string;
}

export interface Timers {
  lastId: number;
  timers: {
    [id: string]: TimerPayload;
  };
}

const key = "timers";

export async function addTimer(db: DB, payload: TimerPayload): Promise<string> {
  const t = await db.get<Timers>(key);
  t.lastId++;
  t.timers[t.lastId.toString()] = payload;
  return db.put<Timers>(key, t).then(() => t.lastId.toString());
}

export async function removeTimer(db: DB, id: string): Promise<void> {
  const t = await db.get<Timers>(key);
  delete t.timers[id];
  return db.put<Timers>(key, t);
}

export async function removeAllTimers(db: DB): Promise<void> {
  const t = await db.get<Timers>(key);
  t.timers = {};
  return db.put<Timers>(key, t);
}

export function getTimers(db: DB): Promise<Timers> {
  return db.get<Timers>(key);
}

export function initializeTimers(db: DB): Promise<void> {
  return db.put<Timers>(key, { lastId: 0, timers: {} });
}

export async function activateTimer(
  db: DB,
  id: string,
  action: (payload: TimerPayload) => void
): Promise<NodeJS.Timeout | null> {
  const t = await db.get<Timers>(key);
  const payload = t.timers[id];
  if (!payload) {
    throw new Error(`Can't get timer with id ${id}!`);
  }

  const fireAction = () => {
    action(payload);
    return removeTimer(db, id);
  };

  const fireTime = Date.now() - payload.time;

  if (fireTime <= 0) {
    await fireAction();
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  return setTimeout(fireAction, fireTime);
}

export async function activateAllTimers(
  db: DB,
  action: (payload: TimerPayload) => void
): Promise<NodeJS.Timeout[]> {
  const t = await db.get<Timers>(key);

  const results = await Promise.all(
    Object.keys(t.timers).map((id) => activateTimer(db, id, action))
  );

  return results.filter<NodeJS.Timeout>(
    (res): res is NodeJS.Timeout => res !== null
  );
}
