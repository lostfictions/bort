import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";

import * as level from "level";

import { DATA_DIR } from "../env";

import { markovReducers, addSentenceAction } from "../reducers/markov";
import { conceptReducers } from "../reducers/concepts";
import { recentsReducers } from "../reducers/recents";
import { seenReducers, SeenData } from "../reducers/seen";

import { WordBank } from "../components/markov";
import { ConceptBank } from "../commands/concepts";

const invalidDbNameRegex = /[^a-z0-9_-]+/i;
const dbNameReplacementRegex = /[^a-z0-9_-]/gi;
export function replaceDbName(dbName: string): string {
  return dbName.replace(dbNameReplacementRegex, "_");
}

interface Action {
  type: string;
}

type Reducer<S = any> = (state: S, action: Action) => S;

interface StoreConfig<T> {
  dbName: string;
  reducerTree: { [key in keyof T]: Reducer<T[key]> };
  defaultData: { [key in keyof T]: T[key] };
}

export class Store<T = StoreShape> {
  readonly db: level.LevelUp;
  readonly reducerTree: { [key in keyof T]: Reducer<T[key]> };

  initializer: Promise<void> | null = null;

  constructor({ dbName, reducerTree, defaultData }: StoreConfig<T>) {
    this.reducerTree = reducerTree;

    if (invalidDbNameRegex.test(dbName)) {
      throw new Error(`Invalid db name! Permitted characters: [a-zA-Z0-9_-]`);
    }

    const dbPath = Store.getEnsuredDbPath(dbName);

    let shouldInitialize = false;
    if (fs.existsSync(dbPath)) {
      const stat = fs.statSync(dbPath);
      if (!stat.isDirectory()) {
        throw new Error(`File exists at DB path, but it's not a directory!`);
      }
      console.log(`DB exists at path '${dbPath}', opening...`);
    } else {
      console.log(`No DB exists at path '${dbPath}', creating...`);
      shouldInitialize = true;
    }

    this.db = level(dbPath, { valueEncoding: "json" });
    if (shouldInitialize) {
      const puts = Object.entries(defaultData).map(([key, val]) =>
        this.db.put(key, val).then(() => {
          console.log(`Initialized "${key}" in DB with default values.`);
        })
      );
      this.initializer = Promise.all(puts).then(() => {
        console.log("Finished initializing DB.");
      });
    }
  }

  dispatch = async (action: Action): Promise<void> => {
    for (const [key, reducer] of Object.entries<Reducer>(this.reducerTree)) {
      let state: unknown;
      try {
        state = await this.db.get(key);
      } catch (e) {
        console.warn(`Can't get key "${key}" from DB:\n${e}`);
        return;
      }

      const nextState = reducer(state, action);
      if (nextState !== state) {
        await this.db.put(key, nextState);
      }
    }
  };

  get = <K extends keyof T>(key: K): Promise<T[K]> => this.db.get(key);

  private static readonly dbBasePath = path.join(DATA_DIR, "db");
  private static getEnsuredDbPath(dbName: string): string {
    if (!fs.existsSync(DATA_DIR)) {
      throw new Error(`Invalid data dir! "${DATA_DIR}"`);
    }
    const dbBasePathExists = fs.existsSync(this.dbBasePath);
    if (!dbBasePathExists) {
      fs.mkdirSync(this.dbBasePath);
    } else if (!fs.statSync(this.dbBasePath).isDirectory()) {
      throw new Error(
        `DB base path exists at "${this.dbBasePath}", but is not a directory!`
      );
    }

    return path.join(this.dbBasePath, dbName);
  }
}

interface StoreShape {
  wordBank: WordBank;
  concepts: ConceptBank;

  /**
   * a cache of recent responses to avoid repetition.
   *
   * maps from response -> time sent (in ms from epoch)
   */
  recents: { [uri: string]: number };

  /**
   * maps usernames to a tuple of the last message that user sent
   * and the date it was sent (in ms from epoch)
   */
  seen: { [username: string]: SeenData };
}

let defaultData: StoreShape;
export async function makeStore(dbName: string): Promise<Store<StoreShape>> {
  if (!defaultData) {
    defaultData = {
      wordBank: getInitialWordbank(),
      concepts: getInitialConcepts(),
      recents: {},
      seen: {}
    };
  }

  const store = new Store({
    dbName,
    reducerTree: {
      wordBank: markovReducers as Reducer,
      concepts: conceptReducers as Reducer,
      recents: recentsReducers as Reducer,
      seen: seenReducers as Reducer
    },
    defaultData
  });

  if (store.initializer) {
    await store.initializer;
  }

  return store;
}

function getInitialWordbank(): WordBank {
  const tarotLines: string[] = require("../../data/corpora").tarotLines;

  return tarotLines.reduce(
    (p, line) => markovReducers(p, addSentenceAction(line)),
    {} as WordBank
  );
}

function getInitialConcepts(): ConceptBank {
  const cb: any = {};

  const corpora = require("../../data/corpora");
  cb["punc"] = corpora.punc;
  cb["interjection"] = corpora.interjection;
  cb["adj"] = corpora.adj;
  cb["noun"] = corpora.noun;
  cb["digit"] = corpora.digit;
  cb["consonant"] = corpora.consonant;
  cb["vowel"] = corpora.vowel;
  cb["verb"] = corpora.verb.map(
    (v: { present: string; past: string }) => v.present
  );

  assert(Array.isArray(cb["punc"]));
  assert(Array.isArray(cb["interjection"]));
  assert(Array.isArray(cb["adj"]));
  assert(Array.isArray(cb["noun"]));
  assert(Array.isArray(cb["digit"]));
  assert(Array.isArray(cb["consonant"]));
  assert(Array.isArray(cb["vowel"]));
  assert(Array.isArray(cb["verb"]));

  return cb;
}
