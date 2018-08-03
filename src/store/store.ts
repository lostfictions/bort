import * as fs from "fs";
import * as path from "path";
import * as assert from "assert";

import { Map as ImmMap, fromJS } from "immutable";

import * as level from "level";

import { DATA_DIR } from "../env";

import { markovReducers, addSentenceAction } from "../reducers/markov";
import { conceptReducers } from "../reducers/concepts";
import { recentsReducers } from "../reducers/recents";
import { seenReducers, SeenData } from "../reducers/seen";

import { WordBank } from "../components/markov";
import { ConceptBank } from "../commands/concepts";

const invalidDbNameRegex = /[^a-z0-9_-]+/i;

// TODO: get rid of immutable

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

    const dbPath = Store.dbPath(dbName);

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
      const puts = Object.entries(defaultData).map((key, val) =>
        this.db.put(key, val)
      );
      this.initializer = Promise.all(puts).then(() => {});
    }
  }

  dispatch = async (action: Action): Promise<void> => {
    for (const [key, reducer] of Object.entries<Reducer>(this.reducerTree)) {
      let value: any;
      try {
        value = await this.db.get(key);
      } catch (e) {
        console.warn(`Can't get key "${key}" from DB:\n${e}`);
        return;
      }

      // TEMP: remove immutable
      const immVal = fromJS(value);
      if (!ImmMap.isMap(immVal)) {
        console.warn(
          `Returned value for key ${key} did not translate to an immutable map!`
        );
        console.warn("Original value:");
        console.dir(value);
      }

      const nextState = reducer(immVal, action);
      if (nextState !== immVal) {
        await this.db.put(key, nextState);
      }
    }
  };

  get = async <K extends keyof T>(key: K): Promise<T[K]> => {
    const value = await this.db.get(key);

    const immVal = fromJS(value);
    if (!ImmMap.isMap(immVal)) {
      console.warn(
        `Returned value for key ${key} did not translate to an immutable map!`
      );
      console.warn("Original value:");
      console.dir(value);
    }
    return immVal;
  };

  // static async exists(dbName: string): Promise<boolean | string> {
  //   const dbPath = Store.dbPath(dbName);

  //   if (!fs.existsSync(dbPath)) {
  //     return false;
  //   }

  //   const stat = fs.statSync(dbPath);
  //   if (!stat.isDirectory()) {
  //     return `File "${dbPath}" exists, but it's not a directory!`;
  //   }

  //   try {
  //     await level(dbPath, { createIfMissing: false, valueEncoding: "json" });
  //   } catch (e) {
  //     return `Error opening DB: ${e}`;
  //   }

  //   return true;
  // }

  private static dbPath(dbName: string): string {
    return path.join(DATA_DIR, "db", dbName);
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
  recents: ImmMap<string, number>;

  /**
   * maps usernames to a tuple of the last message that user sent
   * and the date it was sent (in ms from epoch)
   */
  seen: ImmMap<string, SeenData>;
}

let defaultData: StoreShape;
export function makeStore(dbName: string): Store<StoreShape> {
  if (!defaultData) {
    defaultData = ImmMap<string, any>({
      wordBank: getInitialWordbank(),
      concepts: getInitialConcepts(),
      recents: ImmMap<string, number>(),
      seen: ImmMap<string, SeenData>()
    }) as any; // FIXME
  }

  return new Store({
    dbName,
    reducerTree: {
      wordBank: markovReducers as Reducer,
      concepts: conceptReducers as Reducer,
      recents: recentsReducers as Reducer,
      seen: seenReducers as Reducer
    },
    defaultData
  });
}

function getInitialWordbank(): WordBank {
  const tarotLines: string[] = require("../../data/corpora").tarotLines;

  return tarotLines.reduce<WordBank>(
    (p, line) => markovReducers(p, addSentenceAction(line)),
    ImmMap<string, ImmMap<string, number>>()
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

  return fromJS(cb) as ConceptBank;
}
