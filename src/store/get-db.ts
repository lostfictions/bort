import fs from "fs";
import path from "path";

import level from "level";
import debug from "debug";

import { initializeConcepts } from "./methods/concepts";
import { initializeSeen, shouldInitializeSeen } from "./methods/seen";
import { initializeUnfold, shouldInitializeUnfold } from "./methods/unfold";
import {
  initializeRecents,
  shouldInitializeRecents,
  cleanRecents,
} from "./methods/recents";
import { initializeTimers, shouldInitializeTimers } from "./methods/timers";
import {
  initializeEmojiCount,
  shouldInitializeEmojiCount,
} from "./methods/emoji-count";

import { DATA_DIR } from "../env";

const log = debug("bort:store");

interface ReadStreamOptions {
  gt?: string;
  gte?: string;
  lt?: string;
  lte?: string;
  reverse?: boolean;
  limit?: number;
  keys?: boolean;
  values?: boolean;
  keyAsBuffer?: boolean;
  valueAsBuffer?: boolean;
}

export type DB = {
  get: <T = any>(key: string) => Promise<T>;
  put: <T = any>(key: string, value: T) => Promise<void>;
  del: (key: string) => Promise<void>;
  createKeyStream: (options?: ReadStreamOptions) => AsyncIterable<string>;
  createReadStream: <T = any>(
    options?: ReadStreamOptions
  ) => AsyncIterable<{ key: string; value: T }>;
};

const dbCache: { [id: string]: DB } = {};

/**
 * Get or create a store for a given ID. If you don't want different services or
 * channels to share a store, make sure it has a unique ID!
 * @param id The unique identifier for this store.
 */
export async function getDb(id: string): Promise<DB> {
  if (id.length < 1) {
    throw new Error("Invalid id for store!");
  }

  if (id in dbCache) {
    return dbCache[id];
  }

  const db = await loadOrInitializeDb(id);

  /* eslint-disable @typescript-eslint/no-misused-promises */
  const doClean = () =>
    cleanRecents(db).then(() => setTimeout(doClean, 60_000));
  setTimeout(doClean, 60_000);
  /* eslint-enable @typescript-eslint/no-misused-promises */

  dbCache[id] = db;
  return db;
}

const DB_BASE_PATH = path.join(DATA_DIR, "db");

function getEnsuredDbPath(dbName: string): string {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`Invalid data dir! "${DATA_DIR}"`);
  }

  if (!fs.existsSync(DB_BASE_PATH)) {
    fs.mkdirSync(DB_BASE_PATH);
  } else if (!fs.statSync(DB_BASE_PATH).isDirectory()) {
    throw new Error(
      `DB base path exists at "${DB_BASE_PATH}", but is not a directory!`
    );
  }

  return path.join(DB_BASE_PATH, dbName);
}

async function loadOrInitializeDb(dbName: string): Promise<DB> {
  const sanitizedDbName = dbName.replace(/[^a-z0-9_-]/gi, "_");
  const dbPath = getEnsuredDbPath(sanitizedDbName);

  let shouldInitialize = false;

  if (fs.existsSync(dbPath)) {
    if (!fs.statSync(dbPath).isDirectory()) {
      throw new Error(`File exists at DB path, but it's not a directory!`);
    }
    log(`DB exists at path '${dbPath}', opening...`);
  } else {
    log(`No DB exists at path '${dbPath}', creating...`);
    shouldInitialize = true;
  }

  const db = level(dbPath, { valueEncoding: "json" }) as DB;

  if (await shouldInitializeTimers(db)) {
    log(`Initializing timers for '${dbPath}'`);
    await initializeTimers(db);
  }
  if (await shouldInitializeSeen(db)) {
    log(`Initializing seen for '${dbPath}'`);
    await initializeSeen(db);
  }
  if (await shouldInitializeUnfold(db)) {
    log(`Initializing unfold for '${dbPath}'`);
    await initializeUnfold(db);
  }
  if (await shouldInitializeEmojiCount(db)) {
    log(`Initializing emoji count for '${dbPath}'`);
    await initializeEmojiCount(db);
  }
  if (await shouldInitializeRecents(db)) {
    log(`Initializing recents for '${dbPath}'`);
    await initializeRecents(db);
  }

  // no particular store shape to check, just add data if it's a new store
  if (shouldInitialize) {
    await initializeConcepts(db);
    log("Finished initializing DB.");
  }

  return db;
}
