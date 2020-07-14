import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import { DB } from "../get-db";

dayjs.extend(relativeTime);

// https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/setTimeout#Maximum_delay_value
const MAX_DELAY = 2_147_483_647;

export const getTimerMessage = ({
  setTime,
  message,
  user,
  creator,
}: TimerPayload) => {
  const author = user === creator ? "you" : creator;
  return `${user}, ${author} asked me to tell you ${dayjs(
    setTime
  ).fromNow()}: ${message}`;
};

export interface TimerPayload {
  /** Time at or after which the timer should fire. */
  triggerTime: number;
  /** Time at which the timer was set. */
  setTime: number;
  /** The message attached to the timer. */
  message: string;
  /** The user id to mention when the timer fires. */
  user: string;
  /** The id of the user who created the timer. */
  creator: string;
  /** The id of the channel in which to post the message. */
  channel: string;
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

export async function removeTimer(db: DB, id: string): Promise<boolean> {
  const t = await db.get<Timers>(key);
  if (id in t.timers) {
    delete t.timers[id];
    await db.put<Timers>(key, t);
    return true;
  }
  return false;
}

export async function removeAllTimers(db: DB): Promise<void> {
  const t = await db.get<Timers>(key);
  t.timers = {};
  return db.put<Timers>(key, t);
}

export function getTimers(db: DB): Promise<Timers> {
  return db.get<Timers>(key);
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

  const fireAction = async () => {
    // might seem redundant to get it again, but we need to check if it's been
    // deleted.
    const _t = await db.get<Timers>(key);
    const _payload = _t.timers[id];
    if (!_payload) {
      console.warn(
        `Trying to activate timer with id ${id}, but it doesn't exist. It may have been deleted.`
      );
      return;
    }
    action(_payload);
    return removeTimer(db, id);
  };

  const fireTime = payload.triggerTime - Date.now();

  if (fireTime <= 0) {
    await fireAction();
    return null;
  }

  if (fireTime >= MAX_DELAY) {
    console.log(
      `Timer with id ${id} is far in the future; not scheduling it for now.`
    );
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

export async function shouldInitializeTimers(db: DB): Promise<boolean> {
  try {
    const timers = await db.get<Timers>(key);
    if (
      typeof timers !== "object" ||
      !("lastId" in timers) ||
      !("timers" in timers) ||
      typeof timers.timers !== "object"
    ) {
      return true;
    }
  } catch (e) {
    if (e.notFound) return true;
  }
  return false;
}

export async function initializeTimers(db: DB) {
  await db.put<Timers>(key, { lastId: 0, timers: {} });
}
